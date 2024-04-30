import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import sendTwilioMessage, { encryptPassword, generateOtp, generatePassword, generateSearchParameterList, sendMail, sendMailBySendGrid, updateToObjectType, uploadImageFile } from '../routes/genericMethods.js';
import affiliate from '../models/affilateProgramUsersModel.js'
import { TemplateInstance } from 'twilio/lib/rest/verify/v2/template.js';
import commissionTransaction from '../models/commissiontransactionModel.js'
import commissionPayment from '../models/commissionPaymentModel.js'
import { EsimProfileList } from 'twilio/lib/rest/supersim/v1/esimProfile.js';
import apBankDetails from '../models/apBankDetailsModel.js';
import BusinessUsers from '../models/businessUsersModel.js';
import Templates from '../models/templatesModel.js';

const apSignup = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log(post);
    let signupFlag = 0;
    let status = "";
    var query1 = { emailAddress: post.emailAddress };
    var checkIfEmailAlredyExist = await affiliate.find(query1);
    checkIfEmailAlredyExist = await affiliate.find(query1);
    if (checkIfEmailAlredyExist.length > 0) {

      if (checkIfEmailAlredyExist[0].otpVerified == 0 && checkIfEmailAlredyExist[0].userStatus == "Pending") {
        status = "Email";
        signupFlag = 1;
      } else {
        signupFlag = 0;
        let errorRespnse = genericResponse(false, "Email Already Exist.", []);
        res.status(200).json(errorRespnse);
        return;
      }
    }

    var query = { phoneNumber: post.phoneNumber };

    if (post.phoneNumber != "" && post.phoneNumber != undefined) {
      var checkIfPhoneNumberAlredyExist = await affiliate.find(query);
      checkIfEmailAlredyExist = await affiliate.find(query);

      // checkIfPhoneNumberAlredyExist = await affiliate.find(query);
      if (checkIfPhoneNumberAlredyExist.length > 0) {

        console.log("sdjksa", checkIfPhoneNumberAlredyExist[0].otpVerified);
        if (checkIfPhoneNumberAlredyExist[0].otpVerified == 0 && checkIfPhoneNumberAlredyExist[0].userStatus == "Pending") {

          status = "Phone";
          // if( checkIfPhoneNumberAlredyExist[0].emailAddress !== post.emailAddress){

          //   let errorRespnse = genericResponse(false, "Email Address doesn't match!", []);
          //   res.status(200).json(errorRespnse);
          //   return;

          // }

          signupFlag = 1;

        } else {
          signupFlag = 0;
          let errorRespnse = genericResponse(false, "Phone Number Already Exist.", []);
          res.status(200).json(errorRespnse);
          return;
        }
      }
    }

    var query2 = { referralCode: post.referralCode };
    var checkIfEmailAlredyExist = await affiliate.find(query2);
    checkIfEmailAlredyExist = await affiliate.find(query2);
    if (checkIfEmailAlredyExist.length > 0) {

      // console.log("sdjksa", checkIfPhoneNumberAlredyExist[0].otpVerified)

      if (checkIfEmailAlredyExist[0].otpVerified == 0 && checkIfEmailAlredyExist[0].userStatus == "Pending") {

      } else {
        signupFlag = 0;
        let errorRespnse = genericResponse(false, "Preferred referral code already exits", []);
        res.status(200).json(errorRespnse);
        return;
      }
    }

    await encryptPassword(post.userPassword).then(data => {
      post.userPassword = data;
    }).catch((error) => {
      console.log("Password encryption error:", error);
      return;
    });
    await generateOtp().then(data => {
      post.emailOTP = data;
    }).catch((error) => {
      console.log("generateOtp error:", error);
      return;
    });
    // await encryptPassword(post.ccName).then(data => {
    //   post.ccName = data;
    // }).catch((error) => {
    //   console.log("ccName encryption error:", error);
    //   return;
    // });

    let emailSubject = '';
    let emailBody = '';
    const templateQuery = { templateStatus: 'Active', templateName: 'SignupOTPEmailNotification' };
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
    }

    await encryptPassword(post.emailOTP).then(data => {
      post.emailOTP = data;
    }).catch((error) => {
      console.log("emailOTP encryption error:", error);
      return;
    });
    await generateOtp().then(data => {
      post.mobileOTP = data;
    }).catch((error) => {
      console.log("Password encryption error:", error);
      return;
    });

    let smsTemplate = '';
    const smsTemplateQuery = { templateStatus: 'Active', templateName: 'SignupOTPSMSNotification' };
    const smsFetchedTemplates = await Templates.find(smsTemplateQuery);
    if (smsFetchedTemplates.length > 0) {
      let val = smsFetchedTemplates[0];
      val.templateMessage = val.templateMessage.replaceAll('[FirstName]', post.firstName);
      val.templateMessage = val.templateMessage.replaceAll('[LastName]', post.lastName);
      val.templateMessage = val.templateMessage.replaceAll('[OTP]', post.mobileOTP);
      smsTemplate = val.templateMessage;
    }

    await encryptPassword(post.mobileOTP).then(data => {
      post.mobileOTP = data;
    }).catch((error) => {
      console.log("mobileOTP encryption error:", error);
      return;
    });

    if (signupFlag == 1) {
      let query4 = {}
      if (status == "Email") {
        query4 = { emailAddress: post.emailAddress }

      } else {
        query4 = { phoneNumber: post.phoneNumber }

      }

      // var query4 = { emailAddress: post.emailAddress };
      if (post.mobileNumberExist && smsFetchedTemplates.length > 0)
        await sendTwilioMessage(post.phoneNumber, smsTemplate);

      post.firstTimeUser = 0;
      let newValues = { $set: post }
      const update = await affiliate.updateOne(query4, newValues);
      if (fetchedTemplates.length > 0)
        await sendMailBySendGrid(post.emailAddress, emailSubject, emailBody);
      let successResponse = genericResponse(true, "Updated Successfully", []);
      res.status(200).json(successResponse);
      return;
    }

    post.firstTimeUser = 0;
    let add = new affiliate(post)
    const respo = await add.save();
    if (fetchedTemplates.length > 0)
      await sendMailBySendGrid(post.emailAddress, emailSubject, emailBody);

    if (post.mobileNumberExist && smsFetchedTemplates.length > 0)
      await sendTwilioMessage(post.phoneNumber, smsTemplate);

    let successResponse = genericResponse(true, "Added Successfully", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("failed to add template ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});


const updateAPDetails = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post._id) };
    // var query2 = { referralCode: post.referralCode };
    const refercheck = {
      _id: { $ne: mongoose.Types.ObjectId(req.body._id) },
      referralCode: { '$regex': '^' + req.body.referralCode.trim() + '$', '$options': 'i' }
    };
    var checkIfEmailAlredyExist = await affiliate.find(refercheck);
    checkIfEmailAlredyExist = await affiliate.find(refercheck);
    if (checkIfEmailAlredyExist.length > 0) {
      let errorRespnse = genericResponse(false, "Preferred referral code already exits", []);
      res.status(200).json(errorRespnse);
      return;
    }

    if (post.userStatus == "Approved") {
      let value = ""
      if (post.commisionPercentage != "" && post.commisionPercentage != undefined) {
        value = "(" + post.commisionPercentage + "%)";
      }
      if (post.commissionLumpsum != "" && post.commissionLumpsum != undefined) {
        value = "($ " + post.commissionLumpsum + ")";
      }
      // value = post.commissionType
      // commisionPercentage
      // commissionAmount

      const templateQuery = { templateStatus: 'Active', templateName: 'AffiliateProgramUserApprovalEmailNotification' };
      const fetchedTemplates = await Templates.find(templateQuery);
      if (fetchedTemplates.length > 0) {
        let emailSubject = '';
        let emailBody = '';
        let val = fetchedTemplates[0];
        emailSubject = val.templateSubject;
        val.templateMessage = val.templateMessage.replaceAll('[URL]', post.apLoginURL);
        val.templateMessage = val.templateMessage.replaceAll('[EmailAddress]', post.emailAddress);
        val.templateMessage = val.templateMessage.replaceAll('[CommissionType]', post.commissionType);
        val.templateMessage = val.templateMessage.replaceAll('[CommissionTypeValue]', value);
        val.templateMessage = val.templateMessage.replaceAll('[CommissionPeriod]', post.commissionPeriod);
        emailBody = val.templateMessage;
        await sendMailBySendGrid(post.emailAddress, emailSubject, emailBody);
      }

      post.activationDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      let newValues1 = { $set: post }
      const update = await affiliate.updateOne(query, newValues1)
      let successResponse = genericResponse(true, "Updated successfully", []);
      res.status(200).json(successResponse);
    } else {
      const templateQuery = { templateStatus: 'Active', templateName: 'AffiliateProgramUserRejectionEmailNotification' };
      const fetchedTemplates = await Templates.find(templateQuery);
      if (fetchedTemplates.length > 0) {
        let emailSubject = '';
        let emailBody = '';
        let val = fetchedTemplates[0];
        emailSubject = val.templateSubject;
        val.templateMessage = val.templateMessage.replaceAll('[EmailAddress]', post.emailAddress);
        val.templateMessage = val.templateMessage.replaceAll('[RejectionReason]', post.rejectionNotes);
        emailBody = val.templateMessage;
        await sendMailBySendGrid(post.emailAddress, emailSubject, emailBody);
      }

      let newValues = { $set: post }
      const update = await affiliate.updateOne(query, newValues)
      let successResponse = genericResponse(true, "Updated successfully", []);
      res.status(200).json(successResponse);
    }
  } catch {
    console.log("failed to add template ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const apValidateOtp = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("apValidateOtp post: ", post)
    const query = { emailAddress: post.emailAddress };
    const fetch = await affiliate.findOne(query);
    // console.log("ndjshfsd", fetch)
    if (fetch != "" && fetch != undefined) {

      await encryptPassword(post.emailOTP).then(data => {
        post.emailOTP = data;
      }).catch((error) => {
        console.log("emailOTP encryption error:", error);
        return;
      });
      if (fetch.emailOTP != post.emailOTP) {
        let successResponse = genericResponse(false, "Email OTP is incorrect", []);
        res.status(200).json(successResponse);
        return;
      }
      if (post.mobileNumberExist) {

        await encryptPassword(post.mobileOTP).then(data => {
          post.mobileOTP = data;
        }).catch((error) => {
          console.log("emailOTP encryption error:", error);
          return;
        });
        if (fetch.mobileOTP != post.mobileOTP) {
          let successResponse = genericResponse(false, "Mobile OTP is incorrect", []);
          res.status(200).json(successResponse);
          return;
        }
      }

      if (fetch.otpVerified == 0) {
        const value = { otpVerified: 1 }
        await affiliate.updateOne(query, value)
        const affilateUsers = await affiliate.findOne(query);
        // console.log("affilateUsers:", affilateUsers);
        let successResponse = genericResponse(true, "successfull", affilateUsers);
        res.status(200).json(successResponse);
        return;
      }
      console.log("values 2: ", fetch)
      let successResponse = genericResponse(true, "successfull", fetch);
      res.status(200).json(successResponse);
    }
  } catch (error) {
    console.log("failed to add template ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);

  }
});

