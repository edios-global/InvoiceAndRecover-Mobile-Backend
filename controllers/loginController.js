import asyncHandler from 'express-async-handler'
import BusinessUsers from '../models/businessUsersModel.js';
import sendTwilioMessage, { decryptPassword, encryptPassword, generateOtp, generatePassword, generateTempPassword, sendEmail, sendMailBySendGrid, updateToObjectType } from '../routes/genericMethods.js';
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import Users from '../models/UsersModel.js';
import Roles from '../models/rolesModel.js';
import businessLocation from '../models/businessLocationModel.js';
import SubscriptionPlan from '../models/subscriptionPlansModel.js';
import BusinessUserPlans from '../models/businessUserPlansModel.js';
import PlanFeatures from '../models/planFeaturesModel.js';
import BusinessUserPlanFeatures from '../models/businessUserPlanFeaturesModel.js';
import PlanFeaturesSlab from '../models/planFeaturesSlabModel.js';
import BusinessUserPlanFeatureSlabs from '../models/businessUserPlanFeaturesSlabModel.js';
import Templates from '../models/templatesModel.js';
import AffiliateProgram from '../models/affilateProgramUsersModel.js';
import parameterSettings from '../models/ParameterSettingModel.js';
import { createRequire } from 'module';
import jwt from "jsonwebtoken";
import { log } from 'console';
import DefaultSetting from '../models/defaultSettingsModel.js';
import country from '../models/countryModel.js';
import CurrencyList from '../routes/genericCurrencyList.js';
const require = createRequire(import.meta.url);
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { OAuth2Client } = require('google-auth-library');

//For Mobile by Gourav 
const addCustomerForMobileApi = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    let isEmailAlreadyVerified = post.isEmailVerified ? true : false;

    console.log("addCustomerByMobile -- post", post);

    var existingUser = {};

    var saveBusinessUser = true;
    // note : may be post.mobileNumberExist is verified already not need to check again here
    // if (post.mobileNumberExist) {
    const phoneNumberQuery = { phoneNumber: post.phoneNumber };
    let checkIfBusinessUserPhoneNumberAlredyExist = await BusinessUsers.find(phoneNumberQuery);

    if (checkIfBusinessUserPhoneNumberAlredyExist.length > 0 && checkIfBusinessUserPhoneNumberAlredyExist[0].businessUserStatus !== 'New' && checkIfBusinessUserPhoneNumberAlredyExist[0]?.verificationStatus !== 1) {
      let errorRespnse = genericResponse(false, "Phone Number Already Exist.", []);
      res.status(200).json(errorRespnse);
      return;
    }
    // }
    var query1 = { emailAddress: post.emailAddress };
    var checkIfBusinessUserEmailAlredyExist = await BusinessUsers.find(query1);
    if (checkIfBusinessUserEmailAlredyExist.length > 0) {
      existingUser = checkIfBusinessUserEmailAlredyExist[0];
      if (existingUser.businessUserStatus !== 'New' && existingUser?.verificationStatus !== 1) {
        let errorRespnse = genericResponse(false, "Duplicate Email error, User Email already exists!", []);
        res.status(200).json(errorRespnse);
        return;
      }
      else {
        saveBusinessUser = false;
      }
    }

    var checkIfUserEmailAlredyExist = await Users.find(query1);
    if (checkIfUserEmailAlredyExist.length > 0 && existingUser?.verificationStatus !== 1) {

      let errorRespnse = genericResponse(false, "Duplicate Email error, User Email already exists!", []);
      res.status(200).json(errorRespnse);
      return;
    }


    // if(!isEmailVerified)
    var emailOTPForTemp;
    await generateOtp().then(data => {
      post.emailOTP = data;
      emailOTPForTemp = data;
    }).catch((error) => {
      console.log("generateOtp error:", error);
      return;
    });
    console.log("emailOTP ", post.emailOTP);

    await encryptPassword(post.emailOTP).then(data => {
      post.emailOTP = data;
    }).catch((error) => {
      console.log("emailOTP encryption error:", error);
      return;
    });
    //  if (!isPhoneVerified)
    let mobileOTPForTemp;
    await generateOtp().then(data => {
      post.mobileOTP = data;
      mobileOTPForTemp = data;
    }).catch((error) => {
      console.log("Password encryption error:", error);
      return;
    });
    console.log("mobileOTP ", post.mobileOTP);

    await encryptPassword(post.mobileOTP).then(data => {
      post.mobileOTP = data;
    }).catch((error) => {
      console.log("mobileOTP encryption error:", error);
      return;
    });


    const customer = await stripe.customers.create({
      name: post.firstName + " " + post.lastName,
      email: post.emailAddress,
    });
    post.gatewayUserID = customer.id;
    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

    if (saveBusinessUser) {
      let userData = await new BusinessUsers(post).save();
      console.log('User Details saved in Business User.', userData);
    }
    else {
      const updatedBusinessUser = await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(existingUser._id) }, { $set: post });
      console.log('User Details Updated in Business User: ', updatedBusinessUser.nModified === 1 ? 'Success' : 'Failed');
    }

    const templateQuery = {
      templateStatus: 'Active',
      $or: [{ templateName: 'SignupOTPEmailNotification' }, { templateName: 'SignupOTPSMSNotification' }]
    };
    const fetchedTemplates = await Templates.find(templateQuery);
    let emailSubject = '';
    let emailBody = '';
    let smsTemplate = ''

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
          if (isEmailAlreadyVerified) {
            return console.log("Email Already Verified.");
          } else {
            if (checkIfBusinessUserEmailAlredyExist[0]?.verificationStatus !== 1) {
              sendEmail(post.emailAddress, emailSubject, emailBody);
            }
          }
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

    return res.status(201).json(genericResponse(true, "OTP sent successfully", []));

  } catch (error) {
    console.log("Catch in addCustomerByMobile: ", error);
    return res.status(400).json(genericResponse(false, error.message, []));
    ;
  }
});

