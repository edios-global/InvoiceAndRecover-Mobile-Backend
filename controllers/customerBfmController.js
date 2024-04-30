import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';

import sendTwilioMessage, { encryptPassword, generateOtp, generateSearchParameterList, sendEmail } from '../routes/genericMethods.js';
import Customer from '../models/customerBfmModel.js';
import { createRequire } from 'module';
import Templates from '../models/templatesModel.js';
import BusinessUsers from '../models/businessUsersModel.js';
import jwt from "jsonwebtoken";
const require = createRequire(import.meta.url);
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);




const addCustomer = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    post.phoneNumber = post.phoneNumber.replace(/[ -]/g, "");
    if (post.customerType === "Business" && post.businessName && post.businessID !== "" && post.businessName && post.businessID !== undefined) {
      const checkIfBusinessNameAlreadyExist = await Customer.find({ businessName: { '$regex': '^' + post.businessName.trim() + '$', '$options': 'i' } });
      if (checkIfBusinessNameAlreadyExist.length > 0) {
        let successResponse = genericResponse(false, "Business Name Already Exist.", []);
        res.status(201).json(successResponse);
        return;
      }
      const checkIfBusinessIDAlreadyExist = await Customer.find({ businessID: { '$regex': '^' + post.businessID.trim() + '$', '$options': 'i' } });
      if (checkIfBusinessIDAlreadyExist.length > 0) {
        let successResponse = genericResponse(false, "ABN Already Exist.", []);
        res.status(201).json(successResponse);
        return;
      }
      const checkIfWebsiteAlreadyExist = await Customer.find({ customerCode: { '$regex': '^' + post.customerCode.trim() + '$', '$options': 'i' } });
      if (checkIfWebsiteAlreadyExist.length > 0) {
        let successResponse = genericResponse(false, "Customer Code Already Exist.", []);
        res.status(201).json(successResponse);
        return;
      }
    }
    const checkIfEmailAlredyExist = await Customer.find({ emailAddress: post.emailAddress });
    if (checkIfEmailAlredyExist.length > 0) {
      let successResponse = genericResponse(false, "Email Address Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    const checkIfMobileAlreadyExist = await Customer.find({ phoneNumber: post.phoneNumber });
    if (checkIfMobileAlreadyExist.length > 0) {
      let successResponse = genericResponse(false, "Mobile Number Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    const customer = await stripe.customers.create({
      name: post.firstName + " " + post.lastName,
      email: post.emailAddress,
    });
    post.gatewayUserID = customer.id
    post.registrationDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "I";

    const addedCustomer = await new Customer(post).save();
    if (addedCustomer._id !== null) {
      let successResponse = genericResponse(true, "add Customer added successfully.", []);
      res.status(201).json(successResponse);
      return;
    } else {
      let errorRespnse = genericResponse(false, error.message, []);
      res.status(200).json(errorRespnse);
      return;
    }
  } catch (error) {
    console.log(error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchCustomer = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
    var sort = {};
    if (post.filterValues != undefined && post.filterValues != '')
      query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);

    let fetchQuery = [
      {
        $project: {
          customerType: "$customerType",
          businessName: "$businessName",
          businessID: "$businessID",
          businessUserID: "$businessUserID",
          firstName: "$firstName",
          lastName: "$lastName",
          customerStatus: "$customerStatus",
          createdDate: 1,
          customerName: { $concat: ["$firstName", " ", "$lastName"] }
        }
      },
      { $match: query }
    ];
    if (post.sortingType && post.sortingField) {
      var sortField = post.sortingField;
      sort[sortField] = post.sortingType;

      fetchQuery.push({ $sort: sort });
    } else {
      sort = { createdDate: -1 }
    }
    let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
    if (post.customerStatus !== "All") {
      query.customerStatus = post.customerStatus;
      fetchQuery.push({ $match: query });
    }
    let myAggregation = Customer.aggregate()
    myAggregation._pipeline = fetchQuery
    Customer.aggregatePaginate(
      myAggregation,
      options,
      (err, result) => {
        if (err) {
          const errorResponse = genericResponse(false, "Unable to fetch", []);
          res.status(400).json(errorResponse);

        } else {
          const successResponse = genericResponse(true, "Customer fetched successfully", result);
          res.status(200).json(successResponse);

        }
      }
    );
  } catch (error) {
    console.log("error in fetch Customer =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchCustomerById = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post._id) };
    const fetchCustomer = await Customer.find(query);
    if (fetchCustomer.length > 0) {
      let successResponse = genericResponse(true, "fetchCustomerById fetched successfully.", fetchCustomer);
      res.status(201).json(successResponse);
    } else {
      let errorRespnse = genericResponse(false, "Something went wrong, Try again!", []);
      res.status(200).json(errorRespnse);
      return;
    }
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateCustomer = asyncHandler(async (req, res) => {
  try {


    const post = req.body;

    console.log("sdfdfsdf", post)

    if (req.body.customerType === "Business" && req.body.businessName && req.body.businessID !== "" && req.body.businessName && req.body.businessID !== undefined) {
      const checkIfBusinessNameAlreadyExist = await Customer.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, businessName: { '$regex': '^' + req.body.businessName.trim() + '$', '$options': 'i' }, });
      if (checkIfBusinessNameAlreadyExist.length > 0) {
        let successResponse = genericResponse(false, "Business name already Exist.", []);
        res.status(201).json(successResponse);
        return;
      }
      const checkIfBusinessIDAlreadyExist = await Customer.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, businessID: req.body.businessID });

      if (checkIfBusinessIDAlreadyExist.length > 0) {

        let successResponse = genericResponse(false, "ABN Already Exist.", []);
        res.status(201).json(successResponse);
        return;
      }
      const checkIfWebsiteAlreadyExist = await Customer.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, customerCode: { '$regex': '^' + post.customerCode.trim() + '$', '$options': 'i' } });
      if (checkIfWebsiteAlreadyExist.length > 0) {
        let successResponse = genericResponse(false, "Customer Code Already Exist.", []);
        res.status(201).json(successResponse);
        return;
      }
    }
    const checkIfEmailAlredyExist = await Customer.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, emailAddress: req.body.emailAddress });
    const checkIfMobileAlreadyExist = await Customer.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, phoneNumber: req.body.phoneNumber })
    if (checkIfEmailAlredyExist.length > 0) {
      let successResponse = genericResponse(false, "Email Address Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    if (checkIfMobileAlreadyExist.length > 0) {
      let successResponse = genericResponse(false, "Mobile Number Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    if (post.newPassword !== "" && post.newPassword !== undefined) {
      await encryptPassword(post.newPassword).then(data => {
        post.password = data;
      }).catch((error) => {
        console.log("Password encryption error:", error);
        return;
      });
      const fetchOldPass = await Customer.find({ _id: mongoose.Types.ObjectId(req.body._id), password: post.password })
      if (fetchOldPass.length > 0) {
        let successResponse = genericResponse(false, "You Can't Set Old Password as New Password", []);
        res.status(200).json(successResponse);
        return
      }

    }

    post.recordType = 'U';
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

    const updateParameter = await Customer.updateOne({ _id: mongoose.Types.ObjectId(req.body._id) }, { $set: post });
    // if (updateParameter.modifiedCount > 0) {
    let successResponse = genericResponse(true, "Customer  updated successfully.", []);
    res.status(200).json(successResponse);

  } catch (error) {
    console.log("snjksajkdsa", error.message)
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const deleteCustomer = asyncHandler(async (req, res) => {
  try {
    if (req.body._id.length > 0) {
      const fetchedCustomer = await Customer.deleteMany({ _id: { $in: req.body._id } });
      let successResponse = genericResponse(true, "Customer deleted successfully.", []);
      res.status(200).json(successResponse);
    } else {
      let successResponse = genericResponse(false, "Please Select Atleast One Record!", []);
      res.status(200).json(successResponse);

    }


  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});
const customerSignUp = asyncHandler(async (req, res) => {
  const post = req.body;
  post.phoneNumber = post.phoneNumber.replace(/[ -]/g, "");
  try {
    let saveCustomer = true
    if (post.customerType === "Business" && post.businessName && post.businessID !== "" && post.businessName && post.businessID !== undefined) {
      const checkIfBusinessNameAlreadyExist = await Customer.find({ businessName: { '$regex': '^' + post.businessName.trim() + '$', '$options': 'i' } });
      if (checkIfBusinessNameAlreadyExist.length > 0) {
        let successResponse = genericResponse(false, "Business Name Already Exist.", []);
        res.status(201).json(successResponse);
        return;
      }
      const checkIfBusinessIDAlreadyExist = await Customer.find({ businessID: { '$regex': '^' + post.businessID.trim() + '$', '$options': 'i' } });
      if (checkIfBusinessIDAlreadyExist.length > 0) {
        let successResponse = genericResponse(false, "Business ID Already Exist.", []);
        res.status(201).json(successResponse);
        return;
      }
    }
    let emailQuery = { emailAddress: post.emailAddress }
    const checkIfEmailAlredyExist = await Customer.find(emailQuery);
    if (checkIfEmailAlredyExist.length > 0) {

      if (checkIfEmailAlredyExist.customerStatus === "New") {
        let successResponse = genericResponse(false, "Email Address Already Exist.", []);
        res.status(201).json(successResponse);
        return;
      } else {
        saveCustomer = false
      }

    }
    const checkIfMobileAlreadyExist = await Customer.find({ phoneNumber: post.phoneNumber });
    if (checkIfMobileAlreadyExist.length > 0) {
      let successResponse = genericResponse(false, "Mobile Number Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }

    const password = post.userPassword;
    await encryptPassword(password).then(data => {
      post.password = data;
    }).catch((error) => {
      console.log("Password encryption error:", error);
      return;
    });
    let mobileOTPForTemp;
    await generateOtp().then(data => {
      post.mobileOTP = data;
      mobileOTPForTemp = data;
    }).catch((error) => {
      console.log("Password encryption error:", error);
      return;
    });
    await encryptPassword(post.mobileOTP).then(data => {
      post.mobileOTP = data;
    }).catch((error) => {
      console.log("mobileOTP encryption error:", error);
      return;
    });
    let emailOTPForTemp
    await generateOtp().then(data => {
      post.emailOTP = data;
      emailOTPForTemp = data;
    }).catch((error) => {
      console.log("generateOtp error:", error);
      return;
    });
    await encryptPassword(post.emailOTP).then(data => {
      post.emailOTP = data;
    }).catch((error) => {
      console.log("emailOTP encryption error:", error);
      return;
    });
    let smsTemplate;
    let emailBody;
    let emailSubject;
    const templateQuery = {
      templateStatus: 'Active', templateName: { $in: ["SignupOTPEmailNotification", "SignupOTPSMSNotification"] }
    };
    const fetchedTemplates = await Templates.find(templateQuery);
    if (fetchedTemplates.length > 0) {
      fetchedTemplates.forEach((val) => {
        if (val.templateName === 'SignupOTPEmailNotification') {
          val.templateSubject = val.templateSubject.replaceAll('[FirstName]', post.firstName);
          val.templateSubject = val.templateSubject.replaceAll('[LastName]', post.lastName);
          emailSubject = val.templateSubject;

          val.templateMessage = val.templateMessage.replaceAll('[FirstName]', post.firstName);
          val.templateMessage = val.templateMessage.replaceAll('[LastName]', post.lastName);
          val.templateMessage = val.templateMessage.replaceAll('[OTP]', emailOTPForTemp);
          emailBody = val.templateMessage;
          sendEmail(post.emailAddress, emailSubject, emailBody);
        }
        else if (val.templateName === 'SignupOTPSMSNotification') {
          val.templateMessage = val.templateMessage.replaceAll('[FirstName]', post.firstName);
          val.templateMessage = val.templateMessage.replaceAll('[LastName]', post.lastName);
          val.templateMessage = val.templateMessage.replaceAll('[OTP]', mobileOTPForTemp);
          smsTemplate = val.templateMessage;
          sendTwilioMessage(post.phoneNumber, smsTemplate);
        }

      });
    }

    const customer = await stripe.customers.create({
      name: post.firstName + " " + post.lastName,
      email: post.emailAddress,
    });
    post.gatewayUserID = customer.id
    post.customerStatus = "New"
    post.firstTimeUser = 0
    post.registrationDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "I";

    console.log("post", post)


    if (saveCustomer) {
      await new Customer(post).save();
    } else {
      await Customer.updateOne(emailQuery, { $set: post });
    }

    let successResponse = genericResponse(true, "add Customer added successfully.", []);
    res.status(201).json(successResponse);
    return;

  } catch (error) {
    console.log(error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }

});

const validateOTP = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("dasda", post)
    const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var planExpiryDate = new Date(new Date(new Date() - (new Date().getTimezoneOffset() * 60000)).setUTCHours(23, 59, 59, 999));
    if (post.emailOTP !== "" && post.emailOTP !== undefined) {
      const validateEmailOTP = await Customer.find({ phoneNumber: post.phoneNumber, emailOTP: post.emailOTP })
      if (validateEmailOTP.length === 0) {
        let successResponse = genericResponse(false, "Incorrect Email OTP", []);
        res.status(200).json(successResponse);
        return
      }

    }

    const validateMobileOTP = await Customer.find({ phoneNumber: post.phoneNumber, mobileOTP: post.mobileOTP })
    if (validateMobileOTP.length === 0) {
      let successResponse = genericResponse(false, "Incorrect Mobile OTP", []);
      res.status(200).json(successResponse);
      return
    }
    await Customer.updateOne({ phoneNumber: post.phoneNumber }, { $set: { customerStatus: "Active" } })
    let successResponse = genericResponse(true, "Validate Successfully!", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in forgotPassword=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const checkLoginDetails = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    post.phoneNumber = post.phoneNumber.replace(/[ -]/g, "");
    const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var planExpiryDate = new Date(new Date(new Date() - (new Date().getTimezoneOffset() * 60000)).setUTCHours(23, 59, 59, 999));

    const fetch = await Customer.find({ phoneNumber: post.phoneNumber });
    if (fetch.length > 0) {
      if (fetch[0].customerStatus === "Inactive") {
        let successResponse = genericResponse(false, "User is Inactive", []);
        res.status(200).json(successResponse);
        return
      }
    }

    await encryptPassword(post.userPassword).then(data => {
      post.password = data;
    }).catch((error) => {
      console.log("emailOTP encryption error:", error);
      return;
    });

    const validateUser = await Customer.find({ phoneNumber: post.phoneNumber, password: post.password }).select('-mobileOTP -emailOTP -password -createdDate -lastModifiedDate -createdBy -recordType -lastModifiedDate')



    if (validateUser.length > 0) {
      let payload = {
        _id: validateUser[0]._id,
      }

      jwt.sign(payload, process.env.JWT_SECRET_TOKEN, { expiresIn: "3h" }, (err, token) => {
        if (token) {
          let successResponse = genericResponse(true, "User logged in successfully.", { data: validateUser, token: token });
          res.status(200).json(successResponse);
        } else {
          let successResponse = genericResponse(false, "Something Went Wrong!",);
          res.status(200).json(successResponse);
        }

      })
    } else {
      let successResponse = genericResponse(false, "Please Enter Valid Mobile Number & Password.", []);
      res.status(200).json(successResponse);
      return


    }


  } catch (error) {
    console.log("error in forgotPassword=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const fetchShippingCompany = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const fetchUser = await BusinessUsers.find({ businessUserStatus: "Active" }, { companyName: 1, companyCity: 1 })
    let errorResponse = genericResponse(true, "Data fetch Successfully!", fetchUser);
    res.status(200).json(errorResponse)
  }
  catch (error) {
    console.log("Catch in validateReferralCode: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
})


const resendOTP = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    post.phoneNumber = post.phoneNumber.replace(/[ -]/g, "");
    let query = { phoneNumber: post.phoneNumber }
    const checkUser = await Customer.find(query)
    if (checkUser.length === 0) {
      let successResponse = genericResponse(false, "User Doesn't Exists!", []);
      res.status(200).json(successResponse)
      return
    }
    let smsTemplate;
    let emailBody;
    let emailSubject;
    const templateQuery = {
      templateStatus: 'Active', templateName: { $in: ["SignupOTPEmailNotification", "SignupOTPSMSNotification"] }
    };
    const fetchedTemplates = await Templates.find(templateQuery);
    if (fetchedTemplates.length > 0) {
      fetchedTemplates.forEach((val) => {
        if (val.templateName === 'SignupOTPEmailNotification') {
          val.templateSubject = val.templateSubject.replaceAll('[FirstName]', checkUser[0].firstName);
          val.templateSubject = val.templateSubject.replaceAll('[LastName]', checkUser[0].lastName);
          emailSubject = val.templateSubject;
          val.templateMessage = val.templateMessage.replaceAll('[FirstName]', checkUser[0].firstName);
          val.templateMessage = val.templateMessage.replaceAll('[LastName]', checkUser[0].lastName);
          val.templateMessage = val.templateMessage.replaceAll('[OTP]', checkUser[0].emailOTP);
          emailBody = val.templateMessage;
        }
        else if (val.templateName === 'SignupOTPSMSNotification') {
          val.templateMessage = val.templateMessage.replaceAll('[FirstName]', checkUser[0].firstName);
          val.templateMessage = val.templateMessage.replaceAll('[LastName]', checkUser[0].lastName);
          val.templateMessage = val.templateMessage.replaceAll('[OTP]', checkUser[0].mobileOTP);
          smsTemplate = val.templateMessage;
        }

      });

    }
    if (post.sendOtpTo === "Mobile") {
      sendTwilioMessage(post.phoneNumber, smsTemplate);
    } else {
      sendEmail(post.emailAddress, emailSubject, emailBody);
    }
    let successResponse = genericResponse(true, "OTP Send Successfully!", []);
    res.status(200).json(successResponse)
  }
  catch (error) {
    console.log("Catch in resendOTP: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
})

const fetchCustomerProfile = asyncHandler(async (req, res) => {
  try {
    const post = req.body

    const fetchCustomer = await Customer.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(post.customerID) } },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "countries"
        }
      },
      {
        $unwind: "$countries"
      },
      {
        $lookup: {
          from: "country_states",
          localField: "stateId",
          foreignField: "_id",
          as: "countryStates"
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          city: 1,
          streetAddress: 1,
          zipCode: 1,
          phoneNumber: 1,
          emailAddress: 1,
          countryName: "$countries.countryName",
          stateName: "$countryStates.stateName",
          countryId: "$countries._id",
          stateId: "$countryStates._id",
        }
      }
    ])
    if (fetchCustomer.length > 0) {
      let successResponse = genericResponse(true, "Profile Fetched Successfulluy!", fetchCustomer);
      res.status(200).json(successResponse)
    } else {
      let successResponse = genericResponse(false, "Profile Fetched Successfulluy!", []);
      res.status(200).json(successResponse)
    }




  } catch (error) {
    console.log("Catch in fetchCustomerByID: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }

})

const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    post.phoneNumber = post.phoneNumber.replace(/[ -]/g, "");
    const fetch = await Customer.find({ phoneNumber: post.phoneNumber, mobileOTP: post.mobileOTP })
    if (fetch.length > 0) {
      let successResponse = genericResponse(true, "OTP Validate Successfully!", []);
      res.status(200).json(successResponse)
      return
    } else {
      let successResponse = genericResponse(false, "Inavlid OTP ", []);
      res.status(200).json(successResponse)
      return
    }
  } catch (error) {
    console.log("Catch in fetchCustomerByID: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }

})
const setPassword = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    post.phoneNumber = post.phoneNumber.replace(/[ -]/g, "")
    await encryptPassword(post.confirmPassword).then(data => {
      post.password = data;
    }).catch((error) => {
      console.log("Password encryption error:", error);
      return;
    });
    console.log("sadasd", post)
    await Customer.updateOne({ phoneNumber: post.phoneNumber, mobileOTP: post.mobileOTP }, { password: post.password })
    let successResponse = genericResponse(true, "OTP Validate Successfully!", []);
    res.status(200).json(successResponse)
    return


  } catch (error) {
    console.log("Catch in fetchCustomerByID: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }

})





export {
  addCustomer,
  fetchCustomer,
  fetchCustomerById,
  updateCustomer,
  deleteCustomer,
  customerSignUp,
  validateOTP,
  checkLoginDetails, fetchShippingCompany, resendOTP, fetchCustomerProfile, forgotPassword, setPassword,



}