const apResendOTP = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var query = { emailAddress: post.emailAddress };

    var fetchedBusinessUsers = await affiliate.find(query);
    if (fetchedBusinessUsers.length > 0) {
      const validBusinessUser = fetchedBusinessUsers[0];
      const newChanges = {};
      newChanges.lastModifiedDate = currentDate;
      newChanges.recordType = 'U';


      if (post.sendOtpTo.includes('Email')) {

        await generateOtp().then(data => {
          post.emailOTP = data;
        }).catch((error) => {
          console.log("generateOtp error:", error);
          return;
        });

        const templateQuery = { templateStatus: 'Active', templateName: 'ResendOTPEmailNotification' };
        const fetchedTemplates = await Templates.find(templateQuery);
        if (fetchedTemplates.length > 0) {
          let emailSubject = '';
          let emailBody = '';
          let val = fetchedTemplates[0];
          val.templateSubject = val.templateSubject.replaceAll('[FirstName]', post.firstName);
          val.templateSubject = val.templateSubject.replaceAll('[LastName]', post.lastName);
          emailSubject = val.templateSubject;

          val.templateMessage = val.templateMessage.replaceAll('[FirstName]', post.firstName);
          val.templateMessage = val.templateMessage.replaceAll('[LastName]', post.lastName);
          val.templateMessage = val.templateMessage.replaceAll('[OTP]', post.emailOTP);
          emailBody = val.templateMessage;
          await sendMailBySendGrid(post.emailAddress, emailSubject, emailBody);
        }

        await encryptPassword(post.emailOTP).then(data => {
          newChanges.emailOTP = data;
        }).catch((error) => {
          console.log("emailOTP encryption error:", error);
          return;
        });

      }

      if (post.sendOtpTo.includes('Mobile')) {
        await generateOtp().then(data => {
          post.mobileOTP = data;
        }).catch((error) => {
          console.log("Password encryption error:", error);
          return;
        });


        const templateQuery = { templateStatus: 'Active', templateName: 'ResendOTPSMSNotification' };
        const fetchedTemplates = await Templates.find(templateQuery);
        if (fetchedTemplates.length > 0) {
          let val = fetchedTemplates[0];
          let smsTemplate = '';
          val.templateMessage = val.templateMessage.replaceAll('[FirstName]', post.firstName);
          val.templateMessage = val.templateMessage.replaceAll('[LastName]', post.lastName);
          val.templateMessage = val.templateMessage.replaceAll('[OTP]', post.mobileOTP);
          smsTemplate = val.templateMessage;
          await sendTwilioMessage(post.phoneNumber, smsTemplate);
        }

        await encryptPassword(post.mobileOTP).then(data => {
          newChanges.mobileOTP = data;
        }).catch((error) => {
          console.log("mobileOTP encryption error:", error);
          return;
        });

      }

      const businessUserUpdateQuery = { _id: mongoose.Types.ObjectId(validBusinessUser._id) };
      let newValues = { $set: newChanges };
      const updatedBusinessUser = await affiliate.updateOne(businessUserUpdateQuery, newValues);

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


const authenticateAPUser = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    var query = { emailAddress: (post.emailAddress) }
    const update = await affiliate.findOne(query);

    if (update != "" && update != undefined) {
      await encryptPassword(post.userPassword).then(data => {
        post.userPassword = data;
      }).catch((error) => {
        console.log("emailOTP encryption error:", error);
        return;
      });

      if (update.userPassword === post.userPassword) {

        if (update.userStatus == "Pending" && update.otpVerified == 1) {
          let successResponse = genericResponse(false, "This user is not Approved.", []);
          res.status(200).json(successResponse);
          return;
        }

        if (update.userStatus == "Inactive") {
          let successResponse = genericResponse(false, "This user is Inactive.", []);
          res.status(200).json(successResponse);
          return;
        }

        if (update.userStatus == "Rejected") {
          let successResponse = genericResponse(false, "This user is Rejected.", []);
          res.status(200).json(successResponse);
          return;
        }


        if (update.otpVerified == 0) {

          await generateOtp().then(data => {
            post.emailOTP = data;
          }).catch((error) => {
            console.log("generateOtp error:", error);
            return;
          });
          // await encryptPassword(post.ccName).then(data => {
          //   post.ccName = data;
          // }).catch((error) => {
          //   console.log("ccName encryption error:", error);
          //   return;
          // });

          let emailSubject = '';
          let emailBody = '';
          const templateQuery = { templateStatus: 'Active', templateName: 'SignupOTPEmailNotification' };
          const fetchedTemplates = await Templates.find(templateQuery);
          if (fetchedTemplates.length > 0) {
            let val = fetchedTemplates[0];
            val.templateSubject = val.templateSubject.replaceAll('[FirstName]', update.firstName);
            val.templateSubject = val.templateSubject.replaceAll('[LastName]', update.lastName);
            emailSubject = val.templateSubject;

            val.templateMessage = val.templateMessage.replaceAll('[FirstName]', update.firstName);
            val.templateMessage = val.templateMessage.replaceAll('[LastName]', update.lastName);
            val.templateMessage = val.templateMessage.replaceAll('[OTP]', post.emailOTP);
            emailBody = val.templateMessage;
          }

          await encryptPassword(post.emailOTP).then(data => {
            post.emailOTP = data;
          }).catch((error) => {
            console.log("emailOTP encryption error:", error);
            return;
          });
          await generateOtp().then(data => {
            post.mobileOTP = data;
          }).catch((error) => {
            console.log("Password encryption error:", error);
            return;
          });

          let smsTemplate = '';
          const smsTemplateQuery = { templateStatus: 'Active', templateName: 'SignupOTPSMSNotification' };
          const smsFetchedTemplates = await Templates.find(smsTemplateQuery);
          if (smsFetchedTemplates.length > 0) {
            let val = smsFetchedTemplates[0];
            val.templateMessage = val.templateMessage.replaceAll('[FirstName]', update.firstName);
            val.templateMessage = val.templateMessage.replaceAll('[LastName]', update.lastName);
            val.templateMessage = val.templateMessage.replaceAll('[OTP]', post.mobileOTP);
            smsTemplate = val.templateMessage;
          }

          await encryptPassword(post.mobileOTP).then(data => {
            post.mobileOTP = data;
          }).catch((error) => {
            console.log("mobileOTP encryption error:", error);
            return;
          });

          let newvalues = { $set: post };
          await affiliate.updateOne(query, newvalues);

          await sendTwilioMessage(update.phoneNumber, smsTemplate);
          await sendMailBySendGrid(update.emailAddress, emailSubject, emailBody);

          let successResponse = genericResponse(true, "Otp sent Sucessfully", update);
          res.status(200).json(successResponse);
          return;

        }

        let successResponse = genericResponse(true, "Login successfully", update);
        res.status(200).json(successResponse);
        return;
      }
      else {
        let successResponse = genericResponse(false, "Password incorrect", []);
        res.status(200).json(successResponse);
      }
    } else {
      let successResponse = genericResponse(false, "Email doesnt Exist", []);
      res.status(200).json(successResponse);
    }


  } catch {
    console.log("failed to add template ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);

  }
});