const validateOTPForMobileApi = asyncHandler(async (req, res) => {
  try {
    const post = req.body;

    // post.isEmailVerified === false
    // console.log('post.isEmailVerified', post.isEmailVerified);
    console.log('validateOTPForMobileApi post', post);

    if (post.isEmailVerified && post.isEmailVerified !== undefined) {
      console.log("post.isEmailVerified", post.isEmailVerified);
      if (!post.eMailOTP)
        return res.status(200).json(genericResponse(false, 'Email OTP is missing', []));
      if (!post.emailAddress)
        return res.status(200).json(genericResponse(false, 'Email Address is missing', []));
    }
    if (!post.userPassword)
      return res.status(200).json(genericResponse(false, 'user Password is missing', []));

    if (!post.mobileOTP)
      return res.status(200).json(genericResponse(false, 'Mobile OTP is missing', []));

    if (!post.phoneNumber)
      return res.status(200).json(genericResponse(false, 'Phone Number is missing', []));

    if (post.eMailOTP) {
      post.emailOTP = post.eMailOTP;
    }

    const query = {
      businessUserStatus: 'New',
      phoneNumber: post.phoneNumber,
    };

    const cleanedPhoneNumber = post.phoneNumber.replace(/\D/g, ''); // Remove non-numeric characters from the provided phone number

    const query2 = {
      businessUserStatus: 'New',
      phoneNumber: { $regex: new RegExp(cleanedPhoneNumber) } // Use a regex to find matching phone numbers
    };
    // const query = { businessUserStatus: 'New', phoneNumber: post.phoneNumber };
    // Include emailAddress in the query if provided
    if (post.emailAddress) {
      query.emailAddress = post.emailAddress;
    }
    // Encrypt mobileOTP
    try {
      post.mobileOTP = await encryptPassword(post.mobileOTP);
      query.mobileOTP = post.mobileOTP;
      console.log("query.mobileOTP", query.mobileOTP);
    } catch (error) {
      console.log("mobileOTP encryption error:", error);
    }
    // Encrypt emailOTP if needed
    if (post.isEmailVerified === false && post.emailOTP) {
      try {
        post.emailOTP = await encryptPassword(post.emailOTP);
        query.emailOTP = post.emailOTP;
        console.log("query.emailOTP", query.emailOTP);
      } catch (error) {
        console.log("emailOTP encryption error:", error);
      }
    }
    console.log("validateOTPForMobileApi query:", query);
    const fetchedValidBusinessUsers = await BusinessUsers.aggregate([
      {
        $match: query
      },
      {
        $project: {
          firstName: 1, lastName: 1, phoneNumber: 1, emailAddress: 1,
        }
      },
    ]);

    console.log('fetchedValidBusinessUsers Records: ', fetchedValidBusinessUsers);

    const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    if (fetchedValidBusinessUsers.length > 0) {
      var queryRole = { defaultPlanRole: "Yes", roleName: "Admin", roleDescription: "This is the Admin Role of Free Plan" }
      const fetchRoles = await Roles.find(queryRole)
      if (!fetchRoles) {
        return res.status(200).json(genericResponse(false, 'Role is not found', []));
      }
      console.log('fetchRoles0:', fetchRoles);
      const newChanges = {};
      newChanges.userRegistrationDate = currentDate;
      newChanges.businessUserStatus = 'Active';
      newChanges.lastModifiedDate = currentDate;
      newChanges.recordType = "U";
      newChanges.wizardStatusFlag = 0;
      const query = { _id: mongoose.Types.ObjectId(fetchedValidBusinessUsers[0]._id) };
      var newValues = { $set: newChanges }

      const updatedBusinessUser = await BusinessUsers.updateOne(query, newValues);
      const asfsd = await BusinessUsers.find(query)
      console.log('fetch asfsd wizardStatusFlag', asfsd[0].wizardStatusFlag)
      const validBusinessUser = fetchedValidBusinessUsers[0];
      validBusinessUser.businessUserID = validBusinessUser._id;
      validBusinessUser._id = undefined;
      validBusinessUser.createdDate = currentDate;
      validBusinessUser.firstTimeUser = 0;
      validBusinessUser.userStatus = "Active";
      validBusinessUser.userType = "Business";


      console.log('fetchRoles:', fetchRoles);
      if (fetchRoles) {
        validBusinessUser.roleID = fetchRoles[0]._id
      }
      console.log("post.userPassword", post.userPassword);
      await encryptPassword(post.userPassword).then(data => {
        validBusinessUser.userPassword = data;
        console.log("validBusinessUser.userPassword", validBusinessUser.userPassword);
      }).catch((error) => {
        console.log("Password encryption error:", error);
        return;
      });
      const addUser = new Users(validBusinessUser);
      const addedUsers = await addUser.save(post);
      if (addedUsers._id) {
        return res.status(200).json(genericResponse(true, 'User Register Successfully', { userId: addedUsers._id }));
      } else {
        return res.status(202).json(genericResponse(false, 'User not Register Successfully', []));
      }


    }
    else {
      console.log("Starting.. to fetch Active Business User.");
      // const cleanedPhoneNumber = post.phoneNumber.replace(/\D/g, ''); // Remove non-numeric characters from the provided phone number

      // const query = {
      //   businessUserStatus: 'Active',
      //   phoneNumber: { $regex: new RegExp(cleanedPhoneNumber) } // Use a regex to find matching phone numbers
      // };
      const query = { businessUserStatus: 'Active', phoneNumber: post.phoneNumber };
      const fetchedValidBusinessUsers = await BusinessUsers.aggregate([
        { $match: query },
        {
          $project: {
            firstName: 1, lastName: 1, phoneNumber: 1, emailAddress: 1, emailOTP: 1, mobileOTP: 1, verificationStatus: 1, wizardStatusFlag: 1
          }
        },
      ]);
      console.log("fetchedValidBusinessUsers ActiveRecord: ", fetchedValidBusinessUsers);
      if (fetchedValidBusinessUsers.length > 0) {
        console.log(post.mobileOTP);
        console.log(fetchedValidBusinessUsers[0].mobileOTP);
        if (fetchedValidBusinessUsers[0].mobileOTP === post.mobileOTP) {
          let successResponse = genericResponse(true, "Verified Successfully!", fetchedValidBusinessUsers);
          res.status(200).json(successResponse);

        } else {
          let successResponse = genericResponse(false, "Mobile OTP not matched.", []);
          res.status(202).json(successResponse);
        }

      }
      else {
        console.log("fetchedValidBusinessUsers Record not found")
        let successResponse = genericResponse(false, "User not found!", []);
        res.status(202).json(successResponse);
      }
    }
  } catch (error) {
    console.log("Error in validateOTPByMobile: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(404).json(errorRespnse);
  }
});
//======> old version from 22.02.2024 12.54
// const validateOTPForMobileApi = asyncHandler(async (req, res) => {
//   try {
//     const post = req.body;
//     console.log('validateOTPForMobileApi post', post);
//     if (post.isEmailVerified && post.isEmailVerified !== undefined) {
//       console.log("post.isEmailVerified", post.isEmailVerified);
//       if (!post.eMailOTP)
//         return res.status(200).json(genericResponse(false, 'Email OTP is missing', []));

//       if (!post.emailAddress)
//         return res.status(200).json(genericResponse(false, 'Email Address is missing', []));
//     }
//     if (!post.mobileOTP)
//       return res.status(200).json(genericResponse(false, 'Mobile OTP is missing', []));

//     if (!post.phoneNumber)
//       return res.status(200).json(genericResponse(false, 'Phone Number is missing', []));

//     if (post.eMailOTP) {
//       post.emailOTP = post.eMailOTP;
//     }

//     const query = { businessUserStatus: 'New', phoneNumber: post.phoneNumber };
//     // Include emailAddress in the query if provided
//     if (post.emailAddress) {
//       query.emailAddress = post.emailAddress;
//     }
//     // Encrypt mobileOTP
//     try {
//       post.mobileOTP = await (post.mobileOTP);
//       query.mobileOTP = post.mobileOTP;
//     } catch (error) {
//       console.log("mobileOTP encryption error:", error);
//     }

//     // Encrypt emailOTP if needed
//     if (post.isEmailVerified === false && post.emailOTP) {
//       try {
//         post.mobileOTP = await encryptPassword(post.emailOTP);
//         query.emailOTP = post.mobileOTP;
//       } catch (error) {
//         console.log("emailOTP encryption error:", error);
//       }
//     }
//     console.log("validateOTPForMobileApi query:", query);
//     const fetchedValidBusinessUsers = await BusinessUsers.aggregate([
//       {
//         $match: query
//       },
//       {
//         $project: {
//           firstName: 1, lastName: 1, phoneNumber: 1, emailAddress: 1,
//         }
//       },
//     ]);

//     console.log('fetchedValidBusinessUsers Records: ', fetchedValidBusinessUsers);

//     const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//     if (fetchedValidBusinessUsers.length > 0) {

//       const newChanges = {};
//       newChanges.userRegistrationDate = currentDate;
//       newChanges.businessUserStatus = 'Active';
//       newChanges.lastModifiedDate = currentDate;
//       newChanges.recordType = "U";
//       const query = { _id: mongoose.Types.ObjectId(fetchedValidBusinessUsers[0]._id) };
//       var newValues = { $set: newChanges }
//       const updatedBusinessUser = await BusinessUsers.updateOne(query, newValues);

//       const validBusinessUser = fetchedValidBusinessUsers[0];
//       validBusinessUser.businessUserID = validBusinessUser._id;
//       validBusinessUser._id = undefined;
//       validBusinessUser.createdDate = currentDate;
//       validBusinessUser.firstTimeUser = 0;
//       validBusinessUser.userStatus = "Active";
//       validBusinessUser.userType = "Business";
//       await encryptPassword(post.userPassword).then(data => {
//         validBusinessUser.userPassword = data;
//       }).catch((error) => {
//         console.log("Password encryption error:", error);
//         return;
//       });
//       const addUser = new Users(validBusinessUser);
//       const addedUsers = await addUser.save(post);
//       if (addedUsers._id) {
//         return res.status(200).json(genericResponse(true, 'User Register Successfully', { userId: addedUsers._id, }));
//       } else {
//         return res.status(202).json(genericResponse(false, 'User not Register Successfully', []));
//       }
//     }
//     else {
//       console.log("Starting.. to fetch Active Business User.");

//       const query = { businessUserStatus: 'Active', phoneNumber: post.phoneNumber };
//       const fetchedValidBusinessUsers = await BusinessUsers.aggregate([
//         { $match: query },
//         {
//           $project: {
//             firstName: 1, lastName: 1, phoneNumber: 1, emailAddress: 1, emailOTP: 1, mobileOTP: 1, verificationStatus: 1, wizardStatusFlag: 1
//           }
//         },
//       ]);

//       if (fetchedValidBusinessUsers.length > 0) {
//         console.log(post.mobileOTP);
//         console.log(fetchedValidBusinessUsers[0].mobileOTP);
//         if (fetchedValidBusinessUsers[0].mobileOTP === post.mobileOTP) {
//           let successResponse = genericResponse(true, "Verified Successfully!", fetchedValidBusinessUsers);
//           res.status(200).json(successResponse);
//         } else {
//           let successResponse = genericResponse(false, "Mobile OTP not matched.", []);
//           res.status(202).json(successResponse);
//         }

//       }
//       else {
//         console.log("fetchedValidBusinessUsers Record not found")
//         let successResponse = genericResponse(false, "User not found!", []);
//         res.status(202).json(successResponse);
//       }
//     }
//   } catch (error) {
//     console.log("Error in validateOTPByMobile: ", error);
//     let errorRespnse = genericResponse(false, error.message, []);
//     res.status(404).json(errorRespnse);
//   }
// });

const wizardSignupForMobileApi = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    console.log("wizardSignupForMobileApi post: ", post);
    if (!post)
      return res.status(200).json(genericResponse(false, "Request Payload Data is null", []));

    if (!post.userId)
      return res.status(200).json(genericResponse(false, "Please Login again..", []));

    post.wizardStatusFlag = 1; //set 1 if Wizard Fields update in Business User.
    const fetchUsers = await Users.findOne({ _id: mongoose.Types.ObjectId(post.userId) });
    console.log("fetchUser for wizardSignupForMobileApi: ", fetchUsers);
    // Retrieve businessUserID
    const businessUserID = fetchUsers.businessUserID;


    if (!fetchUsers) {
      console.log(`user not found with _id that pass through mobile app`);
      return res.status(200).json(genericResponse(false, "User Not Found", []));
    }

    await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(fetchUsers.businessUserID) }, { $set: post });

    // Fetch country details
    const Country = await country.findOne({ _id: mongoose.Types.ObjectId(post.companyCountryId) }, { countryName: 1 });
    if (!Country || !Country.countryName) {
      return res.status(200).json(genericResponse(false, `Please ensure the Address is correct before Signin.`, []));
    }

    // Fetch matching currency
    const matchedCountry = CurrencyList.find((item) => item.CountryName === Country.countryName);
    console.log("matchedCountry", matchedCountry);
    if (matchedCountry && businessUserID) {
      // Create default settings if not exists
      const defaultSettingparams = {
        businessUserID,
        currencyValue: matchedCountry.Code,
        createdDate: currentDate,
        rctiTypes: 'Of the Following Month',
        rctiDues: "30",
        rctiPrefix: "RCTI",
        rctiStartNumber: "0001",
        quotationPrefix: 'QUOT',
        quotationStartNumber: '0001',
        quotationTypes: 'Of the Following Month',
        quotationDues: '30',
        invoicePrefix: 'INV',
        invoiceStartNumber: '0001',
        invoiceTypes: 'Of the Following Month',
        invoiceDues: '30',
        creditNotePrefix: 'CRED',
        creditNoteNumber: '0001'
      };
      await DefaultSetting(defaultSettingparams).save();
    }

    let payload = { _id: fetchUsers._id }
    jwt.sign(payload, process.env.JWT_SECRET_TOKEN, { expiresIn: "3h" }, async (err, token) => {
      if (token) {
        const userDetails = await Users.aggregate([
          { $match: { _id: mongoose.Types.ObjectId(post.userId) } },
          {
            $lookup: {
              from: 'business_users',
              localField: 'businessUserID',
              foreignField: '_id',
              as: "businessUser"
            }
          },
          { $unwind: "$businessUser" },
          {
            $project: {
              firstTimeUser: '$firstTimeUser',
              emailAddress: '$emailAddress',
              phoneNumber: '$phoneNumber',
              businessUserID: '$businessUserID',
              userStatus: '$userStatus',
              userType: '$userType',
              firstTimeUser: '$firstTimeUser',
              businessUserStatus: "$businessUser.businessUserStatus",
              negativeEmailApology: "$businessUser.negativeEmailApology",
              trialUser: "$businessUser.trialUser",
              wizardStatusFlag: "$businessUser.wizardStatusFlag",
              gatewayUserID: "$businessUser.gatewayUserID",
              userRegistrationDate: "$businessUser.userRegistrationDate",
              companyZipCode: "$businessUser.companyZipCode",
              companyStreetAddress: "$businessUser.companyStreetAddress",
              companyStateId: "$businessUser.companyStateId",
              companyCountryId: "$businessUser.companyCountryId",
              companyCity: "$businessUser.companyCity",
              businessName: "$businessUser.businessName",
              companyName: "$businessUser.companyName",
              abnNumber: "$businessUser.abnNumber"
            }
          }
        ]);
        console.log("Success Response --", 'token:', token, 'userDetails', userDetails);
        return res.status(200).json(genericResponse(true, "User logged in successfully.", { userDetails: userDetails }));
      } else {
        console.log("token issue while call jwt.sign():  ");
        return res.status(200).json(genericResponse(false, "Something Went Wrong!", []));
      }
    })

  }
  catch (error) {
    console.log("Catch in wizardSignupForMobileApi: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    return res.status(400).json(errorRespnse)
  }
});

