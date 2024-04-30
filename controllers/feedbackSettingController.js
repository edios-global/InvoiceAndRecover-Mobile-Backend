import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import BusinessUsers from '../models/businessUsersModel.js';

const fetchFeedbackSetting = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) }
    const fetchData = await BusinessUsers.findOne(query,
      {
        positiveFeedbackThreshold: 1, leaveFeedbackUrl: 1, feedbackRequestSender: 1,
        defaultSendMethod: 1, repeatCustomerFeedbackDays: 1, repeatCustomerFeedback: 1
      });
    let successResponse = genericResponse(true, "fetch feedback setting", fetchData);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetch feedback setting  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateFeedbackSetting = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: post.id }
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "U";
    var newValues = { $set: post };
    await BusinessUsers.updateOne(query, newValues);
    let successResponse = genericResponse(true, "Feedback Setting updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch updateFeedbackSetting =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});


export {
  fetchFeedbackSetting,
  updateFeedbackSetting
}