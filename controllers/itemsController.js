import items from "../models/itemsModel.js";
import itemCategories from "../models/itemCategoriesModel.js";
import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import { generateSearchParameterList } from "../routes/genericMethods.js";

const fetchData = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    console.log("post", post);
    var query = {}
    let sort = {}
    if (post.categoryName !== "" && post.categoryName !== undefined) {
      query.categoryName = post.categoryName
    }
    let fetchQuery = [
      { $match: { businessUserID: mongoose.Types.ObjectId(post.businessUserID) } },
      {
        $lookup: {
          from: 'itemcatogories',
          localField: 'categoryNameID',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 1,
          categoryName: "$category.categoryName",
          itemName: "$itemName",
          itemCode: "$itemCode",
          unitOfMeasurement: "$unitOfMeasurement",
          itemStatus: "$itemStatus",
        }
      },
      { $match: query },
    ];
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
    if (post.itemStatus !== "All") {
      query.itemStatus = post.itemStatus;
    }


    let myAggregation = items.aggregate(fetchQuery)
    myAggregation._pipeline = fetchQuery
    items.aggregatePaginate(
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
    console.log("cgg", error.message)
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchCategoriesData = asyncHandler(async (req, res) => {
  try {
    const fetchCategories = await itemCategories.find();
    res.status(201).send({
      success: true,
      message: "fetchItemCategories Register Successfully",
      fetchCategories,
    })
  } catch (error) {
    console.log("cgg", error.message)
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const addItemData = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const checkIfItemNameAlreadyExist = await items.find({ itemName: { '$regex': '^' + post.itemName.trim() + '$', '$options': 'i' } });
    if (checkIfItemNameAlreadyExist.length > 0) {
      let successResponse = genericResponse(false, "Category Name Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    const checkIfItemCodeAlreadyExist = await items.find({ itemCode: { '$regex': '^' + post.itemCode.trim() + '$', '$options': 'i' } });
    if (checkIfItemCodeAlreadyExist.length > 0) {
      let successResponse = genericResponse(false, "Category Code Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }

    const addItemsData = await new items(post).save();

    const successResponse = genericResponse(true, "addData Register Successfully", addItemsData);
    res.status(200).json(successResponse);

  } catch (error) {
    console.log("Sdfsds", error.message)
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchItemsById = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post._id) };
    // const fetchItemsById = await items.find(query);
    const fetchItemsById = await items.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'itemcatogories',
          localField: 'categoryNameID',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 1,
          categoryName: "$category.categoryName",
          categoryNameID: "$categoryNameID",
          itemName: "$itemName",
          itemCode: "$itemCode",
          unitOfMeasurement: "$unitOfMeasurement",
          itemStatus: "$itemStatus",
        }
      }
    ])
    // console.log('fetchItems', fetchItemsById);
    if (fetchItemsById.length > 0) {
      let successResponse = genericResponse(true, "fetchItemCategoriesById fetched successfully.", fetchItemsById);
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

const updateItems = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post._id) }
    // post.recordType = 'U';
    // post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var newValues = { $set: post }
    const updateItems = await items.updateOne(query, newValues);
    let successResponse = genericResponse(true, "ItemCategories  updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const deleteItemss = asyncHandler(async (req, res) => {
  try {
    let list = [];
    if (req.body.selectedRows) {
      list = req.body.selectedRows[0]._id;
    } else {
      list = req.body._id;
    }
    console.log('list', list);

    if (list.length > 0) {
      const User = await items.deleteMany({ _id: { $in: list } });
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

const addItem = asyncHandler(async (req, res) => {
  const post = req.body;
  console.log("post(addItem)", post);
  try {
    // if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    const checkIfItemNameAlreadyExist = await items.findOne({ businessUserID: mongoose.Types.ObjectId(post.businessUserID), itemName: { '$regex': '^' + post.itemName.trim() + '$', '$options': 'i' } });
    console.log("post(checkIfItemNameAlreadyExist)", checkIfItemNameAlreadyExist);
    if (checkIfItemNameAlreadyExist != null) {
      let successResponse = genericResponse(false, "Item Name Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    const checkIfItemCodeAlreadyExist = await items.findOne({ businessUserID: mongoose.Types.ObjectId(post.businessUserID), itemCode: post.itemCode });
    console.log("post(checkIfItemCodeAlreadyExist)", checkIfItemCodeAlreadyExist);
    if (checkIfItemCodeAlreadyExist != null) {
      let successResponse = genericResponse(false, "Item Code Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    post.recordType = "I";
    console.log("post(post)", post);
    const addItems = await new items(post).save();
    const successResponse = genericResponse(true, "Items Added Successfully", addItems);
    res.status(200).json(successResponse);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchItems = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log('fetchItems(post)', post)
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }

    const fetchUser = await items.find(query);
    // console.log("fetchItems=", fetchUser);
    // const fetchUser = await Contacts.aggregate([
    //   {
    //     $match: query
    //   },
    //   {
    //     $project: {
    //       categoryName: "$categoryName",
    //       categoryCode: "$categoryCode",
    //       categoryStatus: "$categoryStatus",
    //     }
    //   },

    // ])
    // let fetchQuery = [
    //   // { $match: query },
    //   {
    //     $lookup: {
    //       from: 'itemcatogories',
    //       localField: 'categoryID',
    //       foreignField: '_id',
    //       as: 'category'
    //     }
    //   },
    //   { $unwind: '$category' },
    //   {
    //     $project: {
    //       _id: 1,
    //       categoryName: "$category.categoryName",
    //       itemName: "$itemName",
    //       itemCode: "$itemCode",
    //       unitOfMeasurement: "$unitOfMeasurement",
    //       itemStatus: "$itemStatus",
    //       businessUserID: "$businessUserID",
    //     }
    //   },
    //   { $match: query },
    // ];
    // const fetchUser = await items.aggregate(fetchQuery);
    let successResponse = genericResponse(true, "fetchItems fetched successfully.", fetchUser);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchItems=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateItem = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("ee", post)
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    const checkIfItemNameAlreadyExist = await items.findOne({ businessUserID: { $ne: mongoose.Types.ObjectId(post.businessUserID) }, itemName: { '$regex': '^' + post.itemName.trim() + '$', '$options': 'i' } });
    console.log("post(checkIfItemNameAlreadyExist)", checkIfItemNameAlreadyExist);
    if (checkIfItemNameAlreadyExist != null) {
      let successResponse = genericResponse(false, "Item Name Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    const checkIfItemCodeAlreadyExist = await items.findOne({ businessUserID: { $ne: mongoose.Types.ObjectId(post.businessUserID) }, itemCode: post.itemCode });
    console.log("post(checkIfItemCodeAlreadyExist)", checkIfItemCodeAlreadyExist);
    if (checkIfItemCodeAlreadyExist != null) {
      let successResponse = genericResponse(false, "Item Code Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    const query = { _id: mongoose.Types.ObjectId(post.userID) }
    post.recordType = 'U';
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var newValues = { $set: post }
    const updateItems = await items.updateOne(query, newValues);
    let successResponse = genericResponse(true, "Items  updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const deleteItem = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    console.log("deleteContact ID ==> ", post._id)
    const query = { _id: mongoose.Types.ObjectId(post._id) };
    if (post._id !== undefined && post._id !== '') {
      await items.deleteOne(query);
      res.status(201).json(genericResponse(true, "Contact is deleted successfully", []));
    }
    else
      res.status(400).json(genericResponse(false, "Contact is not found", []));
  } catch (error) {
    console.log("Catch in deleteContact:", error);
    res.status(400).json(genericResponse(false, error.message, []));
  }
});

export {
  fetchData,
  addItemData,
  fetchCategoriesData,
  updateItems,
  fetchItemsById,

  // Mobile API ------------->

  addItem,
  fetchItems,
  updateItem,
  deleteItem,
}

