import asyncHandler from "express-async-handler";
import Themes from "../models/themeModel.js";
import mongoose from "mongoose";
import genericResponse from "../routes/genericWebResponses.js";

const themesSetting = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { userID: mongoose.Types.ObjectId(post.userID) };
    const themeData = await Themes.find(query);
    if (themeData.length === 0) {
      const theme = await Themes(post).save();
    } else {
      var newValues = { $set: post };
      const updateTheme = await Themes.updateOne(
        { userID: mongoose.Types.ObjectId(req.body.userID) },
        newValues
      );
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json(error.message);
  }
});
const fetchThemeSetting = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const themeResponse = await Themes.find({
      userID: mongoose.Types.ObjectId(post.userID),
    });
    if (themeResponse.length > 0) {
      let successResponse = genericResponse(
        true,
        "fetchWarehouse fetched successfully.",
        themeResponse
      );
      res.status(200).json(successResponse);
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json(error.message);
  }
});
export { themesSetting, fetchThemeSetting };
