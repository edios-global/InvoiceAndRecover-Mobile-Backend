import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import BusinessUsers from '../models/businessUsersModel.js';
import countryStates from '../models/countryStatesModel.js';
import country from '../models/countryModel.js';
import businessLocation from '../models/businessLocationModel.js';
import ReviewRequest from '../models/reviewRequestsModel.js';
import businessReviewLink from '../models/businessReviewLinkModel.js';

const fetchRequestcampaign = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchData = await BusinessUsers.findOne(query,
      {
        firstReviewRequestReminder: 1, secondReviewRequestReminder: 1, firstPositiveFeedbackRequestReminder: 1,
        secondPositiveFeedbackRequestReminder: 1, firstPositiveRequestReminderDays: 1, secondPositiveRequestReminderDays: 1,
        firstReviewRequestReminderDays: 1, secondReviewRequestReminderDays: 1, negativeEmailApology: 1,
        negativeLandingPageEnableGoogleReview: 1
      });
    let successResponse = genericResponse(true, "fetch Request campaign", fetchData);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchRequestcampaign  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateRequestcampaign = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: post.id }
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "U";
    var newValues = { $set: post };
    await BusinessUsers.updateOne(query, newValues);
    let successResponse = genericResponse(true, "update Requestcampaign successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch updateRequestcampaign =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updatePositiveFeedbackPageData = asyncHandler(async (req, res) => {
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

const fetchActualPositiveFeedbackPageData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchedReviewRequest = await ReviewRequest.find(query);
    // const fetchData = await BusinessUsers.findOne(query);
    if (fetchedReviewRequest.length > 0) {
      const fetchData = await BusinessUsers.findOne({ _id: fetchedReviewRequest[0].businessUserID });
      const reviewRequestLocation = await businessLocation.findOne({ _id: fetchedReviewRequest[0].businessLocationID });
      const fetchedBusinessReviewLinks = await businessReviewLink.find(
        { businessUserID: fetchedReviewRequest[0].businessUserID, businessLocationID: fetchedReviewRequest[0].businessLocationID }
      ).sort({ reviewSiteName: 1 });
      let successResponse = genericResponse(true, "Positive Feedback Page Data fetched successfully.", fetchData);
      if (reviewRequestLocation.stateId) {
        const fetchState = await countryStates.findOne({ _id: reviewRequestLocation.stateId });
        if (fetchState)
          successResponse.companyStateName = fetchState.stateName;
      }
      const fetchCountry = await country.findOne({ _id: reviewRequestLocation.countryId });

      successResponse.companyStateName = '';
      successResponse.companyCountryName = '';
      successResponse.fetchedBusinessReviewLinks = [];

      if (reviewRequestLocation)
        successResponse.fetchedBusinessLocation = reviewRequestLocation;

      if (fetchCountry)
        successResponse.companyCountryName = fetchCountry.countryName;

      if (fetchedBusinessReviewLinks.length > 0)
        successResponse.fetchedBusinessReviewLinks = fetchedBusinessReviewLinks;

      successResponse.ReviewRequestID = fetchedReviewRequest[0]._id;
      successResponse.responseRating = fetchedReviewRequest[0].responseRating;
      res.status(200).json(successResponse);
    }
  } catch (error) {
    console.log("error in fetchFeedbackPageData  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchActualNegativeFeedbackPageData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchedReviewRequest = await ReviewRequest.find(query);
    // const fetchData = await BusinessUsers.findOne(query);
    if (fetchedReviewRequest.length > 0) {
      const fetchData = await BusinessUsers.findOne({ _id: fetchedReviewRequest[0].businessUserID });
      const reviewRequestLocation = await businessLocation.findOne({ _id: fetchedReviewRequest[0].businessLocationID })
      const fetchState = await countryStates.findOne({ _id: reviewRequestLocation.stateId });
      const fetchCountry = await country.findOne({ _id: reviewRequestLocation.countryId });
      let successResponse = genericResponse(true, "Negative Feedback Page Data fetched successfully.", fetchData);
      successResponse.companyStateName = '';
      successResponse.companyCountryName = '';
      if (reviewRequestLocation)
        successResponse.fetchedBusinessLocation = reviewRequestLocation;
      if (fetchState)
        successResponse.companyStateName = fetchState.stateName;
      if (fetchCountry)
        successResponse.companyCountryName = fetchCountry.countryName;

      successResponse.ReviewRequestID = fetchedReviewRequest[0]._id;
      successResponse.responseRating = fetchedReviewRequest[0].responseRating;
      successResponse.responseFeedback = fetchedReviewRequest[0].responseFeedback;
      res.status(200).json(successResponse);
    }
  } catch (error) {
    console.log("error in fetchActualNegativeFeedbackPageData==", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchPositiveFeedbackPageData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) };
    const fetchData = await BusinessUsers.findOne(query);
    const fetchedBusinessLocation = await businessLocation.findOne({ businessUserID: post.id, _id: post.businessLocationID });
    const fetchedBusinessReviewLinks = await businessReviewLink.find(
      { businessUserID: post.businessUserID, businessLocationID: post.businessLocationID }
    ).sort({ reviewSiteName: 1 });

    let successResponse = genericResponse(true, "Feedback Page Data fetched successfully.", fetchData);
    if (fetchedBusinessLocation.stateId) {
      const fetchState = await countryStates.findOne({ _id: fetchedBusinessLocation.stateId });
      if (fetchState)
        successResponse.companyStateName = fetchState.stateName;
    }

    const fetchCountry = await country.findOne({ _id: fetchedBusinessLocation.countryId });

    successResponse.companyStateName = '';
    successResponse.companyCountryName = '';
    successResponse.fetchedBusinessLocation = '';
    successResponse.fetchedBusinessReviewLinks = [];

    if (fetchCountry)
      successResponse.companyCountryName = fetchCountry.countryName;
    if (fetchedBusinessLocation)
      successResponse.fetchedBusinessLocation = fetchedBusinessLocation;
    if (fetchedBusinessReviewLinks.length > 0)
      successResponse.fetchedBusinessReviewLinks = fetchedBusinessReviewLinks;
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchFeedbackPageData  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchNegativeEmailApologyTemplate = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchData = await BusinessUsers.findOne(query);
    let successResponse = genericResponse(true, "Email template fetched successfully.", fetchData);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchNegativeEmailApologyTemplate  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateNegativeEmailApologyTemplate = asyncHandler(async (req, res) => {
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
    console.log("error in Catch updateNegativeEmailApologyTemplate=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const saveResponseFeedback = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    var query = { _id: mongoose.Types.ObjectId(post.id) };
    const updatedReviewRequest = await ReviewRequest.findOneAndUpdate(query, {
      $set: {
        lastModifiedDate: post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
        recordType: post.recordType = "U",
        responseFeedback: post.responseFeedback
      }
    });

    let successResponse = genericResponse(true, "Response Feedback updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch saveResponseFeedback =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchFirstReviewRequestReminderData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchData = await BusinessUsers.findOne(query);
    const fetchedBusinessLocation = await businessLocation.findOne({ businessUserID: post.id, _id: post.businessLocationID });
    const fetchState = await countryStates.findOne({ _id: fetchedBusinessLocation.stateId });
    const fetchCountry = await country.findOne({ _id: fetchedBusinessLocation.countryId });
    let successResponse = genericResponse(true, "First Review Request Reminder data fetched successfully.", fetchData);
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
    console.log("error in fetchFirstReviewRequestReminderData  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchSecondReviewRequestReminderData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchData = await BusinessUsers.findOne(query,
      {
        bgCurrentColor: 1, companyName: 1, companyPhoneNumber: 1, firstName: 1, lastName: 1, companyWebsite: 1, secondReviewRequestReminderEmailSubject: 1,
        secondReviewRequestReminderFeedbackPageText: 1, companyLogoFileName: 1, showCompanyLogo: 1, showCompanyPhoneNumber: 1, showCompanyName: 1,
      });
    const fetchedBusinessLocation = await businessLocation.findOne(
      { businessUserID: post.id, _id: post.businessLocationID },
      { stateId: 1, countryId: 1, locationStreetAddress: 1, locationCity: 1, zipCode: 1 });
    const fetchState = await countryStates.findOne({ _id: fetchedBusinessLocation.stateId });
    const fetchCountry = await country.findOne({ _id: fetchedBusinessLocation.countryId });
    let successResponse = genericResponse(true, "Second Review Request Reminder data fetched successfully.", fetchData);
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
    console.log("error in fetchSecondReviewRequestReminderData  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateFirstReviewRequestReminderData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: post.id };
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "U";
    var newValues = { $set: post };
    await BusinessUsers.updateOne(query, newValues);
    let successResponse = genericResponse(true, "FirstReviewRequestReminderData updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch updateFirstReviewRequestReminderData=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateSecondReviewRequestReminderData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: post.id };
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "U";
    var newValues = { $set: post };
    await BusinessUsers.updateOne(query, newValues);
    let successResponse = genericResponse(true, "SecondReviewRequestReminderData updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch updateSecondReviewRequestReminderData=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchFirstPositiveFeedbackRequestReminderData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchData = await BusinessUsers.findOne(query,
      {
        bgCurrentColor: 1, companyName: 1, companyPhoneNumber: 1, firstName: 1, lastName: 1, companyWebsite: 1, companyLogoFileName: 1,
        firstPositiveFeedbackRequestReminderEmailSubject: 1, firstPositiveFeedbackRequestReminderFeedbackPageText: 1,
        showCompanyLogo: 1, showCompanyPhoneNumber: 1, showCompanyName: 1,
      });
    const fetchedBusinessLocation = await businessLocation.findOne(
      { businessUserID: post.id, _id: post.businessLocationID },
      { stateId: 1, countryId: 1, locationStreetAddress: 1, locationCity: 1, zipCode: 1 });
    const fetchState = await countryStates.findOne({ _id: fetchedBusinessLocation.stateId });
    const fetchCountry = await country.findOne({ _id: fetchedBusinessLocation.countryId });
    let successResponse = genericResponse(true, "FirstPositiveFeedbackRequestReminderData fetched successfully.", fetchData);
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
    console.log("error in fetchFirstPositiveFeedbackRequestReminderData  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateFirstPositiveFeedbackRequestReminderData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: post.id };
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "U";
    var newValues = { $set: post };
    await BusinessUsers.updateOne(query, newValues);
    let successResponse = genericResponse(true, "FirstPositiveFeedbackRequestReminderData updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch updateFirstPositiveFeedbackRequestReminderData=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchSecondPositiveFeedbackRequestReminderData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchData = await BusinessUsers.findOne(query,
      {
        bgCurrentColor: 1, companyName: 1, companyPhoneNumber: 1, firstName: 1, lastName: 1, companyWebsite: 1, companyLogoFileName: 1,
        secondPositiveFeedbackRequestReminderEmailSubject: 1, secondPositiveFeedbackRequestReminderFeedbackPageText: 1,
        showCompanyLogo: 1, showCompanyPhoneNumber: 1, showCompanyName: 1,
      });
    const fetchedBusinessLocation = await businessLocation.findOne(
      { businessUserID: post.id, _id: post.businessLocationID },
      { stateId: 1, countryId: 1, locationStreetAddress: 1, locationCity: 1, zipCode: 1 });
    const fetchState = await countryStates.findOne({ _id: fetchedBusinessLocation.stateId });
    const fetchCountry = await country.findOne({ _id: fetchedBusinessLocation.countryId });
    let successResponse = genericResponse(true, "SecondPositiveFeedbackRequestReminderData fetched successfully.", fetchData);
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
    console.log("error in fetchSecondPositiveFeedbackRequestReminderData  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateSecondPositiveFeedbackRequestReminderData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: post.id };
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "U";
    var newValues = { $set: post };
    await BusinessUsers.updateOne(query, newValues);
    let successResponse = genericResponse(true, "SecondPositiveFeedbackRequestReminderData updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch updateSecondPositiveFeedbackRequestReminderData=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});


export {
  fetchRequestcampaign, updateRequestcampaign, updatePositiveFeedbackPageData, fetchPositiveFeedbackPageData,
  fetchNegativeEmailApologyTemplate, updateNegativeEmailApologyTemplate, fetchActualPositiveFeedbackPageData,
  fetchActualNegativeFeedbackPageData, saveResponseFeedback, fetchFirstReviewRequestReminderData,
  updateFirstReviewRequestReminderData, fetchSecondReviewRequestReminderData, updateSecondReviewRequestReminderData,
  fetchFirstPositiveFeedbackRequestReminderData, updateFirstPositiveFeedbackRequestReminderData,
  fetchSecondPositiveFeedbackRequestReminderData, updateSecondPositiveFeedbackRequestReminderData
}