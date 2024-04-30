import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import BusinessUsers from '../models/businessUsersModel.js';
import { sendMail, sendMailBySendGrid, uploadImageFile } from '../routes/genericMethods.js';
import countryStates from '../models/countryStatesModel.js';
import country from '../models/countryModel.js';
import ReviewRequest from '../models/reviewRequestsModel.js';
import businessLocation from '../models/businessLocationModel.js';
import businessUserNotification from '../models/businessUserNotificationsModel.js';
import Users from '../models/UsersModel.js';

const fetchGeneralSetting = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchData = await BusinessUsers.findOne(query);
    let successResponse = genericResponse(true, "fetch setting", fetchData);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchGeneralSetting  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateGeneralSetting = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: post.id }
    if (req.files) {
      let returnedFileName = await uploadImageFile(req, "logoPictureFileName");
      post.companyLogoFileName = returnedFileName;
    }
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "U";
    var newValues = { $set: post };
    await BusinessUsers.updateOne(query, newValues);
    let successResponse = genericResponse(true, "General Setting updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch updateGeneralSetting =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateSmsTemplate = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: post.id };
    // if (req.files) {
    //   let returnedFileName = await uploadImageFile(req, "logoPictureFileName");
    //   post.companyLogoFileName = returnedFileName;
    // }
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "U";
    var newValues = { $set: post };
    await BusinessUsers.updateOne(query, newValues);
    let successResponse = genericResponse(true, "SMS template updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch updateSmsTemplate=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchSmsTemplate = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchData = await BusinessUsers.findOne(query);
    let successResponse = genericResponse(true, "SMS template fetched successfully.", fetchData);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchSmsTemplate  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateEmailTemplate = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: post.id };
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "U";
    var newValues = { $set: post };
    await BusinessUsers.updateOne(query, newValues);
    let successResponse = genericResponse(true, "Email template updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch updateEmailTemplate=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchEmailTemplate = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchData = await BusinessUsers.findOne(query);
    const fetchedBusinessLocation = await businessLocation.findOne({ businessUserID: post.id, _id: post.businessLocationID });
    const fetchState = await countryStates.findOne({ _id: fetchedBusinessLocation.stateId });
    const fetchCountry = await country.findOne({ _id: fetchedBusinessLocation.countryId });
    let successResponse = genericResponse(true, "Email template fetched successfully.", fetchData);
    successResponse.companyStateName = '';
    successResponse.companyCountryName = '';
    successResponse.fetchedBusinessLocation = '';
    if (fetchState)
      successResponse.companyStateName = fetchState.stateName;
    if (fetchCountry)
      successResponse.companyCountryName = fetchCountry.countryName;
    if (fetchedBusinessLocation)
      successResponse.fetchedBusinessLocation = fetchedBusinessLocation;
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchEmailTemplate  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateFeedbackPageData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: post.id };
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "U";
    var newValues = { $set: post };
    await BusinessUsers.updateOne(query, newValues);
    let successResponse = genericResponse(true, "Feedback Page Data updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch updateFeedbackPageData=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchFeedbackPageData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchData = await BusinessUsers.findOne(query);
    const fetchedBusinessLocation = await businessLocation.findOne({ businessUserID: post.id, _id: post.businessLocationID });
    const fetchState = await countryStates.findOne({ _id: fetchedBusinessLocation.stateId });
    const fetchCountry = await country.findOne({ _id: fetchedBusinessLocation.countryId });
    let successResponse = genericResponse(true, "Feedback Page Data fetched successfully.", fetchData);
    successResponse.companyStateName = '';
    successResponse.companyCountryName = '';
    successResponse.fetchedBusinessLocation = '';
    if (fetchState)
      successResponse.companyStateName = fetchState.stateName;
    if (fetchCountry)
      successResponse.companyCountryName = fetchCountry.countryName;
    if (fetchedBusinessLocation)
      successResponse.fetchedBusinessLocation = fetchedBusinessLocation;
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchFeedbackPageData  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchFeedbackRatingData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var isValid = mongoose.Types.ObjectId.isValid(post.id);
    if (!isValid) {
      let successResponse = genericResponse(false, "No Review Request Found.", []);
      res.status(200).json(successResponse);
      return;
    }
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchedReviewRequest = await ReviewRequest.find(query);

    if (fetchedReviewRequest.length > 0) {
      const fetchData = await BusinessUsers.findOne({ _id: fetchedReviewRequest[0].businessUserID });
      const reviewRequestLocation = await businessLocation.findOne({ _id: fetchedReviewRequest[0].businessLocationID })
      const fetchState = await countryStates.findOne({ _id: reviewRequestLocation.stateId });
      const fetchCountry = await country.findOne({ _id: reviewRequestLocation.countryId });
      let successResponse = genericResponse(true, "Feedback Page Data fetched successfully.", fetchData);
      successResponse.companyStateName = '';
      successResponse.companyCountryName = '';

      successResponse.fetchedReviewRequest = fetchedReviewRequest[0];
      if (reviewRequestLocation)
        successResponse.businessLocation = reviewRequestLocation;
      if (fetchState)
        successResponse.companyStateName = fetchState.stateName;
      if (fetchCountry)
        successResponse.companyCountryName = fetchCountry.countryName;

      successResponse.ReviewRequestID = fetchedReviewRequest[0]._id;
      res.status(200).json(successResponse);
    }
    else {
      let successResponse = genericResponse(false, "No Review Request Found.", []);
      res.status(200).json(successResponse);
    }

  } catch (error) {
    console.log("error in fetchFeedbackRatingData  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateReviewRequest = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var query = { _id: mongoose.Types.ObjectId(post.id) };
    if (post.responseRating >= post.positiveFeedbackThreshold)
      post.responseRatingType = 'Positive';
    else {
      post.responseRatingType = 'Negative';
    }

    const updatedReviewRequest = await ReviewRequest.findOneAndUpdate(query, {
      $set: {
        lastModifiedDate: post.lastModifiedDate = currentDate,
        recordType: post.recordType = "U", requestStatus: "Responded",
        responseDateTime: post.responseDateTime = currentDate,
        responseRating: post.responseRating, responseRatingType: post.responseRatingType
      }
    });

    let fetchedBusinessUser = await BusinessUsers.findById(
      { _id: updatedReviewRequest.businessUserID },
      {
        positiveEmailNotificationSubject: 1, positiveEmailNotificationBody: 1, negativeEmailNotificationSubject: 1,
        negativeEmailNotificationBody: 1, companyName: 1,
        negativeEmailApology: 1, negativeApologyEmailSubject: 1, negativeApologyEmailBody: 1
      }
    );

    if (post.responseRating < post.positiveFeedbackThreshold && fetchedBusinessUser.negativeEmailApology === 1) {
      var emailTemplateSubject = fetchedBusinessUser.negativeApologyEmailSubject;
      var emailTemplateBody = fetchedBusinessUser.negativeApologyEmailBody;
      emailTemplateBody = emailTemplateBody.replaceAll(/(?:\r\n|\r|\n)/g, '<br/>');
      emailTemplateSubject = emailTemplateSubject.replaceAll('[FirstName]', updatedReviewRequest.firstName);
      emailTemplateSubject = emailTemplateSubject.replaceAll('[LastName]', updatedReviewRequest.lastName);
      emailTemplateSubject = emailTemplateSubject.replaceAll('[CompanyName]', fetchedBusinessUser.companyName);
      emailTemplateBody = emailTemplateBody.replaceAll('[FirstName]', updatedReviewRequest.firstName);
      emailTemplateBody = emailTemplateBody.replaceAll('[LastName]', updatedReviewRequest.lastName);
      emailTemplateBody = emailTemplateBody.replaceAll('[CompanyName]', fetchedBusinessUser.companyName);
      await sendMailBySendGrid(updatedReviewRequest.emailAddress, emailTemplateSubject, emailTemplateBody);
      await ReviewRequest.findOneAndUpdate(query, {
        $set: { lastModifiedDate: post.lastModifiedDate = currentDate, negativeApologyEmailSentDateTime: currentDate }
      });
    }

    const customNotificationData = await businessUserNotification.find({ businessUserID: (updatedReviewRequest.businessUserID) });
    if (customNotificationData.length > 0) {
      if (post.responseRating >= post.positiveFeedbackThreshold) {
        customNotificationData.map(async (val, i) => {
          if (val.firstPartyReviewNotificationType === 'Positive' || val.firstPartyReviewNotificationType === 'Both') {
            const emailTemplateSubject = fetchedBusinessUser.positiveEmailNotificationSubject;
            let emailTemplateBody = fetchedBusinessUser.positiveEmailNotificationBody;
            const userToSendEmail = await Users.findById(mongoose.Types.ObjectId(val.userID));
            emailTemplateBody = emailTemplateBody.replaceAll(/(?:\r\n|\r|\n)/g, '<br/>');
            emailTemplateBody = emailTemplateBody.replaceAll('[FirstName]', updatedReviewRequest.firstName);
            emailTemplateBody = emailTemplateBody.replaceAll('[LastName]', updatedReviewRequest.lastName);
            emailTemplateBody = emailTemplateBody.replaceAll('[PhoneNumber]', updatedReviewRequest.phoneNumber);
            emailTemplateBody = emailTemplateBody.replaceAll('[EmailAddress]', updatedReviewRequest.emailAddress);
            if (userToSendEmail)
              await sendMailBySendGrid(userToSendEmail.emailAddress, emailTemplateSubject, emailTemplateBody);
          }
        });
      }
      else {
        customNotificationData.map(async (val, i) => {
          if (val.firstPartyReviewNotificationType === 'Negative' || val.firstPartyReviewNotificationType === 'Both') {
            const emailTemplateSubject = fetchedBusinessUser.negativeEmailNotificationSubject;
            let emailTemplateBody = fetchedBusinessUser.negativeEmailNotificationBody;
            const userToSendEmail = await Users.findById(mongoose.Types.ObjectId(val.userID));
            emailTemplateBody = emailTemplateBody.replaceAll(/(?:\r\n|\r|\n)/g, '<br/>');
            emailTemplateBody = emailTemplateBody.replaceAll('[FirstName]', updatedReviewRequest.firstName);
            emailTemplateBody = emailTemplateBody.replaceAll('[LastName]', updatedReviewRequest.lastName);
            emailTemplateBody = emailTemplateBody.replaceAll('[PhoneNumber]', updatedReviewRequest.phoneNumber);
            emailTemplateBody = emailTemplateBody.replaceAll('[EmailAddress]', updatedReviewRequest.emailAddress);
            if (userToSendEmail)
              await sendMailBySendGrid(userToSendEmail.emailAddress, emailTemplateSubject, emailTemplateBody);
          }
        });
      }
    }

    let successResponse = genericResponse(true, "Review Request updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch updateGeneralSetting =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

export {
  fetchGeneralSetting, updateGeneralSetting, fetchSmsTemplate, updateSmsTemplate, updateEmailTemplate, fetchEmailTemplate,
  updateFeedbackPageData, fetchFeedbackPageData, fetchFeedbackRatingData, updateReviewRequest
}