const ResendOTPForMobileApi = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("ResendOTPForMobileApi Post:", post);

    if (!post)
      return res.status(200).json(genericResponse(false, "Request Payload Data is null", []));

    if (!post.OTPType)
      return res.status(200).json(genericResponse(false, "OTPType is missing", []));

    if (post.OTPType === "SMS") {

      if (!post.phoneNumber)
        return res.status(200).json(genericResponse(false, "phoneNumber is missing", []));


      let query = { phoneNumber: post.phoneNumber, };
      let fetchedBusinessUsers = await BusinessUsers.findOne(query);
      if (!fetchedBusinessUsers) return res.status(200).json(genericResponse(false, "Please enter registered Mobile Number.", []));

      const newChanges = { lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)), recordType: "U" };
      await generateOtp().then(data => {
        post.mobileOTP = data;
      }).catch((error) => {
        console.log("Password encryption error:", error);
        return;
      });

      await encryptPassword(post.mobileOTP).then(data => {
        newChanges.mobileOTP = data;
        console.log("newChanges.mobileOTP", newChanges.mobileOTP);
      }).catch((error) => {
        console.log("mobileOTP encryption error:", error);
        return;
      });

      const templateQuery = { templateStatus: 'Active', templateName: 'ResendOTPSMSNotification' };
      const fetchedTemplates = await Templates.find(templateQuery);

      if (fetchedTemplates.length > 0) {
        let val = fetchedTemplates[0];
        val.templateMessage = val.templateMessage.replaceAll('[FirstName]', fetchedBusinessUsers.firstName);
        val.templateMessage = val.templateMessage.replaceAll('[LastName]', fetchedBusinessUsers.lastName);
        val.templateMessage = val.templateMessage.replaceAll('[OTP]', post.mobileOTP);
        let smsTemplate = val.templateMessage;
        await sendTwilioMessage(post.phoneNumber, smsTemplate);

        console.log("SMS : ", smsTemplate, post.mobileOTP);
        const updatedBusinessUser = await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(fetchedBusinessUsers._id) }, { $set: newChanges });
        console.log('updatedBusinessUser', updatedBusinessUser);
        return res.status(202).json(genericResponse(true, "OTP SMS sent successfully", []));
      } else {
        return res.status(200).json(genericResponse(false, "Template Name: ResendOTPSMSNotification can't be found.", []));
      }
    } else if (post.OTPType === "EMAIL") {

      let query = { phoneNumber: post.phoneNumber, };
      let fetchedBusinessUsers = await BusinessUsers.findOne(query);
      console.log("fetchedBusinessUsers ", fetchedBusinessUsers);
      let emailAddress = fetchedBusinessUsers.emailAddress;
      console.log("emailAddress ", emailAddress);

      if (!fetchedBusinessUsers) return res.status(200).json(genericResponse(false, "User is not matched with us.", []));

      const newChanges = { lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)), recordType: "U" };

      await generateOtp().then(data => {
        post.emailOTP = data;
      }).catch((error) => {
        console.log("Email  generateOtp error:", error);
        return;
      });

      await encryptPassword(post.emailOTP).then(data => {
        newChanges.emailOTP = data;
      }).catch((error) => {
        console.log("emailOTP encryption error:", error);
        return;
      });
      let emailSubject = '';
      let emailBody = '';
      const templateQuery = { templateStatus: 'Active', templateName: 'ResendOTPEmailNotification' };
      console.log("templateQuery : ", templateQuery);
      const fetchedTemplates = await Templates.find(templateQuery);
      if (fetchedTemplates.length > 0) {
        let val = fetchedTemplates[0];

        emailSubject = val.templateSubject;

        val.templateMessage = val.templateMessage.replaceAll('[FirstName]', fetchedBusinessUsers.firstName);
        val.templateMessage = val.templateMessage.replaceAll('[LastName]', fetchedBusinessUsers.lastName);
        val.templateMessage = val.templateMessage.replaceAll('[OTP]', post.emailOTP);
        emailBody = val.templateMessage;
        await sendEmail(emailAddress, emailSubject, emailBody);
        console.log("Email : ", emailBody, post.emailOTP);
        const updatedBusinessUser = await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(fetchedBusinessUsers._id) }, { $set: newChanges });

        return res.status(202).json(genericResponse(true, "OTP Email sent successfully", []));
      } else {
        return res.status(200).json(genericResponse(false, "Template Name: ResendOTPEmailNotification can't be found.", []));
      }
    } else {
      console.log("OTPType is not matched ");
    }

  } catch (error) {
    console.log("Catch in sendOTP: ", error);
    res.status(400).json(genericResponse(false, error.message, []));
  }
});