const fetchAPUsers = asyncHandler(async (req, res) => {
  try {
    const post = req.body;

    if (post.userStatus == "All") {
      var query = {};
      if (post.searchParameter != undefined && post.searchParameter != '')
        query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);
    } else {
      var query = { userStatus: post.userStatus };
      if (post.searchParameter != undefined && post.searchParameter != '')
        query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);
    }

    // if (post.searchParameter != undefined && post.searchParameter != '')
    //   query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);

    var fetchQuery = [
      {
        $lookup: {
          from: "program_commissions",
          localField: "_id",
          foreignField: "apUserID",
          as: "programcommission",
        }
      },
      {
        $lookup: {
          from: "program_commissions",
          localField: "_id",
          foreignField: "apUserID",
          pipeline: [
            {
              $match: {
                commissionStatus: "Pending"
              }
            }
          ],
          as: "programcommissionPending",
        },
      },
      {
        $lookup: {
          from: "program_commissions",
          localField: "_id",
          foreignField: "apUserID",
          pipeline: [
            {
              $match: { commissionStatus: "Paid" }
            }
          ],
          as: "programcommissionPaid",
        }
      },
      {
        $lookup: {
          from: "business_users",
          localField: "referralCode",
          foreignField: "referralCode",
          as: "businessUserPlans",
        }
      },
      // {$unwind:"$businessUserPlans"},
      {
        $project: {
          userName: { $concat: ["$firstName", " ", "$lastName"] },
          companyName: "$companyName",
          createdDate: { $dateToString: { format: '%Y-%m-%d', date: '$createdDate' } },
          userStatus: "$userStatus",
          activationDate: "$activationDate",
          referralCount: {
            $size: "$businessUserPlans"
          },
          // commission:"$programcommission.commissionStatus",
          commissionApproved: { $size: { $filter: { input: "$programcommission.commissionStatus", as: "programcommission", cond: { $eq: ["$$programcommission", "Approved"] } } } },
          commissionPaid: { $sum: "$programcommissionPaid.commissionAmount" },
          commissionPeding: { $sum: "$programcommissionPending.commissionAmount" },
          commissionPaidCount: { $size: "$programcommissionPaid" },
          commissionPedingCount: { $size: "$programcommissionPending" },
          userNameWithID: { userName: { $concat: ["$firstName", " ", "$lastName"] }, userId: "$_id", userStatus: "$userStatus" },
          userStatusWithID: { userStatus: "$userStatus", userId: "$_id", emailAddress: "$emailAddress" }
        }
      },
      { $match: query },
    ];

    const userCount = (await affiliate.aggregate(fetchQuery)).length;
    const userList = await affiliate.aggregate(fetchQuery).sort({ companyName: 1 }).skip(post.initialValue).limit(post.finalValue);
    let successResponse = genericResponse(true, "template fetched successfully,", {
      count: userCount,
      list: userList
    });
    res.status(201).json(successResponse);
  } catch (error) {
    console.log("Catch in fetchStandardFeatures: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const fetchAPUserById = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    console.log(post)
    var query = { _id: mongoose.Types.ObjectId(post._id) }
    const fetchUser = await affiliate.findById(query);
    let successResponse = genericResponse(true, "fetch successfully", fetchUser);
    res.status(200).json(successResponse);
  } catch {
    console.log("failed to add template ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const apForgotPassword = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { userStatus: 'Approved', emailAddress: post.emailAddress };
    const users = await affiliate.find(query)
    console.log(users)
    if (users.length > 0) {
      const password = await generatePassword();
      await encryptPassword(password).then(data => {
        post.userPassword = data;
      }).catch((error) => {
        console.log("Password encryption error:", error);
        return;
      });
      // post.userPassword = password;
      post.firstTimeUser = 1;
      post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      post.recordType = "U"
      const query = { _id: mongoose.Types.ObjectId(users[0]._id) };
      var newValues = { $set: post }
      const updateUser = await affiliate.updateOne(query, newValues);
      // const emailTemplate = '<p>Hello!' +
      //   '<br/><br/>We received a request to reset the password.' +
      //   '<br/><br/>Please find below the URL & login credentials with new temporary password.' +
      //   '<table style={{ border: "1px solid black", borderCollapse: "collapse"}}>' +
      //   '<tbody>' +
      //   '<tr>' +
      //   '<td style={{border:"1px solid black"}}><b>URL</b></td>' +
      //   '<td style={{border:"1px solid black"}}>' + post.loginURL + '</td>' +
      //   '</tr>' +
      //   '<tr>' +
      //   '<td style={{border:"1px solid black"}}><b>User Name</b></td>' +
      //   '<td style={{border:"1px solid black"}}>' + post.emailAddress + '</td>' +
      //   '</tr>' +
      //   '<tr>' +
      //   '<td style={{border:"1px solid black"}}><b>Password</b></td>' +
      //   '<td style={{border:"1px solid black"}}>' + password + '</td>' +
      //   '</tr>' +
      //   '</tbody>' +
      //   '</table>' +
      //   '<br/><br/>Sincerely,' +
      //   '<br/><br/>Team ReviewArm' +
      //   '</p>';

      const templateQuery = { templateStatus: 'Active', templateName: 'ForgotPasswordEmailNotification' };
      const fetchedTemplates = await Templates.find(templateQuery);
      if (fetchedTemplates.length > 0) {
        let emailSubject = '';
        let emailBody = '';
        let val = fetchedTemplates[0];
        val.templateSubject = val.templateSubject.replaceAll('[FirstName]', users[0].firstName);
        val.templateSubject = val.templateSubject.replaceAll('[LastName]', users[0].lastName);
        emailSubject = val.templateSubject;

        val.templateMessage = val.templateMessage.replaceAll('[FirstName]', users[0].firstName);
        val.templateMessage = val.templateMessage.replaceAll('[LastName]', users[0].lastName);
        val.templateMessage = val.templateMessage.replaceAll('[Password]', password);
        emailBody = val.templateMessage;
        sendMailBySendGrid(post.emailAddress, emailSubject, emailBody);
      }

      let successResponse = genericResponse(true, "User fetched successfully.", users);
      res.status(200).json(successResponse);
    }
    else {
      let successResponse = genericResponse(false, "User not found.", []);
      res.status(200).json(successResponse);
    }
  } catch (error) {
    console.log("error in forgotPassword=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const addAffiliateUser = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    var query = { phoneNumber: post.phoneNumber };
    if (post.phoneNumber != "" && post.phoneNumber != undefined) {
      var checkIfPhoneNumberAlredyExist = await affiliate.find(query);
      checkIfEmailAlredyExist = await affiliate.find(query)

      console.log("gg", checkIfPhoneNumberAlredyExist)
      // checkIfPhoneNumberAlredyExist = await affiliate.find(query);
      if (checkIfPhoneNumberAlredyExist.length > 0) {
        let errorRespnse = genericResponse(false, "Phone Number Already Exist.", []);
        res.status(200).json(errorRespnse);
        return;
      }
    }
    var query2 = { referralCode: post.referralCode };
    var checkIfEmailAlredyExist = await affiliate.find(query2);
    checkIfEmailAlredyExist = await affiliate.find(query2);
    if (checkIfEmailAlredyExist.length > 0) {
      let errorRespnse = genericResponse(false, "Prefered Referal Code Already Exist", []);
      res.status(200).json(errorRespnse);
      return;
    }
    var query1 = { emailAddress: post.emailAddress };
    var checkIfEmailAlredyExist = await affiliate.find(query1);
    checkIfEmailAlredyExist = await affiliate.find(query1);
    if (checkIfEmailAlredyExist.length > 0) {
      let errorRespnse = genericResponse(false, "Email Already Exist.", []);
      res.status(200).json(errorRespnse);
      return;
    }
    const password = await generatePassword();
    await encryptPassword(password).then(data => {
      post.userPassword = data;
    })
      .catch((error) => {
        console.log("Password encryption error:", error);
        return;
      });
    let value = ""
    // if (post.commisionPercentage != "" && post.commisionPercentage != undefined) {
    //   value = post.commisionPercentage
    // }
    // if (post.commissionAmount != "" && post.commissionAmount != undefined) {

    //   value = post.commissionAmount
    // }

    if (post.commisionPercentage != "" && post.commisionPercentage != undefined) {
      value = "(" + post.commisionPercentage + "%)";
    }
    if (post.commissionAmount != "" && post.commissionAmount != undefined) {
      value = "($ " + post.commissionAmount + ")";
    }

    // const emailTemplate = '<p>Hello!' +
    //   '<br/><br/We appreciate your interest in working with us. Your Affiliate Program User profile is created. We are happy to have you join our community' +
    //   '<br/><br/>Please find below the User, temporary Password & Commission details: ' +
    //   '<table style={{ border: "1px solid black", borderCollapse: "collapse"}}>' +
    //   '<tbody>' +
    //   '<tr>' +
    //   '<td style={{border:"1px solid black"}}><b>URL</b></td>' +
    //   '<td style={{border:"1px solid black"}}>' + post.apLoginURL + '</td>' +
    //   '</tr>' +
    //   '<tr>' +
    //   '<td style={{border:"1px solid black"}}><b>User Name</b></td>' +
    //   '<td style={{border:"1px solid black"}}>' + post.emailAddress + '</td>' +
    //   '</tr>' +
    //   '<tr>' +
    //   '<td style={{border:"1px solid black"}}><b>Preferred Referral Code</b></td>' +
    //   '<td style={{border:"1px solid black"}}>' + post.referralCode + '</td>' +
    //   '</tr>' +
    //   '<tr>' +
    //   '<td style={{border:"1px solid black"}}><b>Temporary Password</b></td>' +
    //   '<td style={{border:"1px solid black"}}>' + password + '</td>' +
    //   '</tr>' +
    //   '<tr>' +
    //   '<td style={{border:"1px solid black"}}><b>Commission Rate</b></td>' +
    //   '<td style={{border:"1px solid black"}}>' + post.commissionType + ' ' + value + '</td>' +
    //   '</tr>' +
    //   '<tr>' +
    //   '<td style={{border:"1px solid black"}}><b>Commission Period</b></td>' +
    //   '<td style={{border:"1px solid black"}}>' + post.commissionPeriod + '</td>' +
    //   '</tr>' +
    //   '</tbody>' +
    //   '</table>' +
    //   '<br/><br/> Looking forward to discussing further.' +
    //   '<br/><br/>Sincerely,' +
    //   '<br/><br/>Team ReviewArm' +
    //   '</p>';

    const templateQuery = { templateStatus: 'Active', templateName: 'NewAffiliateProgramUserEmailNotification' };
    const fetchedTemplates = await Templates.find(templateQuery);
    if (fetchedTemplates.length > 0) {
      let emailSubject = '';
      let emailBody = '';
      let val = fetchedTemplates[0];
      emailSubject = val.templateSubject;
      val.templateMessage = val.templateMessage.replaceAll('[URL]', post.apLoginURL);
      val.templateMessage = val.templateMessage.replaceAll('[EmailAddress]', post.emailAddress);
      val.templateMessage = val.templateMessage.replaceAll('[PreferredReferralCode]', post.referralCode);
      val.templateMessage = val.templateMessage.replaceAll('[TemporaryPassword]', password);
      val.templateMessage = val.templateMessage.replaceAll('[CommissionType]', post.commissionType);
      val.templateMessage = val.templateMessage.replaceAll('[CommissionTypeValue]', value);
      val.templateMessage = val.templateMessage.replaceAll('[CommissionPeriod]', post.commissionPeriod);
      emailBody = val.templateMessage;
      await sendMailBySendGrid(post.emailAddress, emailSubject, emailBody);
    }

    if (post.userStatus == "Approved") {
      post.activationDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      post.firstTimeUser = 1;
      let addActivation = new affiliate(post);
      const respo = await addActivation.save();
      let successResponse = genericResponse(true, "Updated successfully", []);
      res.status(200).json(successResponse);
    } else {
      post.firstTimeUser = 1;
      let add = new affiliate(post)
      const respo = await add.save()
      let successResponse = genericResponse(true, "User Added successfully", []);
      res.status(200).json(successResponse);
    }

  } catch (error) {
    console.log("Catch in sendOTP: ", error);
    res.status(400).json(genericResponse(false, error.message, []));
  }

});

const fetchCommissionTransactionById = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    console.log(post)
    let query = {}
    var Date1 = new Date();
    var currentDate = new Date(Date1.setUTCHours(0, 0, 0, 0));
    var tommorrowDate = new Date(Date1.setUTCHours(0, 0, 0, 0));
    var searchDate;

    query = { apUserID: mongoose.Types.ObjectId(post.apUserID), commissionStatus: { $exists: true }, createdDate: { $exists: true }, transactionDate: { $exists: true } }
    if (post.commissionStatus != "" && post.commissionStatus != undefined) {
      query.commissionStatus = post.commissionStatus
    }
    // var findquery = { referralCode: (fetchcode[0].referralCode) , createdDate: { $exists: true },}


    if (post.duration === "last30Days") {
      tommorrowDate.setDate(tommorrowDate.getDate() - 30);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration === "last60Days") {
      tommorrowDate.setDate(tommorrowDate.getDate() - 60);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration === "last90Days") {
      tommorrowDate.setDate(tommorrowDate.getDate() - 90);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration === "last6Months") {
      tommorrowDate.setMonth(tommorrowDate.getMonth() - 6);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration === "last1Year") {
      tommorrowDate.setFullYear(tommorrowDate.getFullYear() - 1);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration !== undefined && post.duration !== '') {
      if (post.commissionStatus === "Paid") {
        query.transactionDate = searchDate
      } else {
        query.createdDate = searchDate;
      }
      // query.createdDate = searchDate;
    }

    // const flag = { paymentFlag: 0 }

    // await commissionTransaction.updateMany(query, flag)

    let fetch = [
      { $match: query },

      {

        $lookup: {
          from: "business_users",
          localField: "businessUserID",
          foreignField: "_id",
          as: "businessUser",
        }

      },
      { $unwind: "$businessUser" },
      {
        $lookup: {
          from: "commission_payments",
          localField: "commissionPaymentID",
          foreignField: "_id",
          as: "commissionPayment",
        }
      },
      // { $unwind: "$commissionPayment" },
      {
        $project: {
          _id: "$apUserID",
          commissionDate: "$createdDate",
          transactionDate: "$transactionDate",
          userName: { $concat: ["$businessUser.firstName", " ", "$businessUser.lastName"] },
          commissionDescription: "$commissionDescription",
          subscriptionAmount: "$subscriptionAmount",
          commissionPercentage: "$commissionPercentage",
          commissionLumpsum: "$commissionLumpsum",
          commissionAmount: "$commissionAmount",
          commissionStatus: "$commissionStatus",
          approvalRejectionDate: "$approvalRejectionDate",
          paymentMode: "$commissionPayment.paymentMode",
          paymentDate: "$commissionPayment.paymentDate",
          paymentTransactionId: "$commissionPayment.paymentTransactionID",
          approvedWithPaymentDate: {
            commissionStatus: "$commissionStatus",
            // approvedDate: "$approvalRejectionDate", 
            approvedDate: {
              $concat: [
                {
                  $let: {
                    vars: {
                      monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                    },
                    in: {
                      $arrayElemAt: ['$$monthsInString', { $month: "$approvalRejectionDate" }]
                    }
                  }
                },
                { $dateToString: { format: "%d", date: "$approvalRejectionDate" } }, ", ",
                { $dateToString: { format: "%Y", date: "$approvalRejectionDate" } },
              ]
            },
            paymentDate: "$commissionPayment.paymentDate",
          },

          data: {
            commissionDate: "$createdDate",
            transactionDate: "$transactionDate",
            userName: { $concat: ["$businessUser.firstName", " ", "$businessUser.lastName"] },
            commissionDescription: "$commissionDescription",
            subscriptionAmount: "$subscriptionAmount",
            commissionPercentage: "$commissionPercentage",
            commissionLumpsum: "$commissionLumpsum",
            commissionAmount: "$commissionAmount",
            commissionStatus: "$commissionStatus",
            approvalRejectionDate: "$approvalRejectionDate",
            paymentMode: "$commissionPayment.paymentMode",
            paymentDate: "$commissionPayment.paymentDate",
            paymentTransactionId: "$commissionPayment.paymentTransactionID",

          }

        }
      },



    ]


    const fetchUserCount = await commissionTransaction.aggregate(fetch);
    console.log("asdbgjgh", fetchUserCount.length)
    const fetchUser = await commissionTransaction.aggregate(fetch).sort({ userName: 1 }).skip(post.initialValue).limit(post.finalValue);
    let successResponse = genericResponse(true, "fetch successfully", {
      count: fetchUserCount.length,
      list: fetchUser
    });
    res.status(200).json(successResponse);
    // let successResponse = genericResponse(false, "gshasg", fetchUser);
    // res.status(200).json(successResponse);



  } catch (error) {
    console.log("failed to add template ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);

  }

});

