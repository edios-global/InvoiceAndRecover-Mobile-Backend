import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import businessLocation from '../models/businessLocationModel.js';
import mongoose from 'mongoose';

const fetchBusinessLocationCount = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
    const BLCount = await businessLocation.countDocuments(query);
    res.json(genericResponse(true, 'Business Location count fetched successfully', BLCount));
  } catch (error) {
    res.status(200).json(genericResponse(false, error.message, []))
  }
});

const addBusinessLocation = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const checkIfStreetCityExist = await businessLocation.find({ locationStreetAddress: post.locationStreetAddress, locationCity: post.locationCity });
    if (checkIfStreetCityExist.length > 0) {
      let successResponse = genericResponse(false, "Location already exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    if (post.defaultLocation === "Yes" && post.locationStatus === "Inactive") {
      let successResponse = genericResponse(false, "You are not allowed to set inactive location as default.", []);
      res.status(201).json(successResponse);
      return;
    }
    post.recordType = "I";
    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    const addBL = new businessLocation(post);
    if (post.defaultLocation === "Yes") {
      const updateBusinessLocation = await businessLocation.updateMany({ businessUserID: post.businessUserID }, {
        $set: {
          defaultLocation: "No", lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
          recordType: 'U'
        }
      });
    }
    const addedBL = await addBL.save();
    let successResponse = genericResponse(true, "Business Location added successfully.", addedBL);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in addBusinessLocation  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchBusinessLocation = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
    const fetchBL = await businessLocation.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: "country_states",
          localField: "stateId",
          foreignField: "_id",
          as: "states"
        }
      },
      { $unwind: "$states" },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country"
        }
      },
      { $unwind: "$country" },
      {
        $project: {
          stateName: "$states.stateName", countryName: "$country.countryName", locationCity: "$locationCity",
          locationStreetAddress: "$locationStreetAddress", zipCode: "$zipCode", locationStatus: "$locationStatus",
          defaultLocation: "$defaultLocation", companyTimeZone: 1, sendingFromHour: 1, sendingToHour: 1,
        }
      }
    ]).sort({ _id: -1 }).skip(post.initialValue).limit(post.finalValue);
    let successResponse = genericResponse(true, "Business Location fetched successfully.", fetchBL);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchCountry  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchBusinessLocationById = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post._id) }
    const fetchBusinessLocationById = await businessLocation.findById(query);
    let successResponse = genericResponse(true, "Business Location fetched successfully.", fetchBusinessLocationById);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchBusinessLocationById  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateBusinessLocation = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const checkIfStreetCityExist = await businessLocation.find({
      locationStreetAddress: post.locationStreetAddress, locationCity: post.locationCity, _id: { $ne: mongoose.Types.ObjectId(post._id) }
    });
    if (checkIfStreetCityExist.length > 0) {
      let successResponse = genericResponse(false, "Location already exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    if (post.defaultLocation === "Yes" && post.locationStatus === "Inactive") {
      let successResponse = genericResponse(false, "You are not allowed to set inactive location as default.", []);
      res.status(201).json(successResponse);
      return;
    }
    // if (post.defaultLocation === "No") {
    //   let successResponse = genericResponse(false, "Atleast one default location.", []);
    //   res.status(201).json(successResponse);
    //   return;
    // }
    const query = { _id: mongoose.Types.ObjectId(post._id) }
    post.recordType = "U";
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var newValues = { $set: post };
    if (post.defaultLocation === "Yes") {
      const updateBusinessLocation = await businessLocation.updateMany({ businessUserID: post.businessUserID }, {
        $set: {
          defaultLocation: "No", lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
          recordType: 'U'
        }
      });
    }
    await businessLocation.updateOne(query, newValues);
    let successResponse = genericResponse(true, "Business Location updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in updateBusinessLocation  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const deleteBusinessLocation = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post._id) }
    if (post._id != undefined && post._id != '') {
      await businessLocation.deleteOne(query);
      res.status(201).json(genericResponse(true, 'Business Location deleted sucessfully', []))
    }
    else
      res.status(400).json(genericResponse(false, 'Record in Business Location is not found', []))
  } catch (error) {
    res.status(400).json(genericResponse(false, error.message, []))
  }

});

const fetchLocation = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), locationStatus: 'Active' }
    const fetchLocation = await businessLocation.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: "country_states",
          localField: "stateId",
          foreignField: "_id",
          as: "states",
        }
      },
      { $unwind: "$states" },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country"
        }
      },
      { $unwind: "$country" },
      {
        $project: {
          stateNameWithCountry: { $concat: ["$states.stateName", ", ", "$country.countryName"] },
          streetWithCity: { $concat: ["$locationStreetAddress", ", ", "$locationCity"] }, defaultLocation: "$defaultLocation",
        }
      }
    ]).sort({ streetWithCity: 1 });
    let successResponse = genericResponse(true, "Business Location fetched successfully.", fetchLocation);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchCountry  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchComapanyName = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
    const fetchLocation = await businessLocation.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: "business_users",
          localField: "businessUserID",
          foreignField: "_id",
          as: "businessUsers",
        }
      },
      { $unwind: "$businessUsers" },
      {
        $project: {
          companyName: "$businessUsers.companyName",
          fullName: { $concat: ["$businessUsers.firstName", "  ", "$businessUsers.lastName"] }
        }
      }
    ]);
    let successResponse = genericResponse(true, "Business Location fetched successfully.", fetchLocation);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchComapanyName  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});


export {
  addBusinessLocation,
  fetchBusinessLocation,
  fetchBusinessLocationCount,
  fetchBusinessLocationById,
  updateBusinessLocation,
  deleteBusinessLocation,
  fetchLocation,
  fetchComapanyName
}