const authenticateUserAndLogin = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("authenticateUserAndLogin: ", post);
    if (!post) return res.status(200).json(genericResponse(false, 'Request Payload Data is null.', []));
    // if (!post.pushNotificationID) return res.status(200).json(genericResponse(false, 'pushNotification ID is missing', []));
    if (!post.password) return res.status(200).json(genericResponse(false, `Password can't be blank.`, []));
    if (!post.signatureKey) { return res.status(200).json(genericResponse(false, 'Signature Key is missing', [])); }
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    await encryptPassword(post.password).then(data => {
      post.password = data;
    }).catch((error) => {
      console.log("Password encryption error:", error);
      return;
    });

    console.log("passwords", post.password)

    // const cleanedPhoneNumber = post.phoneNumber.replace(/\D/g, '');
    // const regexPattern = cleanedPhoneNumber; // Construct the regex pattern for partial match

    // const query = {
    //   phoneNumber: { $regex: regexPattern, $options: 'i' } // $options: 'i' makes the search case-insensitive
    // };

    // let abc = await Users.find(query);
    // console.log("abc", abc);

    // const cleanedPhoneNumber = post.phoneNumber.replace(/\D/g, ''); // Remove non-numeric characters from the provided phone number
    // console.log("cleanedPhoneNumber", cleanedPhoneNumber);
    // const query = {
    //   phoneNumber: { $regex: new RegExp(cleanedPhoneNumber) } // Use a regex to find matching phone numbers
    // };
    // console.log(query);
    // phoneNumber: { $regex: regexPattern, $options: 'i' }
    // let abc = await Users.find({ phoneNumber: { $regex: new RegExp(cleanedPhoneNumber) } });
    // console.log("abc", abc);

    let errorField = '';
    let checkQuery = '';
    if (post.emailAddress) {
      checkQuery = { emailAddress: { $regex: '^' + post.emailAddress + '$', $options: 'i' }, userPassword: post.password };
      errorField = "Email Address";
    } else if (post.phoneNumber) {
      checkQuery = { phoneNumber: post.phoneNumber, userPassword: post.password }
      errorField = "Phone Number";
    } else {
      return res.status(200).json(genericResponse(false, `Please provide either an email or a phone number for login.`, []))
    }
    if (!post.phoneNumber && !post.emailAddress) return res.status(200).json(genericResponse(false, `${errorField} can't be blank.`, []));


    const fetchUser = await Users.findOne(checkQuery);
    console.log("fetchUser", fetchUser);

    if (!fetchUser) return res.status(200).json(genericResponse(false, `Please Enter valid ${errorField} & Password.`, []));
    if (fetchUser.userStatus !== "Active") return res.status(200).json(genericResponse(false, `${fetchUser.userType} User is not Active`, []));
    await BusinessUsers.updateOne({ _id: fetchUser.businessUserID }, { $set: { pushNotificationID: post.pushNotificationID } });

    let userDetails = [];
    if (fetchUser.userType === 'Business') {
      userDetails = await Users.aggregate([
        { $match: { _id: fetchUser._id } },
        {
          $lookup: {
            from: 'business_users',
            localField: 'businessUserID',
            foreignField: '_id',
            as: "businessUser"
          }
        },
        { $unwind: "$businessUser" },
        {
          $lookup: {
            from: "countries",
            localField: "businessUser.companyCountryId",
            foreignField: "_id",
            as: "countries"
          }
        },
        {
          $unwind: {
            path: "$countries",
            preserveNullAndEmptyArrays: true
          }
        },

        {
          $lookup: {
            from: "country_states",
            localField: "businessUser.companyStateId",
            foreignField: "_id",
            as: "countryStates"
          }
        },

        {
          $unwind: {
            path: "$countryStates",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            firstTimeUser: 1,
            emailAddress: 1,
            phoneNumber: 1,
            businessUserID: 1,
            userStatus: 1,
            userType: 1,
            firstTimeUser: 1,
            firstName: 1,
            lastName: 1,
            businessUserStatus: "$businessUser.businessUserStatus",
            negativeEmailApology: "$businessUser.negativeEmailApology",
            trialUser: "$businessUser.trialUser",
            wizardStatusFlag: "$businessUser.wizardStatusFlag",
            gatewayUserID: "$businessUser.gatewayUserID",
            userRegistrationDate: "$businessUser.userRegistrationDate",
            companyZipCode: "$businessUser.companyZipCode",
            companyStreetAddress: "$businessUser.companyStreetAddress",
            companyState: "$countryStates.stateName",
            companyCountry: "$countries.countryName",
            companyCity: "$businessUser.companyCity",
            businessName: "$businessUser.businessName",
            abnNumber: "$businessUser.abnNumber",
          }
        }
      ])
    } else {
      userDetails = await Users.aggregate([
        { $match: { _id: fetchUser._id } },
        {
          $lookup: {
            from: "countries",
            localField: "countryId",
            foreignField: "_id",
            as: "countries"
          }
        },
        { $unwind: "$countries" },
        {
          $lookup: {
            from: "country_states",
            localField: "stateId",
            foreignField: "_id",
            as: "countryStates"
          }
        },
        { $unwind: "$countryStates" },

        {
          $project: {
            firstName: 1, lastName: 1, emailAddress: 1, phoneNumber: 1, streetAddress: 1, city: 1, zipCode: 1, state: "$countryStates.stateName", country: "$countries.countryName", businessUserID: 1, firstTimeUser: 1,

            // paymentType: 1, customerType: 1, businessName: 1, businessID: 1, accountNumber: 1, customerStatus: 1, customerLocationLatitude: 1, customerLocationLongitude: 1

          }

        },

      ])
    }
    if (userDetails.length < 1) return res.status(200).json(genericResponse(false, 'Something error: errorType-userDetails', []));

    // const fetchParameterSettings = await parameterSettings.find(
    //   {
    //     parameterName: {
    //       $in: [
    //         "activityCaptureInterval",
    //         "activitySendInterval",
    //         "activityCapturing",
    //         "appVersion",
    //         "appForceUpgrade",
    //       ],
    //     },
    //   },
    //   {
    //     parameterName: 1,
    //     parameterValue: 1,
    //     _id: 0, // Exclude the "_id" field
    //   }
    // );
    // const siteDetails = {};
    // fetchParameterSettings.forEach((setting) => {
    //   siteDetails[setting.parameterName] = setting.parameterValue;
    // });

    let payload = { _id: fetchUser._id }
    jwt.sign(payload, process.env.JWT_SECRET_TOKEN, { expiresIn: "3h" }, async (err, token) => {
      if (token) {

        console.log("Success Response --", 'token:', token, 'userDetails', userDetails,
          //  'siteDetails', siteDetails
        );
        return res.status(200).json(genericResponse(true, "Login Successfully.", {
          token: token,
          userDetails: userDetails,
          // siteDetails: siteDetails
        }));
      } else {
        console.log("token issue while call jwt.sign():  ");
        return res.status(200).json(genericResponse(false, "Something Went Wrong!", []));
      }
    });

  }
  catch (error) {
    console.log("Catch in authenticateUser: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const resetPasswordForMobileApi = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("post", post);

    const query = { emailAddress: post.emailAddress };
    let password = post.userpassword;
    const fetchUserByEmail = await Users.find(query, { emailAddress: 1, userPassword: 1 });
    console.log("fetchUserByEmail", fetchUserByEmail[0].userPassword);
    console.log("password", password);

    await decryptPassword(fetchUserByEmail[0].userPassword).then(data => {
      post.decryptPassword = data;
    })
      .catch((error) => {
        console.log("Password encryption error:", error);
        return;
      });

    await encryptPassword(password).then(data => {
      post.encryptedPassword = data;
    })
      .catch((error) => {
        console.log("Password encryption error:", error);
        return;
      });

    console.log("password, post.decryptPassword", password, post.decryptPassword);
    console.log("fetchUserByEmail[0].userPassword, post.encryptedPassword", fetchUserByEmail[0].userPassword, post.encryptedPassword);

    // if (post.confirmPassword !== password) {
    //   let errorResponse = genericResponse(false, "New Password doesn't match Confirm Password.", []);
    //   res.status(400).json(errorResponse);
    // }

    if (post.decryptPassword === post.encryptedPassword) {
      let errorResponse = genericResponse(false, "Old Password can't be set as New Password ", []);
      res.status(400).json(errorResponse);
      return;
    }

    else if (fetchUserByEmail[0].userPassword !== post.encryptedPassword) {
      post.userPassword = post.encryptedPassword;
      post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      post.recordType = "U";
      post.firstTimeUser = 0;
      var query1 = { _id: mongoose.Types.ObjectId(fetchUserByEmail[0]._id) }
      var newValues = { $set: post };
      await Users.updateOne(query1, newValues);
      let successResponse = genericResponse(true, "User Password Changed successfully.", fetchUserByEmail[0]);
      res.status(200).json(successResponse);
      return;
    }
    else {
      console.log("Temporary Password can't be set as New Password!");
      let errorResponse = genericResponse(false, "Temporary Password can't be set as New Password!", []);
      res.status(200).json(errorResponse);
      return;
    }
  }
  catch (error) {
    console.log("error in Update Password=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

//===

const signup = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var planExpiryDate = new Date(new Date(new Date() - (new Date().getTimezoneOffset() * 60000)).setUTCHours(23, 59, 59, 999));

    let phoneNumberQuery = { phoneNumber: post.phoneNumber };
    let emailQuery = { emailAddress: post.emailAddress };

    const checkPhoneNumber = await Promise.all([BusinessUsers.findOne(phoneNumberQuery), Users.findOne(phoneNumberQuery)]);
    const checkEmail = await Promise.all([BusinessUsers.findOne(emailQuery), Users.findOne(emailQuery)]);

    if (checkPhoneNumber.some(result => result !== null)) {
      return res.status(202).json(genericResponse(false, "Phone Number Already Exist.", []));
    }
    if (checkEmail.some(result => result !== null)) {
      return res.status(202).json(genericResponse(false, "Email Address Already Exist.", []));
    }

    // var query = { phoneNumber: post.phoneNumber };
    // var checkIfPhoneNumberAlredyExist = await BusinessUsers.find(query);
    // var checkIfPhoneNumberAlredyExist1 = await Users.find(query);
    // if (checkIfPhoneNumberAlredyExist.length > 0 || checkIfPhoneNumberAlredyExist1.length > 0) {
    //   return res.status(202).json(genericResponse(false, "Phone Number Already Exist.", []));
    // }
    // var query1 = { emailAddress: post.emailAddress };
    // var checkIfEmailAlredyExist = await BusinessUsers.find(query1);
    // var checkIfEmailAlredyExist1 = await Users.find(query1);
    // if (checkIfEmailAlredyExist.length > 0 || checkIfEmailAlredyExist1.length > 0) {
    //   let errorRespnse = genericResponse(false, "Email Already Exist.", []);
    //   res.status(200).json(errorRespnse);
    //   return;
    // }
    const password = await generatePassword();
    await encryptPassword(password).then(data => {
      post.userPassword = data;
    }).catch((error) => {
      console.log("Password encryption error:", error);
      return;
    });

    await encryptPassword(post.ccName).then(data => {
      post.ccName = data;
    }).catch((error) => {
      console.log("ccName encryption error:", error);
      return;
    });

    await encryptPassword(post.ccNumber).then(data => {
      post.ccNumber = data
    }).catch((error) => {
      console.log("ccNumber encryption error:", error);
      return;
    });

    await encryptPassword(post.ccCVVCode).then(data => {
      post.ccCVVCode = data;
    }).catch((error) => {
      console.log("ccCVVCode encryption error:", error);
      return;
    });

    await encryptPassword(post.ccExpiryDate).then(data => {
      post.ccExpiryDate = data;
    }).catch((error) => {
      console.log("ccExpiryDate encryption error:", error);
      return;
    });

    const addBusinessUser = new BusinessUsers(post);
    addBusinessUser.createdDate = currentDate;
    addBusinessUser.userRegistrationDate = currentDate;
    // addBusinessUser.planActivationDate = currentDate;
    // addBusinessUser.planExpiryDate = new Date(planExpiryDate.setDate(planExpiryDate.getDate() + 30));
    // return;
    var query = { defaultBusinessRole: "Yes" }
    const fetchRoles = await Roles.find(query)

    // Saving Templates
    addBusinessUser.smsTemplate = 'Hi [FirstName] [LastName],\n\n' +
      'Have you got a minute to write us a review? Online reviews are so important, and it’s quick and easy to do – [ReviewLink]\n\n' +
      'Thanks\n' +
      'Team ReviewArm\n' +
      '[CompanyName]';
    addBusinessUser.emailTemplateSubject = 'Request for Review';
    addBusinessUser.emailTemplateBody = 'Hi [FirstName] [LastName],\n\n' +
      'Have you got a minute to write us a review? Online reviews are so important, and it’s quick and easy to do – [ReviewLink]\n\n' +
      'Thanks\n' +
      'Team ReviewArm\n' +
      '[CompanyName]';
    addBusinessUser.negativeEmailApology = 0;
    addBusinessUser.negativeLandingPageEnableGoogleReview = 0;
    addBusinessUser.negativeApologyEmailSubject = 'Our Sincere Apologies';
    addBusinessUser.negativeApologyEmailBody = 'Dear [FirstName] [LastName],\n\n' +
      'We greatly appreciate your time and feedback. We hope that you can accept our sincere apology for not meeting your expectations.\n\n' +
      'Thanks for your business and trust. We will use your feedback to improve our services and processes.\n\n' +
      'Sincerely,\n' +
      '[CompanyName]';
    addBusinessUser.positiveEmailNotificationSubject = 'Positive Review Notification';
    addBusinessUser.positiveEmailNotificationBody = 'Dear User,\n\n' +
      'We would like to update you that customer [FirstName] [LastName] ([PhoneNumber], [EmailAddress]) has given positive feedback.\n\n' +
      'Thanks\n' +
      'Team ReviewArm';
    addBusinessUser.negativeEmailNotificationSubject = 'Negative Review Notification';
    addBusinessUser.negativeEmailNotificationBody = 'Dear User,\n\n' +
      'We would like to update you that customer [FirstName] [LastName] ([PhoneNumber], [EmailAddress]) has given negative feedback.\n\n' +
      'Thanks\n' +
      'Team ReviewArm';
    addBusinessUser.feedbackPageText = 'Please tell us about your recent experience with our company.';
    addBusinessUser.positiveLandingPageText = 'Thank you for your feedback. Please leave us an online review on:';
    addBusinessUser.negativeLandingPageText = 'We apologize for your negative experience with our company. Please provide additional details to help us understand where we went wrong and how we can improve.';
    addBusinessUser.firstReviewRequestReminderEmailSubject = 'We’d love to get your feedback!';
    addBusinessUser.firstReviewRequestReminderFeedbackPageText = 'Dear [FirstName], please tell us about your experience. Your satisfaction is important to us.';
    addBusinessUser.secondReviewRequestReminderEmailSubject = 'Hi [FirstName], your honest feedback please';
    addBusinessUser.secondReviewRequestReminderFeedbackPageText = 'We wanted to make one last attempt to get your feedback. It will take just a minute. Thanks!';
    addBusinessUser.firstPositiveFeedbackRequestReminderEmailSubject = 'We’d love to get your feedback!';
    addBusinessUser.firstPositiveFeedbackRequestReminderFeedbackPageText = 'Dear [FirstName], please take a moment to leave us an online review. Thanks!';
    addBusinessUser.secondPositiveFeedbackRequestReminderEmailSubject = 'Share your experience!';
    addBusinessUser.secondPositiveFeedbackRequestReminderFeedbackPageText = 'We would greatly appreciate you taking a moment to leave us an oline review. Thanks!';
    if (fetchRoles.length > 0) {
      const addBusinessUsers = await addBusinessUser.save();

      const addBusinessUserPlan = new BusinessUserPlans();
      addBusinessUserPlan.businessUserID = addBusinessUsers._id;
      // addBusinessUserPlan.planID = addBusinessUsers.planID;
      addBusinessUserPlan.planID = post.planID;
      // addBusinessUserPlan.planActivationDate = addBusinessUsers.planActivationDate;
      addBusinessUserPlan.planActivationDate = currentDate;
      // addBusinessUserPlan.planExpiryDate = addBusinessUsers.planExpiryDate;
      addBusinessUserPlan.planExpiryDate = new Date(planExpiryDate.setDate(planExpiryDate.getDate() + 30));
      addBusinessUserPlan.createdDate = addBusinessUsers.createdDate;
      // addBusinessUserPlan.recordType = addBusinessUsers.recordType;

      const addedBusinessUserPlan = await addBusinessUserPlan.save();
      const planFeatures = await PlanFeatures.aggregate([
        {
          $match: {
            planID: mongoose.Types.ObjectId(addedBusinessUserPlan.planID)
          }
        },
        {
          $addFields: {
            businessUserPlanID: mongoose.Types.ObjectId(),
            planFeatureID: mongoose.Types.ObjectId()
          }
        },
      ]);

      // planFeatures.forEach(element => {
      //   element.businessUserPlanID = addedBusinessUserPlan._id;
      //   element.planFeatureID = element._id;
      //   element.createdDate = addedBusinessUserPlan.createdDate;
      //   element.recordType = addBusinessUsers.recordType;
      // });

      const planFeaturesIDArray = [];
      const formattedPlanFeatures = new Promise((resolve, reject) => {
        planFeatures.forEach(async (element, index, array) => {
          planFeaturesIDArray.push(element._id);
          element.businessUserPlanID = addedBusinessUserPlan._id;
          element.planFeatureID = element._id;
          element.createdDate = addedBusinessUserPlan.createdDate;
          element.recordType = addBusinessUsers.recordType;
          element._id = undefined;
          resolve(planFeatures);
        });
      });

      await formattedPlanFeatures.then(data => {
        const addedBusinessUserPlanFeatures = BusinessUserPlanFeatures.insertMany(data, async function (err, data) {
          if (err != null) {
            return console.log(err);
          }
          if (data) {

            const planFeaturesSlabs = await PlanFeaturesSlab.aggregate([
              {
                $match: {
                  planFeatureID: { $in: await updateToObjectType(planFeaturesIDArray) }
                }
              },
              {
                $addFields: {
                  businessUserPlanFeatureID: mongoose.Types.ObjectId()
                }
              },
            ]);

            if (planFeaturesSlabs.length > 0) {
              const formattedPlanFeaturesSlabs = new Promise((resolve, reject) => {
                planFeaturesSlabs.forEach(async (element, index, array) => {
                  const businessUserPlanFeature = await (data.find((feature) =>
                    feature.planFeatureID.toString() === element.planFeatureID.toString()));
                  if (businessUserPlanFeature && businessUserPlanFeature._id) {
                    element.businessUserPlanFeatureID = businessUserPlanFeature._id
                  }
                  element.createdDate = addedBusinessUserPlan.createdDate;
                  element.recordType = addBusinessUsers.recordType;
                  element._id = undefined;
                  resolve(planFeaturesSlabs);
                })
              });

              await formattedPlanFeaturesSlabs.then(data => {
                const addedBusinessUserPlanFeatureSlabs = BusinessUserPlanFeatureSlabs.insertMany(data, async function (err, data) {
                  if (err != null) {
                    return console.log(err);
                  }
                  if (data) {
                    console.log("BusinessUserPlanFeatureSlabs added successfully.");
                  }
                });
              }).catch((error) => {
                console.log("BusinessUserPlanFeatureSlabs added error:", error);
                return;
              });
            }

          }
        });
      }).catch((error) => {
        console.log("BusinessUserPlanFeatures added error:", error);
        return;
      });


      if (addBusinessUsers._id != null) {
        post.businessUserID = addBusinessUsers._id;
        const addUser = new Users(post);
        addUser.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        addUser.roleID = fetchRoles[0]._id;
        addUser.userType = "Business"
        addUser.userStatus = "Active"
        const addUsers = await addUser.save(post);

        const addBusinessLocation = new businessLocation(post);
        addBusinessLocation.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        addBusinessLocation.defaultLocation = "Yes";
        addBusinessLocation.locationStatus = "Active";
        addBusinessLocation.countryId = addBusinessUsers.companyCountryId;
        addBusinessLocation.stateId = addBusinessUsers.companyStateId;
        addBusinessLocation.zipCode = addBusinessUsers.companyZipCode
        addBusinessLocation.locationStreetAddress = addBusinessUsers.companyStreetAddress;
        addBusinessLocation.locationCity = addBusinessUsers.companyCity;
        const addLocation = await addBusinessLocation.save(post);

        const emailTemplate =
          '<p>Hello!' +
          '<br/><br/>Thank you for signing up with ReviewArm !' +
          '<br/><br/>Please find below the URL & login credentials' +
          '<table style={{ border: "1px solid black", borderCollapse: "collapse"}}>' +
          '<tbody>' +
          '<tr>' +
          '<td style={{border:"1px solid black"}}><b>URL</b></td>' +
          '<td style={{border:"1px solid black"}}>' + post.loginURL + '</td>' +
          '</tr>' +
          '<tr>' +
          '<td style={{border:"1px solid black"}}><b>User Name</b></td>' +
          '<td style={{border:"1px solid black"}}>' + post.emailAddress + '</td>' +
          '</tr>' +
          '<tr>' +
          '<td style={{border:"1px solid black"}}><b>Password</b></td>' +
          '<td style={{border:"1px solid black"}}>' + password + '</td>' +
          '</tr>' +
          '</tbody>' +
          '</table>' +
          '<br/><br/>Sincerely,' +
          '<br/><br/>Team ReviewArm' +
          '</p>';
        await sendMailBySendGrid(post.emailAddress, 'ReviewArm - New User Signing up', emailTemplate);
        let successResponse = genericResponse(true, "Signup successfully.", []);
        res.status(200).json(successResponse);
      }
    }
    else {
      let errorRespnse = genericResponse(false, "No default role assigned.", []);
      res.status(200).json(errorRespnse);
    }
  } catch (error) {
    console.log("error in checkLoginDetails=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const post = req.body;

    var query = { userStatus: 'Active', emailAddress: post.emailAddress };
    const users = await Users.find(query).select('-createdDate -recordType -lastModifiedDate -userPassword -createdBy -lastModifiedBy -mobileOTP -emailOTP');
    if (users.length > 0) {
      const tempPassword = await generateTempPassword();

      await encryptPassword(tempPassword).then(data => {
        post.userPassword = data;
      })
        .catch((error) => {
          console.log("tempPassword encryption error:", error);
          return;
        });

      post.firstTimeUser = 1;
      post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      post.recordType = "U"
      const query = { _id: mongoose.Types.ObjectId(users[0]._id) };
      var newValues = { $set: post }
      const updateUser = await Users.findOneAndUpdate(query, newValues);

      const templateQuery = { templateStatus: 'Active', templateName: 'ForgotPasswordEmailNotification' };
      const fetchedTemplates = await Templates.find(templateQuery);
      let emailSubject = '';
      let emailBody = '';
      if (fetchedTemplates.length > 0) {
        let val = fetchedTemplates[0];
        val.templateSubject = val.templateSubject.replaceAll('[FirstName]', updateUser.firstName);
        val.templateSubject = val.templateSubject.replaceAll('[LastName]', updateUser.lastName);
        emailSubject = val.templateSubject;

        val.templateMessage = val.templateMessage.replaceAll('[FirstName]', updateUser.firstName);
        val.templateMessage = val.templateMessage.replaceAll('[LastName]', updateUser.lastName);
        val.templateMessage = val.templateMessage.replaceAll('[Password]', tempPassword);
        emailBody = val.templateMessage;
        sendMailBySendGrid(post.emailAddress, emailSubject, emailBody);
      }

      let successResponse = genericResponse(true, "User fetched successfully.", users);
      res.status(200).json(successResponse);
    }
    else {
      let successResponse = genericResponse(false, "Enter the email address which is linked to your account.", []);
      res.status(200).json(successResponse);
    }
  } catch (error) {
    console.log("error in forgotPassword=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const checkLoginDetails = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    let checkQuery;
    var query;
    let errState;
    await encryptPassword(post.userPassword).then(data => {
      post.encryptedPassword = data;
    })
      .catch((error) => {
        console.log("Password encryption error:", error);
        return;
      });
    if (post.emailAddress !== "" && post.emailAddress !== undefined) {
      checkQuery = { emailAddress: post.emailAddress }
      query = { emailAddress: post.emailAddress, userPassword: post.encryptedPassword };
      errState = "Email Address"
    } else {
      checkQuery = { phoneNumber: post.phoneNumber }
      query = { phoneNumber: post.phoneNumber, userPassword: post.encryptedPassword };
      errState = "Mobile Number"
    }
    const foundUsers = await Users.count(checkQuery);
    if (foundUsers < 1) {
      let successResponse = genericResponse(false, `Please Enter Valid ${errState} & Password.`, []);
      res.status(200).json(successResponse);
    }
    else {
      console.log("ppost :: ", post);

      const users = await Users.find(query).select('-userPassword -createdDate -lastModifiedDate -createdBy -recordType -lastModifiedDate');

      if (users.length > 0) {
        let user = users[0];
        if (user.userStatus === 'Inactive') {
          let errorRespnse = genericResponse(false, "User is Inactive! Please contact to Invoice & Recover Administrator.", []);
          res.status(200).json(errorRespnse);
          return;
        }

        let wizardStatusFlag = await BusinessUsers.findOne({ _id: user.businessUserID }, { wizardStatusFlag: 1 });
        console.log("wizardStatusFlag", wizardStatusFlag?.wizardStatusFlag)


        let payload = {
          _id: user._id,
        }

        jwt.sign(payload, process.env.JWT_SECRET_TOKEN, { expiresIn: "3h" }, (err, token) => {
          if (token) {
            let successResponse = genericResponse(true, "User logged in successfully.", { data: user, token: token });
            successResponse.wizardStatusFlag = wizardStatusFlag?.wizardStatusFlag
            res.status(200).json(successResponse);
          } else {
            let successResponse = genericResponse(false, "Something Went Wrong!",);
            res.status(200).json(successResponse);
          }
        })
      }
      else {
        let successResponse = genericResponse(false, "Please Enter Valid Email Address & Password.", []);
        res.status(200).json(successResponse);
      }
    }

  } catch (error) {
    console.log("error in checkLoginDetails=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("post", post);
    const query = { emailAddress: post.emailAddress };
    const fetchUserByEmail = await Users.find(query, { emailAddress: 1, userPassword: 1 });
    console.log("fetchUserByEmail", fetchUserByEmail);
    console.log("post.password", post.password);

    await decryptPassword(fetchUserByEmail[0].userPassword).then(data => {

      post.decryptPassword = data;
    })
      .catch((error) => {
        console.log("Password encryption error:", error);
        return;
      });



    await encryptPassword(post.password).then(data => {

      post.encryptedPassword = data;
    })
      .catch((error) => {
        console.log("Password encryption error:", error);
        return;
      });
    console.log("post.password, post.decryptPassword", post.password, post.decryptPassword);
    console.log("fetchUserByEmail[0].userPassword, post.encryptedPassword", fetchUserByEmail[0].userPassword, post.encryptedPassword);
    if (post.confirmPassword !== post.password) {
      let errorResponse = genericResponse(false, "New Password doesn't match Confirm Password.", []);
      res.status(400).json(errorResponse);
    }

    else if (post.decryptPassword === post.encryptedPassword) {

      let errorResponse = genericResponse(false, "Old Password can't be set as New Password ", []);
      res.status(400).json(errorResponse);
    }
    else if (fetchUserByEmail[0].userPassword !== post.encryptedPassword) {

      post.userPassword = post.encryptedPassword;
      post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      post.recordType = "U";
      post.firstTimeUser = 0;
      var query1 = { _id: mongoose.Types.ObjectId(fetchUserByEmail[0]._id) }
      var newValues = { $set: post };
      await Users.updateOne(query1, newValues);
      let successResponse = genericResponse(true, "User Password Changed successfully.", fetchUserByEmail[0]);
      res.status(200).json(successResponse);
    }
    else {
      console.log("Temporary Password can't be set as New Password!");
      let errorResponse = genericResponse(false, "Temporary Password can't be set as New Password!", []);
      res.status(200).json(errorResponse);
    }
  }
  catch (error) {
    console.log("error in Update Password=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const fetchPlans = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    if (post.planName != undefined && post.planName != '' && post.planPeriod != undefined && post.planPeriod != '') {
      const query = { planStatus: "Active" }
      const fetchPlan = await SubscriptionPlan.find(
        query, { planName: 1, planPeriod: 1, planMonthlyCost: 1, planStatus: 1, planSequence: 1 }
      ).sort({ planSequence: 1 });
      let successResponse = genericResponse(true, "Data fetched successfully.", fetchPlan);
      res.status(200).json(successResponse);
    }
    else {
      let errorRespnse = genericResponse(false, "SubscriptionPlan/SubscriptionPeriod can't be blank!", []);
      res.status(400).json(errorRespnse)
    }
  }
  catch (error) {
    console.log("Catch in fetchPlans: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const sendOTP = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("send OTP -- post", post);
    let isEmailAlreadyVerified = post.isEmailVerified ? true : false;

    console.log("send OTP -- post", post);

    var existingUser = {};

    var saveBusinessUser = true;
    // note : may be post.mobileNumberExist is verified already not need to check again here
    if (post.mobileNumberExist) {
      const phoneNumberQuery = { phoneNumber: post.phoneNumber };
      let checkIfBusinessUserPhoneNumberAlredyExist = await BusinessUsers.find(phoneNumberQuery);

      if (checkIfBusinessUserPhoneNumberAlredyExist.length > 0 && checkIfBusinessUserPhoneNumberAlredyExist[0].businessUserStatus !== 'New' && checkIfBusinessUserPhoneNumberAlredyExist[0]?.verificationStatus !== 1) {
        let errorRespnse = genericResponse(false, "Phone Number Already Exist.", []);
        res.status(200).json(errorRespnse);
        return;
      }
    }
    var query1 = { emailAddress: post.emailAddress };
    var checkIfBusinessUserEmailAlredyExist = await BusinessUsers.find(query1);
    if (checkIfBusinessUserEmailAlredyExist.length > 0) {
      existingUser = checkIfBusinessUserEmailAlredyExist[0];
      if (existingUser.businessUserStatus !== 'New' && existingUser?.verificationStatus !== 1) {
        let errorRespnse = genericResponse(false, "Duplicate Email error, User Email already exists!", []);
        res.status(200).json(errorRespnse);
        return;
      }
      else {
        saveBusinessUser = false;
      }
    }

    var checkIfUserEmailAlredyExist = await Users.find(query1);
    if (checkIfUserEmailAlredyExist.length > 0 && existingUser?.verificationStatus !== 1) {

      let errorRespnse = genericResponse(false, "Duplicate Email error, User Email already exists!", []);
      res.status(200).json(errorRespnse);
      return;
    }



    var emailOTPForTemp;
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


    const customer = await stripe.customers.create({
      name: post.firstName + " " + post.lastName,
      email: post.emailAddress,
    });
    post.gatewayUserID = customer.id;
    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

    // var parameterQuery = { parameterStatus: "Active" }
    // const fetchParameter = await parameterSettings.find(parameterQuery)

    // const templateQuery1 = { templateStatus: 'Active' };
    // const fetchedTemplates1 = await Templates.find(templateQuery1);


    if (saveBusinessUser) {
      let userData = await new BusinessUsers(post).save();
      console.log('User Details saved in Business User.', userData);
    }
    else {
      const updatedBusinessUser = await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(existingUser._id) }, { $set: post });
      console.log('User Details Updated in Business User: ', updatedBusinessUser.nModified === 1 ? 'Success' : 'Failed');
    }

    const templateQuery = {
      templateStatus: 'Active',
      $or: [{ templateName: 'SignupOTPEmailNotification' }, { templateName: 'SignupOTPSMSNotification' }]
    };
    const fetchedTemplates = await Templates.find(templateQuery);
    let emailSubject = '';
    let emailBody = '';
    let smsTemplate = ''
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
          if (isEmailAlreadyVerified) {
            return console.log("Email Already Verified.");
          } else {
            if (checkIfBusinessUserEmailAlredyExist[0]?.verificationStatus !== 1) {
              sendEmail(post.emailAddress, emailSubject, emailBody);
            }
          }
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

    res.status(201).json(genericResponse(true, "OTP sent successfully", []));
  } catch (error) {
    console.log("Catch in sendOTP: ", error);
    res.status(400).json(genericResponse(false, error.message, []));
  }
});
//verify the OTP
// const validateOTP = asyncHandler(async (req, res) => {
//   try {
//     const post = req.body;
//     console.log('validateOT post', post);

//     const query = { businessUserStatus: 'New' };
//     if (post.phoneNumber && !post.emailAddress) {
//       query.phoneNumber = post.phoneNumber
//     } else { query.emailAddress = post.emailAddress }

//     if (post.verificationStatus !== 1) {
//       await encryptPassword(post.emailOTP)
//         .then(data => { post.emailOTP = data; })
//         .catch((error) => { return console.log("emailOTP encryption error:", error); });
//     }
//     await encryptPassword(post.mobileOTP).then(data => {
//       post.mobileOTP = data;
//     }).catch((error) => {
//       console.log("emailOTP encryption error:", error);
//       return;
//     });

//     const fetchedValidBusinessUsers = await BusinessUsers.aggregate([
//       { $match: query },
//       {
//         $project: {
//           firstName: 1, lastName: 1, phoneNumber: 1, emailAddress: 1, emailOTP: 1, mobileOTP: 1
//         }
//       },
//     ]);
//     const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//     var planExpiryDate = new Date(new Date(new Date() - (new Date().getTimezoneOffset() * 60000)).setUTCHours(23, 59, 59, 999));
//     if (fetchedValidBusinessUsers.length > 0) {
//       if ((post.verificationStatus === undefined || post.verificationStatus !== 1) && fetchedValidBusinessUsers[0].emailOTP !== post.emailOTP) {
//         return res.status(202).json(genericResponse(false, "Email OTP not matched.", []));
//       }
//       if (fetchedValidBusinessUsers[0].mobileOTP !== post.mobileOTP) {
//         return res.status(202).json(genericResponse(false, "Mobile OTP not matched.", []));
//       }
//       const newChanges = {};
//       newChanges.userRegistrationDate = currentDate;
//       newChanges.businessUserStatus = 'Active';
//       newChanges.lastModifiedDate = currentDate;
//       newChanges.recordType = "U";
//       const query = { _id: mongoose.Types.ObjectId(fetchedValidBusinessUsers[0]._id) };
//       var newValues = { $set: newChanges }
//       const updatedBusinessUser = await BusinessUsers.updateOne(query, newValues);

//       // Creating User from Business User
//       const validBusinessUser = fetchedValidBusinessUsers[0];
//       validBusinessUser.businessUserID = validBusinessUser._id;
//       validBusinessUser._id = undefined;
//       validBusinessUser.createdDate = currentDate;
//       validBusinessUser.firstTimeUser = 0;
//       validBusinessUser.userStatus = "Active"
//       validBusinessUser.userType = "Business"
//       await encryptPassword(post.userPassword).then(data => {
//         validBusinessUser.userPassword = data;
//       }).catch((error) => {
//         console.log("Password encryption error:", error);
//         return;
//       });
// const addUser = new Users(validBusinessUser);
// const addedUsers = await addUser.save(post);

//       // Providing Premium Plan to Business User
//       const platinumPlan = await SubscriptionPlan.findOne({ planCode: 'BosFM_FreeTrail' });


//       if (platinumPlan) {
//         const addBusinessUserPlan = new BusinessUserPlans();
//         addBusinessUserPlan.businessUserID = validBusinessUser.businessUserID;
//         addBusinessUserPlan.planID = platinumPlan._id;
//         addBusinessUserPlan.planActivationDate = currentDate;
//         // addBusinessUserPlan.planExpiryDate = new Date(planExpiryDate.setDate(planExpiryDate.getDate() + 14));
//         addBusinessUserPlan.createdDate = currentDate;
//         const addedBusinessUserPlan = await addBusinessUserPlan.save();

//         const planFeatures = await PlanFeatures.aggregate([
//           {
//             $match: {
//               planID: mongoose.Types.ObjectId(addedBusinessUserPlan.planID)
//             }
//           },
//           {
//             $addFields: {
//               businessUserPlanID: mongoose.Types.ObjectId(),
//               planFeatureID: mongoose.Types.ObjectId()
//             }
//           },
//         ]);


//         let fetchCredit = [
//           {
//             $match: {
//               planID: mongoose.Types.ObjectId(addedBusinessUserPlan.planID)
//             }
//           },
//           {
//             $lookup: {
//               from: "standard_features",
//               localField: "featureID",
//               foreignField: "_id",
//               pipeline: [
//                 {
//                   $match: {
//                     featureCode: "FMC"
//                   }
//                 }
//               ],
//               as: "standardFeatures",
//             },
//           },
//           { $unwind: "$standardFeatures" },

//           {
//             $project: {
//               featureCount: 1

//             }
//           }

//         ]


//         const fetchFeature = await PlanFeatures.aggregate(fetchCredit)
//         console.log("asdasd", fetchFeature)
//         await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(addedBusinessUserPlan.businessUserID) }, { $set: { availableCredits: fetchFeature[0].featureCount } })


//         const planFeaturesIDArray = [];
//         const formattedPlanFeatures = new Promise((resolve, reject) => {
//           planFeatures.forEach(async (element, index, array) => {
//             planFeaturesIDArray.push(element._id);
//             element.businessUserPlanID = addedBusinessUserPlan._id;
//             element.planFeatureID = element._id;
//             element.createdDate = addedBusinessUserPlan.createdDate;
//             element.recordType = 'I';
//             element._id = undefined;
//             resolve(planFeatures);
//           });
//         });

//         await formattedPlanFeatures.then(data => {
//           const addedBusinessUserPlanFeatures = BusinessUserPlanFeatures.insertMany(data, async function (err, data) {
//             if (err != null) {
//               return console.log(err);
//             }
//             if (data) {

//               const planFeaturesSlabs = await PlanFeaturesSlab.aggregate([
//                 {
//                   $match: {
//                     planFeatureID: { $in: await updateToObjectType(planFeaturesIDArray) }
//                   }
//                 },
//                 {
//                   $addFields: {
//                     businessUserPlanFeatureID: mongoose.Types.ObjectId()
//                   }
//                 },
//               ]);

//               if (planFeaturesSlabs.length > 0) {
//                 const formattedPlanFeaturesSlabs = new Promise((resolve, reject) => {
//                   planFeaturesSlabs.forEach(async (element, index, array) => {
//                     const businessUserPlanFeature = await (data.find((feature) =>
//                       feature.planFeatureID.toString() === element.planFeatureID.toString()));
//                     if (businessUserPlanFeature && businessUserPlanFeature._id) {
//                       element.businessUserPlanFeatureID = businessUserPlanFeature._id
//                     }
//                     element.createdDate = addedBusinessUserPlan.createdDate;
//                     element.recordType = 'I';
//                     element._id = undefined;
//                     resolve(planFeaturesSlabs);
//                   })
//                 });

//                 await formattedPlanFeaturesSlabs.then(data => {
//                   const addedBusinessUserPlanFeatureSlabs = BusinessUserPlanFeatureSlabs.insertMany(data, async function (err, data) {
//                     if (err != null) {
//                       return console.log(err);
//                     }
//                     if (data) {
//                       console.log("BusinessUserPlanFeatureSlabs added successfully.");
//                     }
//                   });
//                 }).catch((error) => {
//                   console.log("BusinessUserPlanFeatureSlabs added error:", error);
//                   return;
//                 });
//               }

//             }
//           });
//         }).catch((error) => {
//           console.log("BusinessUserPlanFeatures added error:", error);
//           return;
//         });

//         const userData = await BusinessUsers.find(query);

//         let fetchQuery = [
//           {
//             $match: { _id: mongoose.Types.ObjectId(validBusinessUser.businessUserID) }
//           },
//           {
//             $lookup: {
//               from: "business_user_plans",
//               localField: "_id",
//               foreignField: "businessUserID",
//               as: "businessUserPlans",
//               pipeline: [
//                 {
//                   $sort: { _id: -1 }
//                 },
//                 {
//                   $limit: 1
//                 }
//               ]
//             }
//           },
//           { $unwind: "$businessUserPlans" },
//           {
//             $lookup: {
//               from: "roles",
//               localField: "businessUserPlans.planID",
//               foreignField: "planID",
//               as: "roleDetails",
//               pipeline: [
//                 {
//                   $match: { applicableForBusinessUser: "Yes", defaultPlanRole: "Yes" }
//                 },
//               ]
//             }
//           },
//           { $unwind: "$roleDetails" },
//           {
//             $project: {
//               defaultPlanRoleID: "$roleDetails._id",
//             }
//           },
//         ];

//         // const fetchAssociatedRoleID = await BusinessUsers.aggregate(fetchQuery).sort({ featureSequence: 1 });
//         console.log("fetchQuery::", fetchQuery);
//         const planDetails = await BusinessUsers.aggregate(fetchQuery).sort({ featureSequence: 1 });

//         if (planDetails.length > 0) { }
//         else {
//           console.log("Plan Default Role not found.");
//           let errorRespnse = genericResponse(false, "Plan Default Role is not found for Premium Plan - Trial.", []);
//           res.status(200).json(errorRespnse);
//           return;
//         }

//         const newChanges = {};
//         newChanges.lastModifiedDate = currentDate;
//         newChanges.recordType = "U";
//         newChanges.roleID = planDetails[0].defaultPlanRoleID;

//         var usersQuery = { businessUserID: validBusinessUser.businessUserID };
//         let newValues = { $set: newChanges };
//         const user = await Users.findOneAndUpdate(usersQuery, newValues);
//         user.roleID = planDetails[0].defaultPlanRoleID;

//         var businessUsersQuery = { _id: validBusinessUser.businessUserID };
//         newChanges.wizardStatusFlag = post.wizardStatusFlag;
//         newValues = { $set: newChanges };
//         await businessUsers.updateOne(businessUsersQuery, newValues);

//         let successResponse = genericResponse(true, "User created successfully.", []);
//         return res.status(200).json(successResponse);
//       }
//       else {
//         console.log("Premium Plan not found.");
//         let errorRespnse = genericResponse(false, "Something went wrong!", []);
//         res.status(200).json(errorRespnse);
//       }

//     }
//     else {
//       const query = { emailAddress: post.emailAddress, businessUserStatus: 'Active', };

// const fetchedValidBusinessUsers = await BusinessUsers.aggregate([
//   {
//     $match: query
//   },
//   {
//     $project: {
//       firstName: 1, lastName: 1, phoneNumber: 1, emailAddress: 1, emailOTP: 1, mobileOTP: 1, verificationStatus: 1
//     }
//   },
// ]);

//       if (fetchedValidBusinessUsers.length > 0) {
//         var incorrectOTP = "";
//         if (fetchedValidBusinessUsers[0].verificationStatus !== 1) {
//           if (fetchedValidBusinessUsers[0].emailOTP !== post.emailOTP && fetchedValidBusinessUsers[0].mobileOTP !== post.mobileOTP)
//             incorrectOTP = "Email & Mobile";
//           else if (fetchedValidBusinessUsers[0].mobileOTP !== post.mobileOTP)
//             incorrectOTP = "Mobile";
//           else incorrectOTP = "Email";
//         } else {
//           if (fetchedValidBusinessUsers[0].mobileOTP !== post.mobileOTP)
//             incorrectOTP = "Mobile";
//         }

//         if (incorrectOTP) {
//           let successResponse = genericResponse(false, incorrectOTP + " OTP not matched.", []);
//           res.status(200).json(successResponse);
//         } else {

//           let successResponse = genericResponse(true, "Verifyed Successfully!", []);
//           res.status(200).json(successResponse);
//         }



//       }
//       else {
//         console.log("vgg")
//         let successResponse = genericResponse(false, "User not found!", []);
//         res.status(200).json(successResponse);
//       }
//     }
//   } catch (error) {
//     console.log("error in forgotPassword=", error);
//     let errorRespnse = genericResponse(false, error.message, []);
//     res.status(200).json(errorRespnse);
//   }
// });

const resendOTP = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("Post:", post);

    var currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var query = { emailAddress: post.emailAddress, businessUserStatus: 'New' };

    var fetchedBusinessUsers = await BusinessUsers.find(query);
    if (fetchedBusinessUsers.length > 0) {
      const validBusinessUser = fetchedBusinessUsers[0];
      const newChanges = {};
      newChanges.lastModifiedDate = currentDate;
      newChanges.recordType = 'U';

      let emailSubject = '';
      let emailBody = '';
      let smsTemplate = '';

      if (post.sendOtpTo.includes('Email')) {
        await generateOtp().then(data => {
          post.emailOTP = data;
        }).catch((error) => {
          console.log("generateOtp error:", error);
          return;
        });

        await encryptPassword(post.emailOTP).then(data => {
          newChanges.emailOTP = data;
        }).catch((error) => {
          console.log("emailOTP encryption error:", error);
          return;
        });

        const templateQuery = { templateStatus: 'Active', templateName: 'ResendOTPEmailNotification' };
        const fetchedTemplates = await Templates.find(templateQuery);
        if (fetchedTemplates.length > 0) {
          let val = fetchedTemplates[0];
          val.templateSubject = val.templateSubject.replaceAll('[FirstName]', post.firstName);
          val.templateSubject = val.templateSubject.replaceAll('[LastName]', post.lastName);
          emailSubject = val.templateSubject;

          val.templateMessage = val.templateMessage.replaceAll('[FirstName]', post.firstName);
          val.templateMessage = val.templateMessage.replaceAll('[LastName]', post.lastName);
          val.templateMessage = val.templateMessage.replaceAll('[OTP]', post.emailOTP);
          emailBody = val.templateMessage;
          await sendEmail(post.emailAddress, emailSubject, emailBody);
        }

      }
      else if (post.sendOtpTo.includes('Mobile')) {
        await generateOtp().then(data => {
          post.mobileOTP = data;
        }).catch((error) => {
          console.log("Password encryption error:", error);
          return;
        });

        await encryptPassword(post.mobileOTP).then(data => {
          newChanges.mobileOTP = data;
        }).catch((error) => {
          console.log("mobileOTP encryption error:", error);
          return;
        });


        const templateQuery = { templateStatus: 'Active', templateName: 'ResendOTPSMSNotification' };
        const fetchedTemplates = await Templates.find(templateQuery);
        if (fetchedTemplates.length > 0) {
          let val = fetchedTemplates[0];
          val.templateMessage = val.templateMessage.replaceAll('[FirstName]', post.firstName);
          val.templateMessage = val.templateMessage.replaceAll('[LastName]', post.lastName);
          val.templateMessage = val.templateMessage.replaceAll('[OTP]', post.mobileOTP);
          smsTemplate = val.templateMessage;
          await sendTwilioMessage(post.phoneNumber, smsTemplate);
        }

      }

      console.log("dfsafsdaf", smsTemplate, emailBody)
      const businessUserUpdateQuery = { _id: mongoose.Types.ObjectId(validBusinessUser._id) };
      console.log("sdsadasd", businessUserUpdateQuery, validBusinessUser._id)
      let newValues = { $set: newChanges };
      const updatedBusinessUser = await BusinessUsers.updateOne(businessUserUpdateQuery, newValues);
      res.status(201).json(genericResponse(true, "OTP sent successfully", []));

    }
    else {
      let errorRespnse = genericResponse(false, "Email not found! Please signup again", []);
      res.status(200).json(errorRespnse);
      return;
    }

  } catch (error) {
    console.log("Catch in sendOTP: ", error);
    res.status(400).json(genericResponse(false, error.message, []));
  }
});