const updateCommission = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    let add = new commissionPayment(post)
    const dd = await add.save()


    // const fetchUser = await commissionTransaction.find()
    let successResponse = genericResponse(true, "fetch successfully", add);
    res.status(200).json(successResponse);



  } catch {
    console.log("failed to add template ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);

  }

});

const apUpdateCommissionStatus = asyncHandler(async (req, res) => {

  const post = req.body;
  console.log({ post });
  try {
    let approvedPaymentList = post.selectedCheckedValues;
    console.log("dsgsdjgisj", approvedPaymentList);


    if (approvedPaymentList.length > 0) {
      for (let i = 0; i < approvedPaymentList.length; i++) {
        console.log("shdjghfgs")
        // post.paymentFlag = 1
        // console.log(post._id[])
        let query = { _id: mongoose.Types.ObjectId(approvedPaymentList[i]._id) }

        if (post.commissionStatus == "Approved") {
          const flag = { paymentFlag: 1 }
          await commissionTransaction.updateOne(query, flag)
        } else {
          const flag = { commissionStatus: "Approved" }
          await commissionTransaction.updateOne(query, flag)
        }

      }
      let successResponse = genericResponse(true, "Updated successfully", []);
      res.status(200).json(successResponse);
      return;

      // console.log("sadfghfchj")
    }


  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }

});


