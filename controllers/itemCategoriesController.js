import itemCategories from "../models/itemCategoriesModel.js";
import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import { generateSearchParameterList } from "../routes/genericMethods.js";


const screenData = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    console.log("post", post);
    var query = {}
    let sort = {};
    let fetchQuery = [(
      { $match: query }
    )]
    if (post.filterValues != undefined && post.filterValues != '')
      query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
    if (post.sortingType && post.sortingField) {
      var sortField = post.sortingField;
      sort[sortField] = post.sortingType;
      fetchQuery.push({ $sort: sort });
    } else {
      sort = { createdDate: -1 }
    }
    let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
    if (post.categoryStatus !== "All") {
      query.categoryStatus = post.categoryStatus;
    }
    let myAggregation = itemCategories.aggregate()
    myAggregation._pipeline = fetchQuery
    itemCategories.aggregatePaginate(
      myAggregation,
      options,
      (err, result) => {

        if (err) {
          const errorResponse = genericResponse(false, "Unable to fetch", []);
          res.status(400).json(errorResponse);

        } else {
          console.log(result);
          const successResponse = genericResponse(true, "Customer fetched successfully", result);
          res.status(200).json(successResponse);

        }
      }
    );


  } catch (error) {
    console.log("cgg", error.message)
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchItemCategoriesById = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post._id) };
    const fetchItemCategoriesById = await itemCategories.find(query);
    if (fetchItemCategoriesById.length > 0) {
      let successResponse = genericResponse(true, "fetchItemCategoriesById fetched successfully.", fetchItemCategoriesById);
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

const updateItemCategories = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post._id) }
    // post.recordType = 'U';
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var newValues = { $set: post }
    const updateItemcategories = await itemCategories.updateOne(query, newValues);
    let successResponse = genericResponse(true, "ItemCategories  updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const deleteCategories = asyncHandler(async (req, res) => {
  try {

    let list = [];
    if (req.body.selectedRows) {
      list = req.body.selectedRows;
    } else {
      list = req.body._id;
    }
    console.log('list', list);
    if (list.length > 0) {
      const User = await itemCategories.deleteMany({ _id: { $in: list } });
      let successResponse = genericResponse(true, "ItemCategories deleted successfully.", []);
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

// Mobile API ------------->

const addCategory = asyncHandler(async (req, res) => {
  const post = req.body;
  console.log('addCategory(post)', post)
  if (post.signatureKey !== process.env.SIGNATURE_KEY) {
    return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
  }
  if (!post.businessUserID) {
    return res.status(200).json(genericResponse(false, 'BusinessUserID is Missing!', []));
  }
  try {
    const checkIfCategoryNameAlreadyExist = await itemCategories.find({ businessUserID: mongoose.Types.ObjectId(post.businessUserID), categoryName: { '$regex': '^' + post.categoryName.trim() + '$', '$options': 'i' } });
    console.log('checkIfCategoryNameAlreadyExist(post)', checkIfCategoryNameAlreadyExist)
    if (checkIfCategoryNameAlreadyExist.length > 0) {
      let successResponse = genericResponse(false, "Category Name Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    const checkIfCategoryCodeAlreadyExist = await itemCategories.find({ businessUserID: mongoose.Types.ObjectId(post.businessUserID), categoryCode: post.categoryCode });
    console.log('checkIfCategoryCodeAlreadyExist(post)', checkIfCategoryCodeAlreadyExist)
    if (checkIfCategoryCodeAlreadyExist.length > 0) {
      let successResponse = genericResponse(false, "Category Code Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    const addData = await new itemCategories(post).save();
    const successResponse = genericResponse(true, "add Category Successfully", addData);
    res.status(200).json(successResponse);

  } catch (error) {
    console.log("error in addCategory=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchCategory = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log('fetchCategory(post)', post)
    if (post.signatureKey !== process.env.SIGNATURE_KEY) {
      return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    }
    if (!post.businessUserID) {
      return res.status(200).json(genericResponse(false, 'Invalid businessUserID issue !', []));
    }
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
    const fetchUser = await itemCategories.aggregate([
      {
        $match: query
      },
      {
        $project: {
          categoryName: "$categoryName",
          categoryCode: "$categoryCode",
          categoryStatus: "$categoryStatus",
        }
      },
    ])

    let successResponse = genericResponse(true, "Users fetched successfully.", fetchUser);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchCategory=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchCategoryById = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    var query = { _id: mongoose.Types.ObjectId(post._id) };
    const fetchItemCategoriesById = await itemCategories.find(query);
    if (fetchItemCategoriesById.length > 0) {
      let successResponse = genericResponse(true, "fetchCategoriesById fetched successfully.", fetchItemCategoriesById);
      res.status(201).json(successResponse);
    } else {
      let errorRespnse = genericResponse(false, "Something went wrong, Try again!", []);
      res.status(200).json(errorRespnse);
      return;
    }
  } catch (error) {
    console.log("error in fetchCategoryById=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateCategory = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    const checkIfCategoryNameAlreadyExist = await itemCategories.find({ businessUserID: { $ne: mongoose.Types.ObjectId(post.businessUserID) }, categoryName: { '$regex': '^' + post.categoryName.trim() + '$', '$options': 'i' } });
    console.log('checkIfCategoryNameAlreadyExist(post)', checkIfCategoryNameAlreadyExist)
    if (checkIfCategoryNameAlreadyExist.length > 0) {
      let successResponse = genericResponse(false, "Category Name Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    const checkIfCategoryCodeAlreadyExist = await itemCategories.find({ businessUserID: { $ne: mongoose.Types.ObjectId(post.businessUserID) }, categoryCode: post.categoryCode });
    console.log('checkIfCategoryCodeAlreadyExist(post)', checkIfCategoryCodeAlreadyExist)
    if (checkIfCategoryCodeAlreadyExist.length > 0) {
      let successResponse = genericResponse(false, "Category Code Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    const query = { _id: mongoose.Types.ObjectId(post.categoryID) }
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "U"
    var newValues = { $set: post }
    const updateItemcategories = await itemCategories.updateOne(query, newValues);
    let successResponse = genericResponse(true, "Categories updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in updateCategory=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const deleteCategory = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    console.log("deleteCategory ID ==> ", post._id)
    const query = { _id: mongoose.Types.ObjectId(post._id) };
    if (post._id !== undefined && post._id !== '') {
      await itemCategories.deleteOne(query);
      res.status(201).json(genericResponse(true, "Category is deleted successfully", []));
    }
    else
      res.status(400).json(genericResponse(false, "Category is not found", []));
  } catch (error) {
    console.log("Catch in deleteCategory: ", error);
    res.status(400).json(genericResponse(false, error.message, []));
  }
});

const fetchCategoryName = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("sd", post);
    if (post.signatureKey !== process.env.SIGNATURE_KEY) {
      return res.status(401).json(genericResponse(false, 'Invalid Signature Key!', []));
    }
    if (!post.businessUserID) {
      return res.status(401).json(genericResponse(false, 'businessUserID is missing!', []));
    }
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
    const fetchCategory = await itemCategories.aggregate([
      {
        $match: query
      },
      {
        $project: {
          categoryName: 1,
        }
      }
    ]);
    console.log("fetchCategory", fetchCategory);
    let successResponse = genericResponse(true, "CategoryName fetched successfully.", fetchCategory);
    res.status(200).json(successResponse);
  }
  catch (error) {
    let errorResponse = genericResponse(false, error.message, []);
    res.status(500).json(errorResponse);
  }
});

export {
  screenData,
  updateItemCategories,
  fetchItemCategoriesById,
  deleteCategories,

  // Mobile API ------------->
  addCategory,
  fetchCategory,
  deleteCategory,
  fetchCategoryById,
  updateCategory,
  fetchCategoryName
}

