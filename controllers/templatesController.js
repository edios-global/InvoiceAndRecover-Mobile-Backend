import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import template from '../models/templatesModel.js'
import { generateSearchParameterList } from '../routes/genericMethods.js'
import invoiceReminderTemplate from '../models/invoiceReminderTemplateModel.js';

const addTemplates = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { templateName: post.templateName.trim() }

    if (post.templateName && post.templateType && post.templateMessage != "" && post.templateName && post.templateType && post.templateMessage != undefined) {
      const fetch = await template.find(query)
      console.log(fetch)
      if (fetch != "" && fetch != undefined) {

        let successResponse = genericResponse(false, "Template name already exist", []);
        res.status(200).json(successResponse)
      }
      else {
        let addTemplates = new template(post)
        const templateAdded = await addTemplates.save()
        let successResponse = genericResponse(true, "template added successfully", templateAdded);
        res.status(200).json(successResponse);

      }

    }
    else {
      let successResponse = genericResponse(false, "input field cant be blank", []);
      res.status(200).json(successResponse);

    }

  } catch (error) {
    console.log("failed to add template ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateTemplate = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post._id) }
    let newValues = { $set: post }
    const vv = await template.updateOne(query, newValues)
    let successResponse = genericResponse(true, "template fetched successfully", []);
    res.status(200).json(successResponse);

  } catch (error) {
    console.log("failed to add template ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchTemplateById = asyncHandler(async (req, res) => {
  try {
    const post = req.body;

    var query = { _id: mongoose.Types.ObjectId(post._id) }

    const templateAdded = await template.find(query)

    let successResponse = genericResponse(true, "template fetched successfully", templateAdded);
    res.status(200).json(successResponse);

  } catch (error) {
    console.log("failed to add template ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchTemplate = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = {};
    var sort = {};
    if (post.filterValues != undefined && post.filterValues != '')
      query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);

    const fetchQuery = [

      {
        $project: {
          templateName: "$templateName",
          templateType: "$templateType",
          templateStatus: "$templateStatus",
        }
      },
      {
        $match: query
      },
    ];

    if (post.sortingType && post.sortingField) {
      var sortField = post.sortingField;
      sort[sortField] = post.sortingType;

      fetchQuery.push({ $sort: sort });
    } else {
      sort = { createdDate: -1 }
    }
    let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
    if (post.templateStatus !== "All") {
      query.templateStatus = post.templateStatus;
      fetchQuery.push({ $match: query });
    }
    let myAggregation = template.aggregate()
    myAggregation._pipeline = fetchQuery
    template.aggregatePaginate(
      myAggregation,
      options,
      (err, result) => {
        if (err) {
          const errorResponse = genericResponse(false, "Unable to fetch", []);
          res.status(400).json(errorResponse);

        } else {
          const successResponse = genericResponse(true, "template fetched successfully", result);
          res.status(200).json(successResponse);

        }
      }
    );
  } catch (error) {
    console.log("Catch in fetchStandardFeatures: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  };

});

// Mobile API ------------->

const addInvoiceReminderTemplate = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { templateName: post.templateName.trim() }

    if (post.templateName && post.templateType && post.templateMessage != "" && post.templateName && post.templateType && post.templateMessage != undefined) {
      const fetch = await invoiceReminderTemplate.find(query)
      console.log(fetch)
      if (fetch != "" && fetch != undefined) {
        let successResponse = genericResponse(false, "Template name already exist", []);
        res.status(200).json(successResponse);
        return;
      }
      else {
        let addTemplates = new invoiceReminderTemplate(post)
        const templateAdded = await addTemplates.save()
        let successResponse = genericResponse(true, "template added successfully", templateAdded);
        res.status(200).json(successResponse);

      }
    }
    else {
      let successResponse = genericResponse(false, "input field cant be blank", []);
      res.status(200).json(successResponse);

    }
  } catch (error) {
    console.log("failed to addInvoiceReminderTemplate ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);

  }
});

const updateInvoiceReminderTemplate = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post._id) }
    let newValues = { $set: post }
    const vv = await invoiceReminderTemplate.updateOne(query, newValues)
    let successResponse = genericResponse(true, "Invoice Reminder template fetched successfully", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("failed to updateInvoiceReminderTemplate ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);

  }
});

const fetchInvoiceReminderTemplates = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log('fetchExpenses(post)', post)
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
    const fetchExp = await invoiceReminderTemplate.find(query)

    let successResponse = genericResponse(true, "Invoice Reminder Templates fetched successfully.", fetchExp);
    res.status(200).json(successResponse);

  } catch (error) {
    console.log("error in fetchInvoiceReminderTemplates=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);

  }
});


export {
  addTemplates,
  fetchTemplateById,
  fetchTemplate,
  updateTemplate,


  // Mobile API ------------->
  addInvoiceReminderTemplate,
  updateInvoiceReminderTemplate,
  fetchInvoiceReminderTemplates


}