const fetchUpdatePayment = asyncHandler(async (req, res) => {

  const post = req.body;
  console.log({ post });
  let date = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
  try {
    var query = { paymentFlag: 1 }
    const ff = await commissionTransaction.aggregate([

      { $match: query },



      {
        $group: {
          _id: {
            apUserID: '$apUserID',

            paymentDate: date
          },
          paymentAmount: {

            $sum: "$commissionAmount"
          },


        }

      },
      {
        $project: {
          _id: 0,
          apUserID: "$_id.apUserID",
          paymentAmount: "$paymentAmount",
          paymentDate: "$_id.paymentDate"
        }


      }



    ])
    console.log(ff)

    let successResponse = genericResponse(true, "fetch successfully", ff);
    res.status(200).json(successResponse);






  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }

});


const addUpdateAPBankDetails = asyncHandler(async (req, res) => {

  const post = req.body;
  console.log({ post });
  try {
    var query = { _id: mongoose.Types.ObjectId(post.apUserID) }

    const fetchBankDetails = await affiliate.findById(query, {
      bankName: 1,
      accountHolderName: 1,
      bankCode: 1,
      accountType: 1,
      accountNumber: 1,
      branchAddress: 1

    })

    if (fetchBankDetails.accountNumber != "" && fetchBankDetails.accountNumber != undefined) {

      let newValues = { $set: post }
      const addBankDetail = await affiliate.updateOne(query, newValues)
      let successResponse = genericResponse(true, "Updated successfully", addBankDetail);
      res.status(200).json(successResponse);
      return;

    } else {
      let newValues = { $set: post }
      const addBankDetail = await affiliate.updateOne(query, newValues)
      let successResponse = genericResponse(true, "Added successfully", addBankDetail);
      res.status(200).json(successResponse);

    }



  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }

});