const validateReferralCode = asyncHandler(async (req, res) => {

  try {
    const post = req.body;
    const query = { referralCode: post.referralCode, userStatus: 'Approved' };
    const fetchedAffiliateProgramUsers = await AffiliateProgram.find(query, { _id: 1 });
    console.log("fetchedAffiliateProgramUsers: ", fetchedAffiliateProgramUsers.length);
    if (fetchedAffiliateProgramUsers.length == 1) {
      let successResponse = genericResponse(true, "Referral Code vadidated successfully.", fetchedAffiliateProgramUsers[0]);
      // res.status(200).json(successResponse);
      res.send(successResponse);
    }
    else if (fetchedAffiliateProgramUsers.length > 1) {
      let errorRespnse = genericResponse(false, "More than 1 Affiliate User found!", []);
      // res.status(400).json(errorRespnse);
      res.send(errorRespnse);
    }
    else {
      console.log("Referral Code is not valid!");
      let errorRespnse = genericResponse(false, "Referral Code is not valid!", []);
      // res.status(400).json(errorRespnse);
      res.send(errorRespnse);
      return;
    }
  }
  catch (error) {
    console.log("Catch in validateReferralCode: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const fetchCredit = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) };
    const fetchedCredit = await BusinessUsers.find(query, { availableCredits: 1 });
    if (fetchedCredit.length > 0) {
      let successResponse = genericResponse(true, "fetch Credit Successfully!", fetchedCredit);
      res.status(200).json(successResponse);

    }
    else {

      let successResponse = genericResponse(false, "No Credits", []);
      res.status(200).json(successResponse);
    }
  }
  catch (error) {
    console.log("Catch in validateReferralCode: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const generateTokenID = asyncHandler(async (req, res) => {

  try {
    const post = req.body;
    let payload = {
      _id: post.id,
    }

    jwt.sign(payload, process.env.JWT_SECRET_TOKEN, { expiresIn: "3h" }, (err, token) => {
      if (token) {
        let successResponse = genericResponse(true, "User logged in successfully.", { token: token });
        res.status(200).json(successResponse);
      } else {
        let successResponse = genericResponse(false, "Something Went Wrong!",);
        res.status(200).json(successResponse);
      }
    });

  }
  catch (error) {
    console.log("Catch in validateReferralCode: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const googleSigin = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const user = await BusinessUsers.findOne({ emailAddress: post.email }, { firstName: 1, lastName: 1, emailAddress: 1, verificationStatus: 1, verificationType: 1, phoneNumber: 1 })
    if (user !== null && user !== undefined) {
      let successResponse = genericResponse(true, "Data Uploaded Succesfully!", user);
      res.status(200).json(successResponse)
    } else {
      post.firstName = post.givenName
      post.lastName = post.familyName
      post.emailAddress = post.email
      post.verificationType = "Google"
      post.verificationStatus = 1
      post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      post.recordType = "I"
      post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      const saveUser = await new BusinessUsers(post).save()
      let successResponse = genericResponse(true, "Data Uploaded Succesfully!", saveUser);
      res.status(200).json(successResponse)
    }
  }
  catch (error) {
    console.log("Catch in validateReferralCode: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});
const facebookSignin = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const user = await BusinessUsers.findOne({ emailAddress: post.email }, { firstName: 1, lastName: 1, emailAddress: 1, verificationStatus: 1, verificationType: 1, phoneNumber: 1 })
    if (user !== null && user !== undefined) {
      let successResponse = genericResponse(true, "Data Uploaded Succesfully!", user);
      res.status(200).json(successResponse)
    } else {
      post.firstName = post.first_name
      post.lastName = post.last_name
      post.emailAddress = post.email
      post.verificationType = "Facebook"
      post.verificationStatus = 1
      post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      post.recordType = "I"
      post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      const saveUser = await new BusinessUsers(post).save()
      let successResponse = genericResponse(true, "Data Uploaded Succesfully!", saveUser);
      res.status(200).json(successResponse)
    }
  }
  catch (error) {
    console.log("Catch in validateReferralCode: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});


const changePass = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    await encryptPassword(post.newPassword).then(data => {
      post.newPassword = data;
    }).catch((error) => {
      console.log("emailOTP encryption error:", error);
      return;
    });

    const [updateBu, UpdateUser, fetchUsers] = await Promise.all([
      await BusinessUsers.updateOne({ emailAddress: post.emailAddress }, { verificationStatus: 0, wizardStatusFlag: 1 }),
      await Users.updateOne({ emailAddress: post.emailAddress }, { userPassword: post.newPassword }),
      await Users.find({ emailAddress: post.emailAddress })
    ])
    if (fetchUsers.length > 0) {
      let successResponse = genericResponse(true, "User logged in successfully.", fetchUsers[0]);
      res.status(200).json(successResponse);
    } else {
      let successResponse = genericResponse(false, "User Not Found!",);
      res.status(200).json(successResponse);
    }

  }
  catch (error) {
    console.log("Catch in validateReferralCode: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const wizardSignup = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("asdasd", post)
    post.wizardStatusFlag = 0
    const fetchUsers = await Users.find({ _id: mongoose.Types.ObjectId(post.id) })

    if (fetchUsers.length > 0) {
      post.id = undefined
      await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(fetchUsers[0].businessUserID) }, { $set: post })

      let payload = {
        _id: fetchUsers[0].id,
      }
      jwt.sign(payload, process.env.JWT_SECRET_TOKEN, { expiresIn: "3h" }, (err, token) => {
        if (token) {
          let successResponse = genericResponse(true, "User logged in successfully.", { data: fetchUsers[0], token: token });
          res.status(200).json(successResponse);
        } else {
          let successResponse = genericResponse(false, "Something Went Wrong!",);
          res.status(200).json(successResponse);
        }

      })
    } else {
      let successResponse = genericResponse(false, "User Not Found", []);
      res.status(200).json(successResponse);
    }

  }
  catch (error) {
    console.log("Catch in wizardSignup: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});


const validateOTP = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log('validateOTP post', post);
    let query = { phoneNumber: post.phoneNumber };

    if (post.verificationStatus === undefined || post.verificationStatus !== 1) {
      query.emailAddress = post.emailAddress;
      await encryptPassword(post.emailOTP)
        .then(data => { post.emailOTP = data; })
        .catch((error) => { return console.log("emailOTP encryption error:", error); });
    }
    await encryptPassword(post.mobileOTP).then(data => {
      post.mobileOTP = data;
    }).catch((error) => {
      console.log("emailOTP encryption error:", error);
      return;
    });

    console.log("query", query);
    let fetchedValidBusinessUsers = await BusinessUsers.find(query);

    console.log('fetchedValidBusinessUsers', fetchedValidBusinessUsers);
    if (fetchedValidBusinessUsers.length > 0) {
      const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      if (fetchedValidBusinessUsers[0].businessUserStatus === 'New') {
        if (fetchedValidBusinessUsers[0].mobileOTP !== post.mobileOTP && fetchedValidBusinessUsers[0].emailOTP !== post.emailOTP) {
          return res.status(202).json(genericResponse(false, "Mobile and Email OTP not matched.", []));
        }
        if ((post.verificationStatus === undefined || post.verificationStatus !== 1) && fetchedValidBusinessUsers[0].emailOTP !== post.emailOTP) {
          return res.status(202).json(genericResponse(false, "Email OTP not matched.", []));
        }
        if (fetchedValidBusinessUsers[0].mobileOTP !== post.mobileOTP) {
          return res.status(202).json(genericResponse(false, "Mobile OTP not matched.", []));
        }

        //update the business user
        const newChanges = {};
        newChanges.businessUserStatus = 'Active';
        newChanges.userRegistrationDate = currentDate;
        newChanges.lastModifiedDate = currentDate;
        newChanges.recordType = "U";
        await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(fetchedValidBusinessUsers[0]._id) }, { $set: newChanges });
        //save the business user details in users collection.

        let businessUser = fetchedValidBusinessUsers[0];
        let validBusinessUser = {
          firstName: businessUser.firstName,
          lastName: businessUser.lastName,
          phoneNumber: businessUser.phoneNumber,
          emailAddress: businessUser.emailAddress,
          businessUserID: businessUser._id,
          userType: "Business",
          userStatus: "Active",
          createdDate: currentDate,
          firstTimeUser: 0
        };
        await new Users(validBusinessUser).save();

        //Plan Subsription
        const platinumPlan = await SubscriptionPlan.findOne({ planCode: 'BosFM_FreeTrail' });
        if (platinumPlan) {
          const addBusinessUserPlan = new BusinessUserPlans();
          addBusinessUserPlan.businessUserID = validBusinessUser.businessUserID;
          addBusinessUserPlan.planID = platinumPlan._id;
          addBusinessUserPlan.planActivationDate = currentDate;
          // addBusinessUserPlan.planExpiryDate = new Date(planExpiryDate.setDate(planExpiryDate.getDate() + 14));
          addBusinessUserPlan.createdDate = currentDate;
          const addedBusinessUserPlan = await addBusinessUserPlan.save();

          const planFeatures = await PlanFeatures.aggregate([
            {
              $match: {
                planID: mongoose.Types.ObjectId(addedBusinessUserPlan.planID)
              }
            },
            {
              $addFields: {
                businessUserPlanID: mongoose.Types.ObjectId(),
                planFeatureID: mongoose.Types.ObjectId()
              }
            },
          ]);


          let fetchCredit = [
            {
              $match: {
                planID: mongoose.Types.ObjectId(addedBusinessUserPlan.planID)
              }
            },
            {
              $lookup: {
                from: "standard_features",
                localField: "featureID",
                foreignField: "_id",
                pipeline: [
                  {
                    $match: {
                      featureCode: "FMC"
                    }
                  }
                ],
                as: "standardFeatures",
              },
            },
            { $unwind: "$standardFeatures" },

            {
              $project: {
                featureCount: 1

              }
            }

          ]


          const fetchFeature = await PlanFeatures.aggregate(fetchCredit)
          console.log("asdasd", fetchFeature)
          await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(addedBusinessUserPlan.businessUserID) }, { $set: { availableCredits: fetchFeature[0].featureCount } })


          const planFeaturesIDArray = [];
          const formattedPlanFeatures = new Promise((resolve, reject) => {
            planFeatures.forEach(async (element, index, array) => {
              planFeaturesIDArray.push(element._id);
              element.businessUserPlanID = addedBusinessUserPlan._id;
              element.planFeatureID = element._id;
              element.createdDate = addedBusinessUserPlan.createdDate;
              element.recordType = 'I';
              element._id = undefined;
              resolve(planFeatures);
            });
          });

          await formattedPlanFeatures.then(data => {
            const addedBusinessUserPlanFeatures = BusinessUserPlanFeatures.insertMany(data, async function (err, data) {
              if (err != null) {
                return console.log(err);
              }
              if (data) {

                const planFeaturesSlabs = await PlanFeaturesSlab.aggregate([
                  {
                    $match: {
                      planFeatureID: { $in: await updateToObjectType(planFeaturesIDArray) }
                    }
                  },
                  {
                    $addFields: {
                      businessUserPlanFeatureID: mongoose.Types.ObjectId()
                    }
                  },
                ]);

                if (planFeaturesSlabs.length > 0) {
                  const formattedPlanFeaturesSlabs = new Promise((resolve, reject) => {
                    planFeaturesSlabs.forEach(async (element, index, array) => {
                      const businessUserPlanFeature = await (data.find((feature) =>
                        feature.planFeatureID.toString() === element.planFeatureID.toString()));
                      if (businessUserPlanFeature && businessUserPlanFeature._id) {
                        element.businessUserPlanFeatureID = businessUserPlanFeature._id
                      }
                      element.createdDate = addedBusinessUserPlan.createdDate;
                      element.recordType = 'I';
                      element._id = undefined;
                      resolve(planFeaturesSlabs);
                    })
                  });

                  await formattedPlanFeaturesSlabs.then(data => {
                    const addedBusinessUserPlanFeatureSlabs = BusinessUserPlanFeatureSlabs.insertMany(data, async function (err, data) {
                      if (err != null) {
                        return console.log(err);
                      }
                      if (data) {
                        console.log("BusinessUserPlanFeatureSlabs added successfully.");
                      }
                    });
                  }).catch((error) => {
                    console.log("BusinessUserPlanFeatureSlabs added error:", error);
                    return;
                  });
                }

              }
            });
          }).catch((error) => {
            console.log("BusinessUserPlanFeatures added error:", error);
            return;
          });

          const userData = await BusinessUsers.find(query);

          let fetchQuery = [
            {
              $match: { _id: mongoose.Types.ObjectId(validBusinessUser.businessUserID) }
            },
            {
              $lookup: {
                from: "business_user_plans",
                localField: "_id",
                foreignField: "businessUserID",
                as: "businessUserPlans",
                pipeline: [
                  {
                    $sort: { _id: -1 }
                  },
                  {
                    $limit: 1
                  }
                ]
              }
            },
            { $unwind: "$businessUserPlans" },
            {
              $lookup: {
                from: "roles",
                localField: "businessUserPlans.planID",
                foreignField: "planID",
                as: "roleDetails",
                pipeline: [
                  {
                    $match: { applicableForBusinessUser: "Yes", defaultPlanRole: "Yes" }
                  },
                ]
              }
            },
            { $unwind: "$roleDetails" },
            {
              $project: {
                defaultPlanRoleID: "$roleDetails._id",
              }
            },
          ];

          // const fetchAssociatedRoleID = await BusinessUsers.aggregate(fetchQuery).sort({ featureSequence: 1 });
          console.log("fetchQuery::", fetchQuery);
          const planDetails = await BusinessUsers.aggregate(fetchQuery).sort({ featureSequence: 1 });

          if (planDetails.length > 0) { }
          else {
            console.log("Plan Default Role not found.");
            let errorRespnse = genericResponse(false, "Plan Default Role is not found for Premium Plan - Trial.", []);
            res.status(200).json(errorRespnse);
            return;
          }

          const newChanges = {};
          newChanges.lastModifiedDate = currentDate;
          newChanges.recordType = "U";
          newChanges.roleID = planDetails[0].defaultPlanRoleID;

          var usersQuery = { businessUserID: validBusinessUser.businessUserID };
          let newValues = { $set: newChanges };
          const user = await Users.findOneAndUpdate(usersQuery, newValues);
          user.roleID = planDetails[0].defaultPlanRoleID;

          var businessUsersQuery = { _id: validBusinessUser.businessUserID };
          newChanges.wizardStatusFlag = post.wizardStatusFlag;
          newValues = { $set: newChanges };
          await BusinessUsers.updateOne(businessUsersQuery, newValues);

          let successResponse = genericResponse(true, "User created successfully.", []);
          return res.status(200).json(successResponse);
        }
        else {
          console.log("Premium Plan not found.");
          let errorRespnse = genericResponse(false, "Something went wrong!", []);
          return res.status(200).json(errorRespnse);
        }
      }

      else if (fetchedValidBusinessUsers[0].businessUserStatus === 'Active') {
        // if business user already a registerd and trying to validate OTP (in case of forgot password).
        var incorrectOTP = "";
        if (fetchedValidBusinessUsers[0].verificationStatus !== 1) {
          if (fetchedValidBusinessUsers[0].emailOTP !== post.emailOTP && fetchedValidBusinessUsers[0].mobileOTP !== post.mobileOTP)
            incorrectOTP = "Email & Mobile";
          else if (fetchedValidBusinessUsers[0].mobileOTP !== post.mobileOTP)
            incorrectOTP = "Mobile";
          else incorrectOTP = "Email";
        } else {
          if (fetchedValidBusinessUsers[0].mobileOTP !== post.mobileOTP)
            incorrectOTP = "Mobile";
        }

        if (incorrectOTP) {
          let successResponse = genericResponse(false, incorrectOTP + " OTP not matched.", []);
          res.status(200).json(successResponse);
        } else {

          let successResponse = genericResponse(true, "Verifyed Successfully!", []);
          res.status(200).json(successResponse);
        }
      }
      else {
        return res.status(200).json(genericResponse(false, "User is Inactive, Please Contact Admin.", []));
      }
    }
    else {
      return res.status(200).json(genericResponse(false, "User Not Found, Please try again.", []));
    }
  } catch (error) {
    console.log("error in validateOTP =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    return res.status(400).json(errorRespnse);
  }
});



export {
  addCustomerForMobileApi, validateOTPForMobileApi, wizardSignupForMobileApi, ResendOTPForMobileApi, authenticateUserAndLogin,
  resetPasswordForMobileApi,

  signup,
  forgotPassword,
  checkLoginDetails,
  resetPassword,
  fetchPlans,
  sendOTP,
  validateOTP,
  resendOTP,
  generateTokenID,
  validateReferralCode, fetchCredit, googleSigin, facebookSignin, changePass, wizardSignup
}