const fetchAPBankDetails = asyncHandler(async (req, res) => {

  const post = req.body;
  console.log({ post });
  try {
    var query = { _id: mongoose.Types.ObjectId(post.apUserID) }
    const fetchBankDetails = await affiliate.findById(query, {
      bankName: 1,
      accountHolderName: 1,
      bankCode: 1,
      accountType: 1,
      accountNumber: 1,
      branchAddress: 1

    })
    // console.log("jsjhsdfoia", fetchAPBankDetails)


    if (fetchBankDetails.accountNumber != "" && fetchBankDetails.accountNumber != undefined) {
      let successResponse = genericResponse(true, "fetch successfully", fetchBankDetails);
      res.status(200).json(successResponse);
      return;


    }

    let successResponse = genericResponse(false, "N0 data", []);
    res.status(200).json(successResponse);


  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }

});

const viewAPBankDetails = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    var query = { _id: mongoose.Types.ObjectId(post.apUserID) }
    const fetchBankDetails = await affiliate.findById(query, {
      bankName: 1, accountHolderName: 1, bankCode: 1, accountType: 1, accountNumber: 1, branchAddress: 1
    })

    if (fetchBankDetails && fetchBankDetails.accountNumber != "" && fetchBankDetails.accountNumber != undefined) {
      let successResponse = genericResponse(true, "fetch successfully", fetchBankDetails);
      res.status(200).json(successResponse);
      return;
    }

    let successResponse = genericResponse(false, "N0 data", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});


const fetchAPReferedUser = asyncHandler(async (req, res) => {

  const post = req.body;
  console.log({ post });
  try {


    var Date1 = new Date();
    var currentDate = new Date(Date1.setUTCHours(0, 0, 0, 0));
    var tommorrowDate = new Date(Date1.setUTCHours(0, 0, 0, 0));
    var searchDate;

    var findquery = { apUserID: mongoose.Types.ObjectId(post.apUserID), createdDate: { $exists: true }, }

    if (post.duration === "last30Days") {
      tommorrowDate.setDate(tommorrowDate.getDate() - 30);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration === "last60Days") {
      tommorrowDate.setDate(tommorrowDate.getDate() - 60);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration === "last90Days") {
      tommorrowDate.setDate(tommorrowDate.getDate() - 90);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration === "last6Months") {
      tommorrowDate.setMonth(tommorrowDate.getMonth() - 6);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration === "last1Year") {
      tommorrowDate.setFullYear(tommorrowDate.getFullYear() - 1);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration !== undefined && post.duration !== '') {
      findquery.createdDate = searchDate;
    }


    console.log("fsdhhi", findquery)





    const users = [

      { $match: findquery },



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
          from: "subscription_plans",
          localField: "businessUserPlans.planID",
          foreignField: "_id",
          as: "subscriptionPlans",
        }
      },
      { $unwind: "$subscriptionPlans" },


      {
        $project: {

          companyName: 1, phoneNumber: 1, emailAddress: 1, companyStreetAddress: 1, companyCity: 1, companyZipCode: 1,
          // companyState: "$states.stateName", companyCountry: "$country.countryName", 
          planNameWithTrialUser: { planName: "$subscriptionPlans.planName", trialUser: "$trialUser" }, companyEmailAddress: 1,
          // planActivationDate: "$businessUserPlans.planActivationDate", 

          planActivationDate: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planActivationDate' } },
          planExpiryDate: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planExpiryDate' } },
          companyNameWithID: { clientName: { $concat: ["$firstName", " ", "$lastName"] }, businessUserID: "$_id" }, businessUserStatus: 1,
        }
      },



    ]


    const referusers = await BusinessUsers.aggregate(users).sort({ userName: 1 }).skip(post.initialValue).limit(post.finalValue);
    const referusersCount = await (await BusinessUsers.aggregate(users)).length
    let successResponse = genericResponse(true, "Clients fetched successfully.", {
      count: referusersCount,
      list: referusers
    });
    res.status(201).json(successResponse);






  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }

});


const fetchAPUserProfile = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post._id) }
    const fetchUserProfile = await affiliate.findById(query, {
      firstName: 1, lastName: 1, emailAddress: 1, phoneNumber: 1, profilePictureFileName: 1,
      // userPassword: 1, 
    });
    let successResponse = genericResponse(true, "User Profile fetched successfully.", fetchUserProfile);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in  fetch User Profile =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateAPUserProfile = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post._id) }
    if (post.confirmPassword) {
      post.userPassword = post.confirmPassword;
      await encryptPassword(post.userPassword).then(data => {
        post.userPassword = data;
      })
        .catch((error) => {
          console.log("Password encryption error:", error);
          return;
        });
    }


    if (req.files) {
      let returnedFileName = await uploadImageFile(req, "profilePictureFileName");
      post.profilePictureFileName = returnedFileName;
    }
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "U";
    var newValues = { $set: post };
    await affiliate.updateOne(query, newValues);
    let successResponse = genericResponse(true, "User Profile updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in  update User Profile =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});


const resetApPassword = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { emailAddress: post.emailAddress };
    const fetchUserByEmail = await affiliate.find(query);

    await encryptPassword(post.password).then(data => {
      post.encryptedPassword = data;
    }).catch((error) => {
      console.log("Password encryption error:", error);
      return;
    });

    if (fetchUserByEmail[0].userPassword == post.encryptedPassword) {
      let successResponse = genericResponse(false, "Temporary Password can't be set as New Password!", []);
      res.status(200).json(successResponse);
    }
    else {
      post.userPassword = post.encryptedPassword;
      post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      post.recordType = "U";
      post.firstTimeUser = 0;
      var newValues = { $set: post };
      await affiliate.updateOne(query, newValues);
      let successResponse = genericResponse(true, "User Password Changed successfully.", []);
      res.status(200).json(successResponse);
    }
  }
  catch (error) {
    console.log("error in Update Password=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const fetchAPDashboardData = asyncHandler(async (req, res) => {

  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post.apUserID) }

    var fetchQuery = await affiliate.aggregate([

      { $match: query },
      {
        $lookup: {
          from: "program_commissions",
          localField: "_id",
          foreignField: "apUserID",
          as: "programcommission",
        }
      },
      {
        $lookup: {
          from: "program_commissions",
          localField: "_id",
          foreignField: "apUserID",
          pipeline: [
            {
              $match: {
                commissionStatus: "Pending"

              }
            }
          ],
          as: "programcommissionPending",
        },
      },
      {
        $lookup: {
          from: "program_commissions",
          localField: "_id",
          foreignField: "apUserID",
          pipeline: [
            {
              $match: {
                commissionStatus: "Paid"
              }
            }
          ],
          as: "programcommissionPaid",
        }
      },
      {
        $lookup: {
          from: "business_users",
          localField: "referralCode",
          foreignField: "referralCode",
          as: "businessUserPlans",
        }
      },
      // {$unwind:"$businessUserPlans"},
      {
        $project: {

          userName: { $concat: ["$firstName", " ", "$lastName"] },
          firstName: "$firstName",
          lastName: "$lastName",
          companyName: "$companyName",
          activationDate: { $dateToString: { format: '%Y-%m-%d', date: '$activationDate' } },
          createdDate: { $dateToString: { format: '%Y-%m-%d', date: '$createdDate' } },
          userStatus: "$userStatus",
          commissionType: "$commissionType",
          commissionAmount: "$commissionAmount",
          commissionLumpsum: "$commissionLumpsum",
          commisionPercentage: "$commisionPercentage",
          referralCount: {
            $size: "$businessUserPlans"
          },
          commissionPaid: { $sum: "$programcommissionPaid.commissionAmount" },
          commissionPending: { $sum: "$programcommissionPending.commissionAmount" },
          // commission:"$programcommission.commissionStatus",
          // commissionPaid: { $size: { $filter: { input: "$programcommission.commissionStatus", as: "programcommission", cond: { $eq: ["$$programcommission", "Paid"] } } } },
          // commissionPending: { $size: { $filter: { input: "$programcommission.commissionStatus", as: "programcommission", cond: { $eq: ["$$programcommission", "Pending"] } } } },
          userNameWithID: { userName: { $concat: ["$firstName", " ", "$lastName"] }, userId: "$_id", userStatus: "$userStatus" },
          userStatusWithID: { userStatus: "$userStatus", userId: "$_id" },
          profilePictureFileName: "$profilePictureFileName"
        }
      },
    ])

    let successResponse = genericResponse(true, "template fetched successfully,", fetchQuery)
    res.status(201).json(successResponse);

  } catch (error) {
    console.log("Catch in fetchStandardFeatures: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }



});


const fetchCommissionTransaction = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    console.log(post)
    var query = { commissionStatus: (post.commissionStatus), apUserName: { $exists: true } }

    if (post.apUserName != "" && post.apUserName != undefined) {
      if (post.apUserName === "All") {

      } else {

        query.apUserName = post.apUserName
      }


    }
    // const flag = {paymentFlag :0}
    // await commissionTransaction.updateMany(query,flag)

    if (post.searchParameter != undefined && post.searchParameter != '')
      query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);

    const respo = await commissionTransaction.find(query)
    console.log(respo)
    const fetchUser = await commissionTransaction.aggregate([
      {

        $lookup: {
          from: "affiliate_program_users",
          localField: "apUserID",
          foreignField: "_id",
          as: "apUser",
        }

      },
      { $unwind: "$apUser" },

      {

        $lookup: {
          from: "business_users",
          localField: "businessUserID",
          foreignField: "_id",
          as: "businessUser",
        }

      },
      { $unwind: "$businessUser" },
      {

        $lookup: {
          from: "commission_payments",
          localField: "commissionPaymentID",
          foreignField: "_id",
          as: "commissionPayment",
        }

      },
      // { $unwind: "$commissionPayment" },

      {
        $project: {
          _id: "$_id",
          apUserId: "$apUserID",
          commissionDate: '$createdDate',
          transactionDate: "$transactionDate",
          apUserName: { $concat: ["$apUser.firstName", " ", "$apUser.lastName"] },
          clientName: { $concat: ["$businessUser.firstName", " ", "$businessUser.lastName"] },
          apCompanyName: "$apUser.companyName",
          commissionDescription: "$commissionDescription",
          subscriptionAmount: "$subscriptionAmount",
          commissionPercentage: "$commissionPercentage",
          commissionLumpsum: "$commissionLumpsum",
          commissionAmount: "$commissionAmount",
          commissionStatus: "$commissionStatus",
          approvalRejectionDate: "$approvalRejectionDate",
          paymentMode: "$commissionPayment.paymentMode",
          paymentDate: "$commissionPayment.paymentDate",
          paymentTransactionId: "$commissionPayment.paymentTransactionID",

          data: {
            apUserId: "$apUserID",
            commissionDate: '$createdDate',
            transactionDate: "$transactionDate",
            apUserName: { $concat: ["$apUser.firstName", "$apUser.lastName"] },
            clientName: { $concat: ["$businessUser.firstName", "$businessUser.lastName"] },
            apCompanyName: "$apUser.companyName",
            commissionDescription: "$commissionDescription",
            subscriptionAmount: "$subscriptionAmount",
            commissionPercentage: "$commissionPercentage",
            commissionLumpsum: "$commissionLumpsum",
            commissionAmount: "$commissionAmount",
            commissionStatus: "$commissionStatus",
            approvalRejectionDate: "$approvalRejectionDate",
            paymentMode: "$commissionPayment.paymentMode",
            paymentDate: "$commissionPayment.paymentDate",
            paymentTransactionId: "$commissionPayment.paymentTransactionID"
          }

        }
      },
      { $match: query }
    ])
    // .sort({ userName: 1 }).skip(post.initialValue).limit(post.finalValue);

    let successResponse = genericResponse(true, "fetch successfully", {
      count: fetchUser.length,
      list: fetchUser
    });
    res.status(200).json(successResponse);
    //  console.log("gsadghfds",trp)
    //  let successResponse = genericResponse(true, "User Profile fetched successfully.", trp);
    //  res.status(200).json(successResponse);


    // await commissionTransaction.updateMany(query)

    // const fetchUser = await commissionTransaction.aggregate([
    //   { $match: query },

    //   {

    //     $lookup: {
    //       from: "business_users",
    //       localField: "businessUserID",
    //       foreignField: "_id",
    //       as: "businessUser",
    //     }

    //   },
    //   { $unwind: "$businessUser" },
    //   {

    //     $lookup: {
    //       from: "commission_payments",
    //       localField: "commissionPaymentID",
    //       foreignField: "_id",
    //       as: "commissionPayment",
    //     }

    //   },
    //   // { $unwind: "$commissionPayment" },

    //   // {
    //   //   $project: {
    //   //     _id:"$apUserID",
    //   //     transactionDate: "$transactionDate",
    //   //     userName: { $concat: ["$businessUser.firstName", "$businessUser.lastName"] },
    //   //     commissionDescription: "$commissionDescription",
    //   //     subscriptionAmount: "$subscriptionAmount",
    //   //     commissionPercentage: "$commissionPercentage",
    //   //     commissionLumpsum: "$commissionLumpsum",
    //   //     commissionAmount: "$commissionAmount",
    //   //     commissionStatus: "$commissionStatus",
    //   //     approvalRejectionDate: "$approvalRejectionDate",
    //   //     paymentMode: "$commissionPayment.paymentMode",
    //   //     paymentDate: "$commissionPayment.paymentDate",
    //   //     paymentTransactionId:"$commissionPayment.paymentTransactionID"

    //   //   }
    //   // }
    // ]).sort({ userName: 1 }).skip(post.initialValue).limit(post.finalValue);
    // let successResponse = genericResponse(true, "fetch successfully", {
    //   count: fetchUser.length,
    //   list: fetchUser
    // });
    // res.status(200).json(successResponse);
    // // let successResponse = genericResponse(false, "gshasg", fetchUser);
    // // res.status(200).json(successResponse);



  } catch {
    console.log("failed to add template ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);

  }

});



const apUpdatePayment = asyncHandler(async (req, res) => {


  try {
    const post = req.body;
    console.log({ post });


    let approvedPaymentList = post.selectedCheckedValues;
    console.log("dsgsdjgisj", approvedPaymentList);
    if (approvedPaymentList.length > 0) {
      for (let i = 0; i < approvedPaymentList.length; i++) {
        console.log("shdjghfgs")
        // post.paymentFlag = 1
        // console.log(post._id[])
        let query = { _id: mongoose.Types.ObjectId(approvedPaymentList[i]._id) }


        const flag = { commissionStatus: "Approved" }
        await commissionTransaction.updateOne(query, flag)


      }
      let successResponse = genericResponse(true, "Updated successfully", []);
      res.status(200).json(successResponse);
      return;

      // console.log("sadfghfchj")
    }


  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }

});

const apMakePayment = asyncHandler(async (req, res) => {


  try {
    const post = req.body;
    console.log({ post });
    let payment = new commissionPayment(post)
    const paymentinfo = await payment.save()
    console.log(paymentinfo)


    let approvedPaymentList = post.selectedCheckedValues;
    console.log("dsgsdjgisj", approvedPaymentList);
    if (approvedPaymentList.length > 0) {
      for (let i = 0; i < approvedPaymentList.length; i++) {
        console.log("shdjghfgs")
        // post.paymentFlag = 1
        // console.log(post._id[])
        let query = { _id: mongoose.Types.ObjectId(approvedPaymentList[i]._id) }


        post.commissionStatus = "Paid"
        post.commissionPaymentID = paymentinfo._id
        post.transactionDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        let newValues = { $set: post }
        await commissionTransaction.updateOne(query, newValues)


      }
      let successResponse = genericResponse(true, "Updated successfully", []);
      res.status(200).json(successResponse);
      return;

      // console.log("sadfghfchj")
    }
    let successResponse = genericResponse(false, "No Record Selected", []);
    res.status(200).json(successResponse);

  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }

});


const updatePaymentTransaction = asyncHandler(async (req, res) => {

  try {
    const post = req.body;
    console.log({ post });
    var query = { paymentFlag: 1 }

    const ff = await commissionTransaction.find(query)
    console.log(ff)
    let paymentlist = ff
    let payment = new commissionPayment(post)
    const paymentinfo = await payment.save()
    console.log(paymentinfo)

    if (paymentinfo !== "" && paymentinfo !== undefined) {

      for (let i = 0; i < paymentlist.length; i++) {
        let query1 = { _id: mongoose.Types.ObjectId(paymentlist[i]._id) }
        console.log("fgghghsg")
        post.commissionStatus = "Paid"
        post.commissionPaymentID = paymentinfo._id
        post.paymentFlag = 0
        post.transactionDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        let newValues = { $set: post }
        await commissionTransaction.updateOne(query1, newValues)


      }
      let successResponse = genericResponse(true, "fetch successfully", payment);
      res.status(200).json(successResponse);


    }



  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }

});



const fetchAprovePendingCommision = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    let fetchCommission = await commissionTransaction.find();
    let successResponse = genericResponse(true, "fetch successfully", fetchCommission);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});


const activeInactiveApUser = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log(post);
    var query1 = { _id: mongoose.Types.ObjectId(post.apUserID) }

    if (post.userStatus === "Approved") {
      const approve = { userStatus: "Approved" }
      const update = await affiliate.updateOne(query1, approve);
      const templateQuery = { templateStatus: 'Active', templateName: 'AffiliateProgramUserActivationEmailNotification' };
      const fetchedTemplates = await Templates.find(templateQuery);
      if (fetchedTemplates.length > 0) {
        let emailSubject = '';
        let emailBody = '';
        let val = fetchedTemplates[0];
        emailSubject = val.templateSubject;
        val.templateMessage = val.templateMessage.replaceAll('[EmailAddress]', post.emailAddress);
        // val.templateMessage = val.templateMessage.replaceAll('[RejectionReason]', post.rejectionNotes);
        emailBody = val.templateMessage;
        console.log("herer::");
        await sendMailBySendGrid(post.emailAddress, emailSubject, emailBody);
      }

      let successResponse = genericResponse(true, "Activated successfully", update);
      res.status(200).json(successResponse);
      return;
    } else {
      var query = { apUserID: (post.apUserID), commissionStatus: "Pending" }
      const fetchCommission = await commissionTransaction.find(query)
      if (fetchCommission.length > 0) {
        let successResponse = genericResponse(false, "The Commission Transaction(s) are pending for Approval for this User ! ", []);
        res.status(200).json(successResponse);
        return;
      }

      const status = { userStatus: "Inactive" };
      const update = await affiliate.updateOne(query1, status);

      const templateQuery = { templateStatus: 'Active', templateName: 'AffiliateProgramUserDeactivationEmailNotification' };
      const fetchedTemplates = await Templates.find(templateQuery);
      if (fetchedTemplates.length > 0) {
        let emailSubject = '';
        let emailBody = '';
        let val = fetchedTemplates[0];
        emailSubject = val.templateSubject;
        val.templateMessage = val.templateMessage.replaceAll('[EmailAddress]', post.emailAddress);
        // val.templateMessage = val.templateMessage.replaceAll('[RejectionReason]', post.rejectionNotes);
        emailBody = val.templateMessage;
        await sendMailBySendGrid(post.emailAddress, emailSubject, emailBody);
      }

      let successResponse = genericResponse(true, "Deactivated successfully", update);
      res.status(200).json(successResponse);
    }
  } catch (error) {
    console.log("Catch in activeInactiveApUser :: ", error);
  }
});



export {
  apSignup, updateAPDetails, apValidateOtp, apResendOTP, authenticateAPUser, fetchAPUsers, fetchAPUserById, apForgotPassword,
  addAffiliateUser, fetchCommissionTransactionById, updateCommission, apUpdateCommissionStatus, fetchUpdatePayment,
  addUpdateAPBankDetails, fetchAPReferedUser, fetchAPUserProfile, updateAPUserProfile, fetchAPBankDetails, resetApPassword,
  fetchAPDashboardData, fetchAprovePendingCommision, fetchCommissionTransaction, apMakePayment, activeInactiveApUser,
  apUpdatePayment, updatePaymentTransaction, viewAPBankDetails
}