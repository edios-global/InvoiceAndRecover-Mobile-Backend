import asyncHandler from "express-async-handler";
import genericResponse from "../routes/genericWebResponses.js";
import mongoose from "mongoose";
import Parameter from "../models/parameterModel.js";
import ParameterList from "../models/parameterListModel.js";
import Customer from "../models/customerBfmModel.js";
import Orders from "../models/ordersModel.js";
import OrderItems from "../models/orderItemsModel.js";
import Employee from "../models/employeeBfmModel.js";
import Warehouse from "../models/warehouseModel.js";
import OrderStatusLogs from "../models/orderStatusLogsModel.js";
import OrderDriverJob from "../models/orderDriverJobsModel.js";
import {
  appNotification,
  generateSearchParameterList,
  generateSequenceValue,
  getWarehouse,
  sendEmail,
} from "../routes/genericMethods.js";
import TrackStatusLogs from "../models/trackStatusLogs.js";
import ShipmentCharge from "../models/shipmentChargesModel.js";
import DeliveryTime from "../models/deliveryTimeModel.js";
import CargoWeightCharges from "../models/cargoWeightCharges.js";
import ConsignmentPickupCharges from "../models/consignmentPickupChargesModel.js";
import { createRequire } from "module";
import { QRGenerator, generatePDF } from "../routes/genericMethods.js";

const require = createRequire(import.meta.url);
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
import JsBarcode from "jsbarcode";
const { createCanvas } = require("canvas");
import express from "express";
import Templates from "../models/templatesModel.js";
import BusinessUsers from "../models/businessUsersModel.js";
import BussinessUserCredit from "../models/businessuserCreditsModel.js";
import LoadTrailerDropWarehouses from "../models/loadTrailerDropWarehouseModel.js";
import LoadTrailersVehicles from "../models/loadTrailersVehicleModel.js";
import LoadVehicleOrder from "../models/loadVehicleOrdersModel.js";
import CustomerOrderAddresses from "../models/customerOrderAddressesModel.js";
import NotificationsModel from "../models/notificationModel.js";

const request = require("request-promise");

const crypto = require("crypto");

const fetchOrder = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    let sort = {};
    var query = {
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
    };
    if (post.customerID !== "" && post.customerID !== undefined) {
      query.customerID = mongoose.Types.ObjectId(post.customerID);
    }
    if (post.orderType === "New") {
      query.$or = [
        { orderStatus: "New" },
        { orderStatus: "Draft" },
        {
          $and: [
            { orderStatus: "In Progress" },
            {
              $expr: {
                $and: [
                  { $ne: ["$orderJobs", null] },
                  { $in: ["$orderJobs.jobStatus", ["Job Rejected", "Job Cancelled"]] }
                ]
              }
            }
          ]
        }
      ]
    }
    else if (post.orderType === "inProgress") {
      query.$and = [
        { orderStatus: "In Progress" },
        {
          $or: [
            { orderJobs: { $exists: false } },
            { orderJobs: { $size: 0 } },
            {
              "orderJobs.jobStatus": {
                $in: ["Job Accepted", "Job Started", "Job Picked", "Job Reached", "Job Completed", "Job Assigned", "Job Received", "To be Dropped", "Driver Reached", "Job Dropped"]
              }
            }
          ]
        },
        {
          $or: [
            { orderJobs: { $exists: false } },
            { "orderJobs.jobStatus": { $nin: ["Job Rejected", "Job Cancelled"] } }
          ]
        }
      ]
    } else if (post.orderType === "Completed") query.orderStatus = "Completed"
    else if (post.orderType === "others") query.orderStats = { $in: ["Cancelled", "Pending"] }
    if (post.filterValues != undefined && post.filterValues != '') {
      query.$or = query.$or;
      let search = await generateSearchParameterList(post.searchParameterList, post.filterValues)
      query.$or = search;
    }
    const fetchQuery = [
      {
        $lookup: {
          from: "order_driver_jobs",
          localField: "_id",
          foreignField: "orderID",
          as: "orderJobs",
        },
      },
      {
        $unwind: {
          path: "$orderJobs",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          shipmentType: "$shipmentType",
          ID: "$_id",
          pickedDateTime: "$orderJobs.pickedDateTime",
          pickedDateTimeFormated: {
            $concat: [
              {
                $let: {
                  vars: {
                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    date: "$orderJobs.pickedDateTime" // Assuming this is your date field
                  },
                  in: {
                    $concat: [
                      {
                        $arrayElemAt: ['$$monthsInString', { $subtract: [{ $month: "$$date" }, 1] }]
                      },
                      " ",
                      {
                        $concat: [
                          {
                            $substr: [{ $dayOfMonth: "$$date" }, 0, -1]
                          },
                          ", ",
                          {
                            $dateToString: {
                              format: "%Y %H:%M:%S",
                              date: "$$date"
                            }
                          },
                          " ",
                          {
                            $cond: {
                              if: { $gte: [{ $hour: "$$date" }, 12] },
                              then: "PM",
                              else: "AM"
                            }
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            ]
          },
          droppedDateTime: "$orderJobs.droppedDateTime",
          droppedDateTimeFormated: {
            $concat: [
              {
                $let: {
                  vars: {
                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    date: "$orderJobs.droppedDateTime" // Assuming this is your date field
                  },
                  in: {
                    $concat: [
                      {
                        $arrayElemAt: ['$$monthsInString', { $subtract: [{ $month: "$$date" }, 1] }]
                      },
                      " ",
                      {
                        $concat: [
                          {
                            $substr: [{ $dayOfMonth: "$$date" }, 0, -1]
                          },
                          ", ",
                          {
                            $dateToString: {
                              format: "%Y %H:%M:%S",
                              date: "$$date"
                            }
                          },
                          " ",
                          {
                            $cond: {
                              if: { $gte: [{ $hour: "$$date" }, 12] },
                              then: "PM",
                              else: "AM"
                            }
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            ],

          },
          orderDateFormated: {
            $concat: [
              {
                $let: {
                  vars: {
                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    date: "$orderDate" // Assuming this is your date field
                  },
                  in: {
                    $concat: [
                      {
                        $arrayElemAt: ['$$monthsInString', { $subtract: [{ $month: "$$date" }, 1] }]
                      },
                      " ",
                      {
                        $concat: [
                          {
                            $substr: [{ $dayOfMonth: "$$date" }, 0, -1]
                          },
                          ", ",
                          {
                            $dateToString: {
                              format: "%Y %H:%M:%S",
                              date: "$$date"
                            }
                          },
                          " ",
                          {
                            $cond: {
                              if: { $gte: [{ $hour: "$$date" }, 12] },
                              then: "PM",
                              else: "AM"
                            }
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            ]
          },
          orderStatus: "$orderStatus",
          paymentStatus: "$paymentStatus",
          jobStatus: "$orderJobs.jobStatus",
        },
      },
      { $match: query },
    ];
    if (post.sortingType && post.sortingField) {
      var sortField = post.sortingField;
      sort[sortField] = post.sortingType;

      fetchQuery.push({ $sort: sort });
    } else {
      sort = { createdDate: -1 }
    }
    let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
    let myAggregation = Orders.aggregate()
    myAggregation._pipeline = fetchQuery
    Orders.aggregatePaginate(
      myAggregation,
      options,
      (err, result) => {
        if (err) {
          const errorResponse = genericResponse(false, "Unable to fetch", []);
          res.status(400).json(errorResponse);
        } else {
          // console.log("asdsad" , result)
          const successResponse = genericResponse(true, "Customer fetched successfully", result);
          res.status(200).json(successResponse);

        }
      }
    );
  } catch (error) {
    console.log("error fetchOrders====>", error.message)
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchOrder3 = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = {
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
    };
    // var queryJob = {};

    // if (post.orderStatus === "New") {
    //     query.orderStatus = { $in: ["New", "Draft"] }
    //     queryJob.jobStatus = { $in: ["Job Rejected", "Job Cancelled"] }

    // }
    // else if (post.orderStatus === "In Progress") {
    //     query.orderStatus = { $in: ["In Progress"] }
    //     queryJob.jobStatus = { $in: ["Job Assigned", "Job Started", "Job Accepted", "Job Picked", "Job Reached",] }

    // }
    // else if (post.orderStatus === "Completed") {
    //     query.orderStatus = { $in: ["In Progress"] }

    // } else if (post.orderStatus === "Others") {
    //     query.orderStatus = { $in: ["Pending"] }
    // }

    let fetchQuery = [
      { $match: query },
      {
        $lookup: {
          from: "order_driver_jobs",
          localField: "_id",
          foreignField: "orderID",
          as: "orderJobs",
        },
      },
      { $unwind: "$orderJobs" },
      {
        $addFields: {
          shipmentTypeAndID: {
            shipmentType: "$shipmentType",
            ID: "$_id",
            orderStatus: "$orderStatus",
            jobStatus: "$orderJobs.jobStatus",
          },
        },
      },
    ];
    const fetch = await Orders.aggregate(fetchQuery);
    var dateOptions = { month: "short", day: "2-digit", year: "numeric" };
    var timeOption = {
      timeZone: "UTC",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    };

    if (fetch.length > 0) {
      fetch.forEach((element) => {
        var upDate = element.orderDate.toLocaleDateString("en-US", dateOptions);
        var upTime = element.orderDate.toLocaleTimeString("en-US", timeOption);
        element.orderDate = upDate + " " + upTime;
      });
    }
    let successResponse = genericResponse(
      true,
      "Fetch Order Successfully!",
      fetch
    );
    res.status(200).json(successResponse);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchOrder2 = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = {
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
    };
    var queryJob = {};

    if (post.orderStatus === "New") {
      query.orderStatus = { $in: ["New", "Draft"] };
      queryJob.jobStatus = { $in: ["Job Rejected", "Job Cancelled"] };
    } else if (post.orderStatus === "In Progress") {
      query.orderStatus = { $in: ["In Progress"] };
      queryJob.jobStatus = {
        $in: [
          "Job Assigned",
          "Job Started",
          "Job Accepted",
          "Job Picked",
          "Job Reached",
        ],
      };
    } else if (post.orderStatus === "Completed") {
      query.orderStatus = { $in: ["In Progress"] };
    } else if (post.orderStatus === "Others") {
      query.orderStatus = { $in: ["Pending"] };
    }

    let fetchQuery = [
      { $match: query },
      {
        $lookup: {
          from: "order_driver_jobs",
          localField: "_id",
          foreignField: "orderID",
          pipeline: [
            {
              $match: { jobStatus: queryJob.jobStatus },
            },
          ],
          as: "orderJobs",
        },
      },
      { $unwind: "$orderJobs" },
      {
        $addFields: {
          shipmentTypeAndID: {
            shipmentType: "$shipmentType",
            ID: "$_id",
            orderStatus: "$orderStatus",
            // jobStatus: "$orderJobs.jobStatus"
          },
        },
      },
    ];
    const fetch = await Orders.aggregate(fetchQuery);
    var dateOptions = { month: "short", day: "2-digit", year: "numeric" };
    var timeOption = {
      timeZone: "UTC",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    };

    if (fetch.length > 0) {
      fetch.forEach((element) => {
        var upDate = element.orderDate.toLocaleDateString("en-US", dateOptions);
        var upTime = element.orderDate.toLocaleTimeString("en-US", timeOption);
        element.orderDate = upDate + " " + upTime;
      });
    }
    let successResponse = genericResponse(
      true,
      "Fetch Order Successfully!",
      fetch
    );
    res.status(200).json(successResponse);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchOrder1 = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    var query = {
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
    };

    if (post.orderStatus === "New") {
      query.orderStatus = { $in: ["New", "Draft", "In Progress", "Completed"] };
      query.jobStatus = {
        $in: [
          "Job Rejected",
          "Job Cancelled",
          "Job Assigned",
          "Job Started",
          "Job Accepted",
          "Job Picked",
          "Job Reached",
        ],
      };
    } else if (post.orderStatus === "In Progress") {
      query.orderStatus = { $in: ["In Progress"] };
      query.jobStatus = {
        $in: [
          "Job Assigned",
          "Job Started",
          "Job Accepted",
          "Job Picked",
          "Job Reached",
        ],
      };
    } else if (post.orderStatus === "Completed") {
      query.orderStatus = { $in: ["In Progress"] };
    } else if (post.orderStatus === "Others") {
      query.orderStatus = { $in: ["Pending"] };
    }

    // if (post.orderStatus === "New") {
    //     query.orderStatus = { $in: ["New", "Draft"] }
    //     query.jobStatus = { $in: ["New", "Draft", "Job Rejected", "Cancelled"] }

    // } else if (post.orderStatus === "In Progress") {
    //     query.orderStatus = { $in: ["In Progress", "Driver Assigned", "Job Assigned", "Job Accepted", "Delivered", "Completed"] }

    // } else if (post.orderStatus === "Completed") {
    //     query.orderStatus = ""

    // } else if (post.orderStatus === "Others") {
    //     query.orderStatus = { $in: ["Pending"] }
    // }

    // if (post.orderStatus === "New") {
    //     query.orderStatus = "New"

    // } else if (post.orderStatus === "In Progress") {
    //     query.orderStatus = { $in: ["Driver Assigned", "Job Accepted", "Delivered"] }

    // } else if (post.orderStatus === "Completed") {
    //     query.orderStatus = "Completed"

    // } else if (post.orderStatus === "Others") {
    //     query.orderStatus = { $in: ["Job Rejected", "Cancelled", "Pending"] }

    // }

    let fetchQuery = [
      {
        $lookup: {
          from: "order_driver_jobs",
          localField: "_id",
          foreignField: "orderID",
          as: "orderJobs",
        },
      },
      { $unwind: "$orderJobs" },
      {
        $project: {
          orderNumber: 1,
          orderDate: 1,
          shipmentType: 1,
          paymentType: 1,
          senderCity: 1,
          receiverCity: 1,
          jobStatus: "$orderJobs.jobStatus",
          totalCharges: 1,
          orderStatus: 1,
          shipmentTypeAndID: {
            shipmentType: "$shipmentType",
            ID: "$_id",
            orderStatus: "$orderStatus",
          },
        },
      },
      { $match: query },
    ];
    const fetch = await Orders.aggregate(fetchQuery);
    var dateOptions = { month: "short", day: "2-digit", year: "numeric" };
    var timeOption = {
      timeZone: "UTC",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    };

    if (fetch.length > 0) {
      fetch.forEach((element) => {
        var upDate = element.orderDate.toLocaleDateString("en-US", dateOptions);
        var upTime = element.orderDate.toLocaleTimeString("en-US", timeOption);
        element.orderDate = upDate + " " + upTime;
      });
    }

    let successResponse = genericResponse(
      true,
      "Fetch Order Successfully!",
      fetch
    );

    res.status(200).json(successResponse);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchOrderByID = asyncHandler(async (req, res) => {
  const post = req.body;

  try {
    const fetch = await Orders.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(post.id) } },
      {
        $lookup: {
          from: "order_items",
          localField: "_id",
          foreignField: "orderID",
          as: "items",
        },
      },
      { $unwind: "$items" },
      {
        $project: {
          shipmentType: "$shipmentType",
          paymentType: "$paymentType",
          businessUserID: "$businessUserID",
          customerID: "$customerID",
          totalCharges: "$totalCharges",
          variableCharges: "$variableCharges",
          fixedCharges: "$fixedCharges",
          receiverStateID: "$receiverStateID",
          receiverCountryID: "$receiverCountryID",
          selectUser: "$selectUser",
          orderNumber: "$orderNumber",
          orderStatus: "$orderStatus",
          orderDate: "$orderDate",
          senderName: "$senderName",
          senderContactNumber: "$senderContactNumber",
          senderStreetAddress: "$senderStreetAddress",
          senderZipCode: "$senderZipCode",
          senderCity: "$senderCity",
          totalCharges: "$totalCharges",
          receiverName: "$receiverName",
          receiverfirstName: "$receiverfirstName",
          receiverlastName: "$receiverlastName",
          receiverContactNumber: "$receiverContactNumber",
          receiverStreetAddress: "$receiverStreetAddress",
          receiverCity: "$receiverCity",
          receiverZipCode: "$receiverZipCode",
          orderID: "$_id",
          _id: "$items._id",
          cargoType: "$items.cargoType",
          numberOfItems: "$items.numberOfItems",
          cargoTemperature: "$items.cargoTemperature",
          lengthInMm: "$items.lengthInMm",
          breadthInMm: "$items.breadthInMm",
          heightInMm: "$items.heightInMm",
          weightInKg: "$items.weightInKg",
          description: "$items.description",
          itemStatus: "$items.itemStatus",
          orderItemID: "$items._id",
          itemVariableCharge: "$items.itemVariableCharge",
          receivedQty: "$items.receivedQty",
          startWarehouseID: "$startWarehouseID",
          paymentStatus: "$paymentStatus"
        },
      },
    ]);

    if (fetch.length > 0) {
      let dateOptions = { month: "short", day: "2-digit", year: "numeric" };
      let timeOption = {
        timeZone: "UTC",
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      };
      fetch.forEach((element) => {
        let upDate = element.orderDate.toLocaleDateString("en-US", dateOptions);
        element.orderDate = upDate;
        // let upTime = element.orderDate.toLocaleTimeString("en-US", timeOption);
        // element.orderDate = (upDate + ' ' + upTime);
      });
      return res
        .status(200)
        .json(genericResponse(true, "order details fetched", fetch));
    } else {
      return res
        .status(202)
        .json(genericResponse(false, `Not fetch Order details`));
    }
  } catch (error) {
    console.log("error===>", error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchDriver = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { businessUserID: post.businessUserID, department: "Driver" };
    const fetch = await Employee.find(query);
    let successResponse = genericResponse(
      true,
      "Driver List Successfully!",
      fetch
    );
    res.status(200).json(successResponse);
  } catch (error) {
    let errorResponse = genericResponse(true, error.message, []);
    res.status(200).json(errorResponse);
  }
});

const fetchDropLocation = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { businessUserID: post.businessUserID };
    const fetch = await Warehouse.find(query);
    let successResponse = genericResponse(
      true,
      "Warehouse List Successfully!",
      fetch
    );
    res.status(200).json(successResponse);
  } catch (error) {
    let errorResponse = genericResponse(true, error.message, []);
    res.status(200).json(errorResponse);
  }
});

const assignJobToDriver = asyncHandler(async (req, res) => {
  try {
    const post = req.body;

    let jobNumber = 0;
    let fetchOrder = await Orders.find({
      _id: mongoose.Types.ObjectId(post.orderID),
    });
    if (
      fetchOrder[0].chargeCreditFlag === 0 ||
      fetchOrder[0].chargeCreditFlag === "" ||
      fetchOrder[0].chargeCreditFlag === undefined
    ) {
      let fetchCredit = [
        {
          $match: {
            _id: mongoose.Types.ObjectId(post.businessUserID),
          },
        },

        {
          $lookup: {
            from: "business_user_plans",
            localField: "_id",
            foreignField: "businessUserID",
            as: "businessUserPlans",
            pipeline: [
              {
                $sort: { _id: -1 },
              },
              {
                $limit: 1,
              },
            ],
          },
        },
        { $unwind: "$businessUserPlans" },

        {
          $lookup: {
            from: "plan_features",
            localField: "businessUserPlans.planID",
            foreignField: "planID",
            as: "planFeatures",
          },
        },
        { $unwind: "$planFeatures" },

        {
          $lookup: {
            from: "standard_features",
            localField: "planFeatures.featureID",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  featureCode: "CUPCB",
                },
              },
            ],
            as: "standardFeatures",
          },
        },
        { $unwind: "$standardFeatures" },

        {
          $project: {
            availableCredits: 1,
            featureCount: "$planFeatures.featureCount",
          },
        },
      ];

      const fetchFeature = await BusinessUsers.aggregate(fetchCredit);

      if (fetchFeature[0].availableCredits < fetchFeature[0].featureCount) {
        let successResponse = genericResponse(
          true,
          "Available Credits are Insufficient",
          []
        );
        res.status(201).json(successResponse);
        return;
      }
      post.transactionDescription = "Order Placed";
      post.transactionDateTime = new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      );
      post.creditsBalance =
        fetchFeature[0].availableCredits - fetchFeature[0].featureCount;
      post.creditsUsed = fetchFeature[0].featureCount;
      post.creditsPurchased = 0;
      post.createdDate = new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      ).setUTCHours(23, 59, 59, 999);
      await new BussinessUserCredit(post).save();
      await BusinessUsers.updateOne(
        { _id: mongoose.Types.ObjectId(post.businessUserID) },
        { $set: { availableCredits: post.creditsBalance } }
      );
    }

    if (post.senderWarehouseID !== undefined && post.senderWarehouseID !== "") {

    } else {
      (post.pickupContactName = fetchOrder[0].senderName),
        (post.pickupContactNumber = fetchOrder[0].senderContactNumber),
        (post.pickupStreetAddress = fetchOrder[0].senderStreetAddress),
        (post.pickupCity = fetchOrder[0].senderCity),
        (post.pickupZipCode = fetchOrder[0].senderZipCode),
        (post.pickupCountryID = fetchOrder[0].senderCountryID),
        (post.pickupStateID = fetchOrder[0].senderStateID),
        (post.orderNumber = fetchOrder[0].orderNumber),
        (post.jobStatus = "Job Assigned"),
        (post.jobNotes = post.notes),
        (post.createdDate = new Date(
          new Date() - new Date().getTimezoneOffset() * 60000
        )),
        (post.recordType = "I"),
        (post.assignedDriverDateTime = new Date(
          new Date() - new Date().getTimezoneOffset() * 60000
        ));
    }
    if (post.dropWarehouseID !== undefined && post.dropWarehouseID !== "") {
      let fetchWarehouse = await Warehouse.find({
        _id: mongoose.Types.ObjectId(post.dropWarehouseID),
      });
      (post.dropContactName = fetchWarehouse[0].warehouseName),
        (post.dropStreetAddress = fetchWarehouse[0].streetAddress),
        (post.dropCity = fetchWarehouse[0].city),
        (post.dropZipCode = fetchWarehouse[0].zipCode),
        (post.dropCountryID = fetchWarehouse[0].countryId),
        (post.dropStateID = fetchWarehouse[0].stateId),
        (post.createdDate = new Date(
          new Date() - new Date().getTimezoneOffset() * 60000
        )),
        (post.recordType = "I");
    } else {
      (post.dropContactName = fetchOrder[0].receiverName),
        (post.dropContactNumber = fetchOrder[0].receiverContactNumber),
        (post.dropStreetAddress = fetchOrder[0].receiverStreetAddress),
        (post.dropCity = fetchOrder[0].receiverCity),
        (post.dropZipCode = fetchOrder[0].receiverZipCode),
        (post.dropCountryID = fetchOrder[0].receiverCountryID),
        (post.dropStateID = fetchOrder[0].receiverStateID);
    }

    let fetchJob = await OrderDriverJob.find({
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
    })
      .sort({ _id: -1 })
      .limit(1);
    if (fetchJob.length > 0) {
      jobNumber = fetchJob[0].jobNumber + 1;
    } else {
      jobNumber += 1;
    }

    post.businessUserID = post.businessUserID;
    (post.jobNumber = jobNumber), delete post._id;
    const orderJobLog = new OrderDriverJob(post);

    const insertOrderJob = await orderJobLog.save();

    let fetchJobByOrder = await OrderDriverJob.find({
      orderID: mongoose.Types.ObjectId(post.orderID),
    });


    if (fetchJobByOrder.length > 0) {
      const fetchUser = await Employee.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(fetchJobByOrder[0].assignedDriverID),
          },
        },
        {
          $project: {
            fullName: { $concat: ["$firstName", " ", "$lastName"] },
            _id: 1,
            pushNotificationID: 1,
          },
        },
      ]);

      if (fetchUser.length > 0 && fetchUser[0].pushNotificationID) {
        await appNotification(
          [fetchUser[0].pushNotificationID],
          "New Job #" + fetchJobByOrder[0].jobNumber,
          "You have been assigned a new Job number is " +
          fetchJobByOrder[0].jobNumber +
          ".",
          999999
        );

        let add = {};
        add.notificationID = 999999;
        add.userID = fetchUser[0]._id;
        add.shortText = "New Job #" + fetchJobByOrder[0].jobNumber;
        add.longText =
          "You have been assigned a new Job number is " +
          fetchJobByOrder[0].jobNumber +
          ".";
        add.notificationStatus = "SENT";
        add.isSelected = false;
        add.sentDateTime = new Date(
          new Date() - new Date().getTimezoneOffset() * 60000
        );
        add.createdDate = new Date(
          new Date() - new Date().getTimezoneOffset() * 60000
        );
        const notification = new NotificationsModel(add);
        await notification.save();
      }
    }

    const dataOrder = {
      orderID: post.orderID,
      orderDriverJobID: orderJobLog._id,
      assignedDriverID: orderJobLog.assignedDriverID,
      statusDateTime: new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      ),
      orderStatus: "Job Assigned",
      createdDate: new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      ),
      recordType: "I",
    };
    const orderLog = new OrderStatusLogs(dataOrder);
    const insertResultOrder1 = await orderLog.save();

    const query = { _id: mongoose.Types.ObjectId(post.orderID) };
    const newValues = {
      $set: {
        lastModifiedDate: new Date(
          new Date() - new Date().getTimezoneOffset() * 60000
        ),
        recordType: "U",
        orderStatus: "In Progress",
      },
    };
    const order = await Orders.updateOne(query, newValues);
    let successResponse = genericResponse(true, "Job Successfully!", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in assignJobToDriver=", error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchCustomerBybusinessID = asyncHandler(async (req, res) => {
  try {
    const post = req.body;

    const fetch = await Customer.find({
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
    });
    let successResponse = genericResponse(
      true,
      "fetchCustomerBybusinessID fetched successfully.",
      fetch
    );
    res.status(201).json(successResponse);
  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const fetchCustomerDetailsById = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const fetch = await Customer.find({
      _id: mongoose.Types.ObjectId(post.customerID),
    });

    let successResponse = genericResponse(
      true,
      "fetchCustomerDetailsById fetched successfully.",
      fetch
    );
    res.status(201).json(successResponse);
  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

// const addOrder = asyncHandler(async (req, res) => {
//     try {
//         const post = req.body;
//         post._id = undefined
//         console.log("post", post)
//         let customerID;
//         if (post.selectUser === "New") {
//             console.log("selectUser", post.selectUser);
//             let addCust = {};

//             const customer = await stripe.customers.create({
//                 name: post.firstName + " " + post.lastName,
//                 email: post.emailAddress,
//             });
//             addCust.gatewayUserID = customer.id
//             post.gatewayUserID = customer.id
//             addCust.customerType = post.customerType;
//             addCust.businessName = post.businessName;
//             addCust.businessID = post.businessID;
//             addCust.firstName = post.firstName;
//             addCust.lastName = post.lastName;
//             addCust.phoneNumber = post.phoneNumber;
//             addCust.emailAddress = post.emailAddress;
//             addCust.streetAddress = post.streetAddress;
//             addCust.city = post.city;
//             addCust.zipCode = post.zipCode;
//             addCust.countryId = post.countryId;
//             addCust.stateId = post.stateId;
//             addCust.paymentType = post.paymentType;
//             addCust.accountNumber = post.accountNumber;
//             addCust.businessUserID = post.businessUserID;
//             addCust.customerStatus = "Active";
//             addCust.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
//                 addCust.recordType = 'I'
//             const addCustomer = new Customer(addCust);
//             const added = await addCustomer.save();
//             console.log("AddCustomer", addCustomer._id)
//             customerID = addCustomer._id;

//         }
//         else if (post.selectUser === "Existing") {
//             console.log("post.customerID", post.customerID)
//             customerID = post.customerID
//             const customerData = await Customer.find({ _id: mongoose.Types.ObjectId(post.customerID) })
//             post.gatewayUserID = customerData[0].gatewayUserID
//         }
//         console.log("customerID", customerID)

//         if (customerID !== undefined && customerID !== "") {
//             post.orderNumber = await generateSequenceValue('orderNumber', post.businessUserID);
//             // post.orderNumber = await getNextSequenceValueforOrder('orderNumber', customerID);
//             post.orderDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//             post.senderName = post.firstName + ' ' + post.lastName;
//             post.senderContactNumber = post.phoneNumber
//             post.emailAddress = post.emailAddress
//             post.senderStreetAddress = post.streetAddress
//             post.senderZipCode = post.zipCode
//             post.senderCity = post.city
//             post.senderCountryID = post.countryId
//             post.senderStateID = post.stateId
//             post.senderLocationLatitude = post.customerLocationLatitude
//             post.senderLocationLongitude = post.customerLocationLongitude
//             post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//             post.recordType = "I";
//             post.orderStatus = "Draft"
//             post.receiverName = post.receiverfirstName + ' ' + post.receiverlastName;
//             post.customerID = customerID

//             const newOrder = await new Orders(post).save();
//             console.log("newOrder", newOrder)
//             let successResponse = genericResponse(true, "Order added successfully.", {
//                 orderID: newOrder._id,
//                 orderNumber: post.orderNumber,
//                 orderStatus: post.orderStatus
//             });
//             res.status(201).json(successResponse);
//             return;
//         } else {
//             const errorResponse = genericResponse(false, "Customer is not Available", []);
//             res.status(200).json(errorResponse);
//             return;
//         }
//     } catch (error) {
//         console.log(error);
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(200).json(errorRespnse);
//     }

// });
const addOrder = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const senderAddress = await CustomerOrderAddresses.findById({
      _id: mongoose.Types.ObjectId(post.senderAddressID),
    });
    const reciverAddress = await CustomerOrderAddresses.findById({
      _id: mongoose.Types.ObjectId(post.receiverAddressID),
    });
    const customerData = await Customer.findById({
      _id: mongoose.Types.ObjectId(post.customerID),
    });
    if (post.pickupWarehouseID === "") {
      post.pickupWarehouseID = undefined;
    }
    post.orderNumber = await generateSequenceValue(
      "orderNumber",
      post.businessUserID
    );
    post.orderDate = new Date(
      new Date() - new Date().getTimezoneOffset() * 60000
    );
    post.paymentType = customerData.paymentType;
    post.senderName = senderAddress.contactName;
    post.senderContactNumber = senderAddress.phoneNumber;
    post.emailAddress = post.emailAddress;
    post.senderStreetAddress = senderAddress.streetAddress;
    post.senderZipCode = senderAddress.zipCode;
    post.senderCity = senderAddress.city;
    post.senderCountryID = senderAddress.countryId;
    post.senderStateID = senderAddress.stateId;
    post.senderLocationLatitude = senderAddress.locationLatitude;
    post.senderLocationLongitude = senderAddress.locationLongitude;
    post.createdDate = new Date(
      new Date() - new Date().getTimezoneOffset() * 60000
    );
    post.recordType = "I";
    post.orderStatus = "Draft";
    post.receiverName = reciverAddress.contactName;
    post.customerID = post.customerID;
    post.receiverStreetAddress = reciverAddress.streetAddress;
    post.receiverLocationLatitude = reciverAddress.locationLatitude;
    post.receiverLocationLongitude = reciverAddress.locationLongitude;
    post.receiverCity = reciverAddress.city;
    post.receiverZipCode = reciverAddress.zipCode;
    post.receiverContactNumber = reciverAddress.phoneNumber;
    post.receiverStateID = reciverAddress.stateId;
    post.receiverCountryID = reciverAddress.countryId;
    const newOrder = await new Orders(post).save();
    if (newOrder._id !== undefined) {
      post.orderID = newOrder._id;
      const orderitems = await new OrderItems(post).save();
      const hash = crypto
        .createHash("sha256")
        .update(orderitems._id.toString())
        .digest("hex");
      const base64Value = Buffer.from(hash, "hex").toString("base64");
      const alphaNumericCode = base64Value.replace(/[^a-zA-Z0-9]/g, "");
      const encryptedCode = (alphaNumericCode + "0000000000")
        .slice(0, 10)
        .toUpperCase();
      await OrderItems.updateOne(
        { _id: mongoose.Types.ObjectId(orderitems._id) },
        { $set: { barCodeID: encryptedCode } }
      );
      let successResponse = genericResponse(true, "Order added successfully.", {
        orderID: newOrder._id,
        orderNumber: post.orderNumber,
        orderStatus: post.orderStatus,
      });
      res.status(201).json(successResponse);
      return;
    }
  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const fetchWarehouseByID = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const fetch = await Warehouse.find({
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
      warehouseStatus: "Active",
    });
    let successResponse = genericResponse(
      true,
      " fetchWarehouseByName fetched successfully.",
      fetch
    );
    res.status(201).json(successResponse);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const addOrderItems = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    delete post._id;
    if (post.pickupWarehouseID === "" || post.pickupWarehouseID === undefined || post.pickupWarehouseID === null) post.pickupWarehouseID = undefined
    if (post.orderID !== "" && post.orderID !== undefined) {
      await Orders.updateOne({ _id: mongoose.Types.ObjectId(post.orderID) }, { $set: post })
      const orderitems = await new OrderItems(post).save();
      const hash = crypto
        .createHash("sha256")
        .update(orderitems._id.toString())
        .digest("hex");
      const base64Value = Buffer.from(hash, "hex").toString("base64");
      const alphaNumericCode = base64Value.replace(/[^a-zA-Z0-9]/g, "");
      const encryptedCode = (alphaNumericCode + "0000000000")
        .slice(0, 10)
        .toUpperCase();
      await OrderItems.updateOne(
        { _id: mongoose.Types.ObjectId(orderitems._id) },
        { $set: { barCodeID: encryptedCode } }
      );
      let successResponse = genericResponse(
        true,
        "Order added successfully.",
        orderitems
      );
      res.status(201).json(successResponse);
      return;
    } else {
      const errorResponse = genericResponse(
        false,
        "Please Add Order details Firstly",
        []
      );
      res.status(200).json(errorResponse);
      return;
    }
  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const fetchOrderItems = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (post.orderID !== "" && post.orderID !== undefined) {
      const fetchorderitems = await OrderItems.find({
        orderID: mongoose.Types.ObjectId(post.orderID),
      });
      let successResponse = genericResponse(
        true,
        "Order added successfully.",
        fetchorderitems
      );
      res.status(201).json(successResponse);
    } else {
      const errorResponse = genericResponse(false, "Invalid orderID !", []);
      res.status(200).json(errorResponse);
      return;
    }
  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const orderStatusUpdate = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (post.orderStatus === "Draft") {
      post.createdDate = new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      );
      var query = { _id: mongoose.Types.ObjectId(post.orderID) };
      const fetchOrder = await Orders.find(query);
      if (fetchOrder[0].shipmentType === "drop at Warehouse") {
        post.orderStatus = "In Progress";
      } else {
        post.orderStatus = "New";
      }

      post.lastModifiedDate = new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      );
      post.recordType = "U";
      post.chargeCreditFlag = 1;
      var newValues = { $set: post };
      let fetchCredit = [
        {
          $match: {
            _id: mongoose.Types.ObjectId(post.businessUserID),
          },
        },

        {
          $lookup: {
            from: "business_user_plans",
            localField: "_id",
            foreignField: "businessUserID",
            as: "businessUserPlans",
            pipeline: [
              {
                $sort: { _id: -1 },
              },
              {
                $limit: 1,
              },
            ],
          },
        },
        { $unwind: "$businessUserPlans" },

        {
          $lookup: {
            from: "plan_features",
            localField: "businessUserPlans.planID",
            foreignField: "planID",
            as: "planFeatures",
          },
        },
        { $unwind: "$planFeatures" },

        {
          $lookup: {
            from: "standard_features",
            localField: "planFeatures.featureID",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  featureCode: "CUPCB",
                },
              },
            ],
            as: "standardFeatures",
          },
        },
        { $unwind: "$standardFeatures" },

        {
          $project: {
            availableCredits: 1,
            featureCount: "$planFeatures.featureCount",
          },
        },
      ];

      const fetchFeature = await BusinessUsers.aggregate(fetchCredit);

      if (fetchFeature[0].availableCredits < fetchFeature[0].featureCount) {
        let successResponse = genericResponse(
          true,
          "Available Credits are Insufficient",
          []
        );
        res.status(201).json(successResponse);
        return;
      }

      post.transactionDescription = "Order Placed";
      post.transactionDateTime = new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      );
      post.creditsBalance =
        fetchFeature[0].availableCredits - fetchFeature[0].featureCount;
      post.creditsUsed = fetchFeature[0].featureCount;
      post.creditsPurchased = 0;
      await new BussinessUserCredit(post).save();
      await BusinessUsers.updateOne(
        { _id: mongoose.Types.ObjectId(post.businessUserID) },
        { $set: { availableCredits: post.creditsBalance } }
      );
      const order = await Orders.updateMany(query, newValues);




      let dataTrack = {};
      dataTrack.orderID = post.orderID;
      dataTrack.statusDateTime = new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      );
      dataTrack.trackStatus = "Order Booked";
      dataTrack.createdDate = new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      );
      dataTrack.recordType = "I";
      const trackLog = new TrackStatusLogs(dataTrack);
      const insertResultTrack = await trackLog.save();
      let dataOrder = {};
      dataOrder.orderID = post.orderID;
      dataOrder.statusDateTime = new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      );

      dataOrder.createdDate = new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      );
      dataOrder.recordType = "I";


      dataOrder.orderStatus = post.orderStatus
      if (fetchOrder[0].shipmentType === "drop at Warehouse") {
        (post.jobStatus = "To be Dropped"),
          (post.pickupContactName = fetchOrder[0].senderName),
          (post.pickupContactNumber = fetchOrder[0].senderContactNumber),
          (post.pickupStreetAddress = fetchOrder[0].senderStreetAddress),
          (post.pickupCity = fetchOrder[0].senderCity),
          (post.pickupZipCode = fetchOrder[0].senderZipCode),
          (post.pickupCountryID = fetchOrder[0].senderCountryID),
          (post.pickupStateID = fetchOrder[0].senderStateID),
          (post.orderNumber = fetchOrder[0].orderNumber),
          (post.jobNotes = post.notes),
          (post.createdDate = new Date(
            new Date() - new Date().getTimezoneOffset() * 60000
          )),
          (post.recordType = "I"),
          (post.assignedDriverDateTime = new Date(
            new Date() - new Date().getTimezoneOffset() * 60000
          ));
        if (
          fetchOrder[0].pickupWarehouseID !== undefined &&
          fetchOrder[0].pickupWarehouseID !== ""
        ) {
          let fetchWarehouse = await Warehouse.find({
            _id: mongoose.Types.ObjectId(fetchOrder[0].pickupWarehouseID),
          });
          post.dropWarehouseID = fetchOrder[0].pickupWarehouseID;
          (post.dropContactName = fetchWarehouse[0].warehouseName),
            (post.dropStreetAddress = fetchWarehouse[0].streetAddress),
            (post.dropCity = fetchWarehouse[0].city),
            (post.dropZipCode = fetchWarehouse[0].zipCode),
            (post.dropCountryID = fetchWarehouse[0].countryId),
            (post.dropStateID = fetchWarehouse[0].stateId),
            (post.createdDate = new Date(
              new Date() - new Date().getTimezoneOffset() * 60000
            )),
            (post.recordType = "I");
        }
        let jobNumber = 0;
        let fetchJob = await OrderDriverJob.find({
          businessUserID: mongoose.Types.ObjectId(post.businessUserID),
        })
          .sort({ _id: -1 })
          .limit(1);
        if (fetchJob.length > 0) {
          jobNumber = fetchJob[0].jobNumber + 1;
        } else {
          jobNumber += 1;
        }

        post.businessUserID = post.businessUserID;
        (post.jobNumber = jobNumber), delete post._id;
        const orderJobLog = new OrderDriverJob(post);

        const insertOrderJob = await orderJobLog.save();
      }
      dataOrder.createdDate = new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      );
      const orderLog = new OrderStatusLogs(dataOrder);
      const insertResultOrder = await orderLog.save();
      if (order !== null) {
        let successResponse = genericResponse(
          true,
          "Order added successfully.",
          {}
        );
        res.status(201).json(successResponse);
        return;
      }
    } else {
      const errorResponse = genericResponse(false, "Payment Failed", []);
      res.status(200).json(errorResponse);
      return;
    }
  } catch (error) {
    console.log(error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const editOrderforfinalbyId = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const fetchFinal = await Orders.findById({
      _id: mongoose.Types.ObjectId(post.orderID),
    });

    if (fetchFinal !== null) {
      const receiverName = fetchFinal.receiverName;
      const [receiverfirstName, receiverlastName] = receiverName.split(" ");

      fetchFinal.receiverfirstName = receiverfirstName;
      fetchFinal.receiverlastName = receiverlastName;
      await fetchFinal.save();

      // Dynamically add receiverfirstName and receiverlastName to the fetchFinal object
      fetchFinal.receiverfirstName = receiverfirstName;
      fetchFinal.receiverlastName = receiverlastName;

      let successResponse = genericResponse(
        true,
        "editOrderforfinalbyId fetched successfully.",

        fetchFinal
      );
      res.status(201).json(successResponse);
    } else {
      let errorRespnse = genericResponse(false, "Order not found.", []);
      res.status(404).json(errorRespnse);
    }
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const editOrderItemsforfinalbyId = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const fetchItems = await OrderItems.find({
      orderID: mongoose.Types.ObjectId(post.orderID),
    });

    if (fetchItems !== null) {
      let successResponse = genericResponse(
        true,
        "editOrderItemsforfinalbyId fetched successfully.",

        fetchItems
      );
      res.status(201).json(successResponse);
    } else {
      let errorRespnse = genericResponse(false, "OrderItems not found.", []);
      res.status(404).json(errorRespnse);
    }
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

// const updateOrderDetails = asyncHandler(async (req, res) => {
//     try {
//         const post = req.body;
//         var query = { _id: mongoose.Types.ObjectId(post._id) };
//         console.log("query", query);
//         post.senderName = post.firstName + ' ' + post.lastName;
//         post.senderContactNumber = post.phoneNumber
//         post.senderStreetAddress = post.streetAddress
//         post.senderZipCode = post.zipCode
//         post.senderCity = post.city
//         post.senderCountryID = post.countryId
//         post.senderStateID = post.stateId
//         post.senderLocationLatitude = post.customerLocationLatitude
//         post.senderLocationLongitude = post.customerLocationLongitude
//         post.orderStatus = "Draft"
//         post.receiverName = post.receiverfirstName + ' ' + post.receiverlastName;
//         post.recordType = 'U';
//         post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//         var newValues = { $set: post }
//         const updateParameter = await Orders.updateMany(query, newValues);
//         const fetchUpdateOrders = await Orders.findById(query)
//         console.log("fetchUpdateOrders", fetchUpdateOrders)
//         let successResponse = genericResponse(true, "updateDeliveryTime  updated successfully.", fetchUpdateOrders);
//         res.status(200).json(successResponse);

//     } catch (error) {
//         console.log("error", error.message)
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(400).json(errorRespnse);
//     }
// });

const updateOrderDetails = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const senderAddress = await CustomerOrderAddresses.findById({
      _id: mongoose.Types.ObjectId(post.senderAddressID),
    });
    const reciverAddress = await CustomerOrderAddresses.findById({
      _id: mongoose.Types.ObjectId(post.receiverAddressID),
    });
    const customerData = await Customer.findById({
      _id: mongoose.Types.ObjectId(post.customerID),
    });

    var query = { _id: mongoose.Types.ObjectId(post._id) };
    if (post.pickupWarehouseID === "") {
      post.pickupWarehouseID = undefined;
    }
    post.paymentType = customerData.paymentType;
    post.senderName = senderAddress.contactName;
    post.senderContactNumber = senderAddress.phoneNumber;
    post.emailAddress = post.emailAddress;
    post.senderStreetAddress = senderAddress.streetAddress;
    post.senderZipCode = senderAddress.zipCode;
    post.senderCity = senderAddress.city;
    post.senderCountryID = senderAddress.countryId;
    post.senderStateID = senderAddress.stateId;
    post.senderLocationLatitude = senderAddress.locationLatitude;
    post.senderLocationLongitude = senderAddress.locationLongitude;
    post.receiverName = reciverAddress.contactName;
    post.customerID = post.customerID;
    post.receiverStreetAddress = reciverAddress.streetAddress;
    post.receiverLocationLatitude = reciverAddress.locationLatitude;
    post.receiverLocationLongitude = reciverAddress.locationLongitude;
    post.receiverCity = reciverAddress.city;
    post.receiverZipCode = reciverAddress.zipCode;
    post.receiverContactNumber = reciverAddress.phoneNumber;
    post.receiverStateID = reciverAddress.stateId;
    post.receiverCountryID = reciverAddress.countryId;
    const updateParameter = await Orders.updateOne(query, { $set: post });
    const fetchUpdateOrders = await Orders.findById(query);
    let successResponse = genericResponse(
      true,
      "updateDeliveryTime  updated successfully.",
      fetchUpdateOrders
    );
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error", error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});
const fetchOrderStatusLog = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post.orderID) };
    const fetchQuery = [
      { $match: query },
      {
        $lookup: {
          from: "order_driver_jobs",
          localField: "_id",
          foreignField: "orderID",
          as: "orderJobs",
        },
      },
      {
        $unwind: {
          path: "$orderJobs",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    const fetch = await Orders.aggregate(fetchQuery);

    let successResponse = genericResponse(true, "List Successfully!", fetch);
    res.status(200).json(successResponse);
  } catch (error) {
    let errorResponse = genericResponse(true, error.message, []);
    res.status(200).json(errorResponse);
  }
});

const reAssignDriver = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    let data = {};

    data.assignedDriverID = post.assignedDriverID;
    data.jobStatus = "Job Assigned";
    data.jobNotes = post.notes;
    let query11 = { orderID: mongoose.Types.ObjectId(post.orderID) };
    var newValues1 = { $set: data };
    const updateOrder = await OrderDriverJob.updateMany(query11, newValues1);
    let fetchOrderJob = await OrderDriverJob.find(query11);

    const dataOrder = {
      orderID: post.orderID,
      statusNotes: post.notes,
      orderDriverJobID: fetchOrderJob[0]._id,
      assignedDriverID: post.assignedDriverID,
      statusDateTime: new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      ),
      orderStatus: "Job Assigned",
      createdDate: new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      ),
      recordType: "I",
    };
    const orderLog = new OrderStatusLogs(dataOrder);
    const insertResultOrder1 = await orderLog.save();

    const query = { _id: mongoose.Types.ObjectId(post.orderID) };
    const newValues = {
      $set: {
        lastModifiedDate: new Date(
          new Date() - new Date().getTimezoneOffset() * 60000
        ),
        recordType: "U",
        orderStatus: "In Progress",
      },
    };
    const order = await Orders.updateOne(query, newValues);
    let successResponse = genericResponse(true, "Job Successfully!", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in reAssignDriver=", error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const deleteOrderItems = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("deleteOrderItems", post);
    const query = { _id: mongoose.Types.ObjectId(post.id) };
    if (post.id != undefined && post.id != "") {
      await OrderItems.deleteOne(query);
      res
        .status(201)
        .json(genericResponse(true, "OrderItems deleted sucessfully", []));
    } else
      res
        .status(400)
        .json(genericResponse(false, "OrderItems is  not found", []));
  } catch (error) {
    res.status(400).json(genericResponse(false, error.message, []));
  }
});

const fetchOrderItemsByID = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (post.id !== "" && post.id !== undefined) {
      const fetchorderitems = await OrderItems.findById({
        _id: mongoose.Types.ObjectId(post.id),
      });
      let successResponse = genericResponse(
        true,
        "fetchOrderItemsByID  successfully.",
        fetchorderitems
      );
      res.status(201).json(successResponse);
    } else {
      const errorResponse = genericResponse(false, "Invalid orderID !", []);
      res.status(200).json(errorResponse);
      return;
    }
  } catch (error) {
    console.log(error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const updateOrderItems = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post._id) };
    post.recordType = "U";
    post.lastModifiedDate = new Date(
      new Date() - new Date().getTimezoneOffset() * 60000
    );
    var newValues = { $set: post };
    const update = await OrderItems.updateMany(query, newValues);

    let successResponse = genericResponse(
      true,
      "Warehouse  updated successfully.",
      update
    );
    res.status(200).json(successResponse);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const getOrderCharges = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    let fetchOrder = await Orders.find({
      _id: mongoose.Types.ObjectId(post.orderID),
    });
    let fetchOrderItems = await OrderItems.find({
      orderID: mongoose.Types.ObjectId(post.orderID),
    });
    let businessUserID = fetchOrder[0].businessUserID;
    const receiverLocationLatitude = fetchOrder[0].receiverLocationLatitude;
    const receiverLocationLongitude = fetchOrder[0].receiverLocationLongitude;
    const senderLocationLatitude = fetchOrder[0].senderLocationLatitude;
    const senderLocationLongitude = fetchOrder[0].senderLocationLongitude;
    let warehouseList = await getWarehouse(
      senderLocationLatitude,
      senderLocationLongitude,
      post.businessUserID,
      fetchOrder[0].senderCity
    );
    if (warehouseList === "" || warehouseList === undefined) {
      let successResponse = genericResponse(
        false,
        "No Warehouse Located In Your City!",
        []
      );
      res.status(201).json(successResponse);
      return;
    }
    if (businessUserID !== "" && businessUserID !== undefined) {
      var unit = "metric";
      var originAPI =
        "https://maps.googleapis.com/maps/api/directions/json?origin=" +
        senderLocationLatitude +
        ", " +
        senderLocationLongitude +
        "&destination=" +
        receiverLocationLatitude +
        ", " +
        receiverLocationLongitude +
        "&units=" +
        unit +
        "&key=AIzaSyCNe-x9Jn_2903j9PxhLPw6SPGXMwIlkCM";

      const options = {
        method: "POST",
        uri: originAPI,
        body: req.body,
        json: true,
      };
      const response = await request(options);
      if (response.status === 'ZERO_RESULTS') {
        let errorRespnse = genericResponse(false, "No Route for this Address Kindly Change..", []);
        res.status(200).json(errorRespnse)
        return;
      }
      const totalDist = response.routes[0].legs[0].distance.value;
      const totalDistance = totalDist / 1000;
      const [pickupCharges, deliveryTimeEst, distanceTable] = await Promise.all([
        await ConsignmentPickupCharges.find({
          businessUserID: businessUserID,
          cpcFromDistance: { $lte: warehouseList.distance },
          cpcToDistance: { $gte: warehouseList.distance },
        }),

        await DeliveryTime.find({
          businessUserID: businessUserID,
          fromDistance: { $lte: parseInt(totalDistance) },
          toDistance: { $gte: parseInt(totalDistance) },
        }),
        await CargoWeightCharges.find({
          businessUserID: businessUserID,
          cwcFromDistance: { $lte: totalDistance },
          cwcToDistance: { $gte: totalDistance },
        })
      ])
      if (pickupCharges.length === 0) {
        let successResponse = genericResponse(false, "Something Went Wrong!", []);
        res.status(201).json(successResponse);
        return;
      }

      if (deliveryTimeEst.length === 0) {
        let successResponse = genericResponse(
          false,
          "Something Went Wrong!",
          []
        );
        res.status(201).json(successResponse);
        return;
      }
      if (distanceTable.length === 0) {
        let successResponse = genericResponse(
          false,
          "Something Went Wrong!",
          []
        );
        res.status(201).json(successResponse);
        return;
      }
      let orderVariableCharges = 0;
      let pickUpChargeAmount = 0;
      let shipmentCharegeAmount = 0;

      for (let data of fetchOrderItems) {
        let finalWeight;
        const cargoWeight = data.weightInKg * data.numberOfItems;
        const itemVolume =
          ((data.lengthInMm * data.breadthInMm * data.heightInMm) / 1000000000) *
          data.numberOfItems *
          333;
        if (itemVolume > cargoWeight) finalWeight = itemVolume;
        else finalWeight = cargoWeight;
        shipmentCharegeAmount +=
          finalWeight * distanceTable[0].cwcCargoWeightCharges;
        data.recordType = "U";
        data.lastModifiedDate = new Date(
          new Date() - new Date().getTimezoneOffset() * 60000
        );
        if (data.itemDescription === "PLT–Pallet") {
          data.itemVariableCharge = 0;
          if (fetchOrder[0].shipmentType !== "drop at Warehouse") {
            pickUpChargeAmount += pickupCharges[0].cpcPickupCharges * data.numberOfItems;
          }
          data.itemVariableCharge = (finalWeight * distanceTable[0].cwcCargoWeightCharges).toFixed(2);
          orderVariableCharges += (data.itemVariableCharge);

        } else {
          data.itemVariableCharge = 0;
          if (fetchOrder[0].shipmentType !== "drop at Warehouse") {
            pickUpChargeAmount += pickupCharges[0].cpcPickupCharges * Math.ceil(finalWeight / 1000);
          }
          data.itemVariableCharge = (finalWeight * distanceTable[0].cwcCargoWeightCharges).toFixed(2);
          orderVariableCharges += (data.itemVariableCharge);
        }

        await OrderItems.updateOne(
          { _id: mongoose.Types.ObjectId(data._id) },
          { $set: data }
        );
      }

      var queryNew = { _id: mongoose.Types.ObjectId(post.orderID) };
      let newData = {};
      newData.fixedCharges = pickUpChargeAmount.toFixed(2);
      newData.variableCharges = shipmentCharegeAmount.toFixed(2);
      newData.totalCharges = (orderVariableCharges + pickUpChargeAmount).toFixed(2);
      newData.distance = totalDistance;
      newData.estimatedDeliveryTime = deliveryTimeEst[0].deliveryTime;
      newData.startWarehouseID = warehouseList.warehouseID;
      var newValues = { $set: newData };
      await Orders.updateOne(queryNew, newValues);
      if (totalDistance !== "" && totalDistance !== undefined) {
        if (post.orderStatus === "Draft") {
          var query = { _id: mongoose.Types.ObjectId(post.orderID) };

          post.orderStatus = "New";

          if (
            fetchOrder[0].shipmentType &&
            fetchOrder[0].shipmentType === "drop at Warehouse"
          ) {
            post.orderStatus = "In Progress";
          }
          if (fetchOrder[0].paymentType === "Account Payment") {
            post.paymentStatus = "Successful";
            post.jobStatus = "To be Dropped";
          } else {
            post.paymentStatus = "Pending";
            post.jobStatus = "Pending";
          }
          post.lastModifiedDate = new Date(
            new Date() - new Date().getTimezoneOffset() * 60000
          );
          post.recordType = "U";
          post.chargeCreditFlag = 1;
          var newValues = { $set: post };
          const order = await Orders.updateOne(query, newValues);
          const updateOrderList = await OrderItems.updateMany(
            { orderID: post.orderID },
            { $set: { itemStatus: "Pending" } }
          );
          // console.log("postss" , businessUserID)
          let fetchCredit = [
            {
              $match: {
                _id: mongoose.Types.ObjectId(businessUserID)
              }
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
                from: "plan_features",
                localField: "businessUserPlans.planID",
                foreignField: "planID",
                as: "planFeatures",
              },
            },
            { $unwind: "$planFeatures" },

            {
              $lookup: {
                from: "standard_features",
                localField: "planFeatures.featureID",
                foreignField: "_id",
                pipeline: [
                  {
                    $match: {
                      featureCode: "CUPCB"
                    }
                  }
                ],
                as: "standardFeatures",
              },
            },
            { $unwind: "$standardFeatures" },

            {
              $project: {
                availableCredits: 1,
                featureCount: "$planFeatures.featureCount"

              }
            }

          ]

          const fetchFeature = await BusinessUsers.aggregate(fetchCredit)

          if (fetchFeature[0].availableCredits < fetchFeature[0].featureCount) {
            let successResponse = genericResponse(true, "Available Credits are Insufficient", []);
            res.status(201).json(successResponse);
            return;
          }
          post.transactionDescription = "Order Placed"
          post.transactionDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
          post.creditsBalance = fetchFeature[0].availableCredits - fetchFeature[0].featureCount
          post.creditsUsed = fetchFeature[0].featureCount
          post.creditsPurchased = 0
          post.businessUserID = businessUserID
          post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
          await new BussinessUserCredit(post).save()
          await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(businessUserID) }, { $set: { availableCredits: post.creditsBalance } })

          if (fetchOrder[0].paymentType === "Self-Payment") {
            const fetchorder = await Orders.find(query);
            const fetchCustomer = await Customer.find({
              _id: mongoose.Types.ObjectId(fetchorder[0].customerID),
            });
            let emailSubject;
            let emailBody;
            const templateQuery = {
              templateStatus: "Active",
              templateName: "MakePaymentLink",
            };
            const fetchedTemplates = await Templates.find(templateQuery);
            if (fetchedTemplates.length > 0) {
              let val = fetchedTemplates[0];
              val.templateSubject = val.templateSubject.replaceAll(
                "[FirstName]",
                fetchCustomer[0].firstName
              );
              val.templateSubject = val.templateSubject.replaceAll(
                "[LastName]",
                fetchCustomer[0].lastName
              );
              emailSubject = val.templateSubject;

              val.templateMessage = val.templateMessage.replaceAll(
                "[FirstName]",
                fetchCustomer[0].firstName
              );
              val.templateMessage = val.templateMessage.replaceAll(
                "[LastName]",
                fetchCustomer[0].lastName
              );
              val.templateMessage = val.templateMessage.replaceAll(
                "PaymentLink",
                `${process.env.PAYMENT_LINK}${post.orderID}`
              );
              emailBody = val.templateMessage;
              await sendEmail(
                fetchCustomer[0].emailAddress,
                emailSubject,
                emailBody
              );
            }
          }
          let dataTrack = {};
          dataTrack.orderID = post.orderID;
          dataTrack.statusDateTime = new Date(
            new Date() - new Date().getTimezoneOffset() * 60000
          );
          dataTrack.trackStatus = "Order Booked";
          dataTrack.createdDate = new Date(
            new Date() - new Date().getTimezoneOffset() * 60000
          );
          dataTrack.recordType = "I";
          const trackLog = new TrackStatusLogs(dataTrack);
          const insertResultTrack = await trackLog.save();
          let dataOrder = {};
          dataOrder.orderID = post.orderID;
          dataOrder.statusDateTime = new Date(
            new Date() - new Date().getTimezoneOffset() * 60000
          );
          dataOrder.orderStatus = "New";

          if (
            fetchOrder[0].shipmentType &&
            fetchOrder[0].shipmentType === "drop at Warehouse"
          ) {
            if (fetchOrder[0].paymentType === "Self-Payment") {
              dataOrder.orderStatus = "Payment Pending";
            } else {
              dataOrder.orderStatus = "In Progress";
            }

            (post.pickupContactName = fetchOrder[0].senderName),
              (post.pickupContactNumber = fetchOrder[0].senderContactNumber),
              (post.pickupStreetAddress = fetchOrder[0].senderStreetAddress),
              (post.pickupCity = fetchOrder[0].senderCity),
              (post.pickupZipCode = fetchOrder[0].senderZipCode),
              (post.pickupCountryID = fetchOrder[0].senderCountryID),
              (post.pickupStateID = fetchOrder[0].senderStateID),
              (post.orderNumber = fetchOrder[0].orderNumber),
              (post.jobNotes = post.notes),
              (post.createdDate = new Date(
                new Date() - new Date().getTimezoneOffset() * 60000
              )),
              (post.recordType = "I"),
              (post.assignedDriverDateTime = new Date(
                new Date() - new Date().getTimezoneOffset() * 60000
              ));
            if (
              fetchOrder[0].pickupWarehouseID !== undefined &&
              fetchOrder[0].pickupWarehouseID !== ""
            ) {
              let fetchWarehouse = await Warehouse.find({
                _id: mongoose.Types.ObjectId(fetchOrder[0].pickupWarehouseID),
              });
              post.dropWarehouseID = fetchOrder[0].pickupWarehouseID;
              (post.dropContactName = fetchWarehouse[0].warehouseName),
                (post.dropStreetAddress = fetchWarehouse[0].streetAddress),
                (post.dropCity = fetchWarehouse[0].city),
                (post.dropZipCode = fetchWarehouse[0].zipCode),
                (post.dropCountryID = fetchWarehouse[0].countryId),
                (post.dropStateID = fetchWarehouse[0].stateId),
                (post.createdDate = new Date(
                  new Date() - new Date().getTimezoneOffset() * 60000
                )),
                (post.recordType = "I");
            }
            let jobNumber = 0;
            let fetchJob = await OrderDriverJob.find({
              businessUserID: mongoose.Types.ObjectId(post.businessUserID),
            })
              .sort({ _id: -1 })
              .limit(1);

            if (fetchJob.length > 0) {
              jobNumber = fetchJob[0].jobNumber + 1;
            } else {
              jobNumber += 1;
            }
            delete post._id;
            post.businessUserID = post.businessUserID;
            (post.jobNumber = jobNumber)
            const orderJobLog = new OrderDriverJob(post);

            const insertOrderJob = await orderJobLog.save();
          }
          dataOrder.createdDate = new Date(
            new Date() - new Date().getTimezoneOffset() * 60000
          );
          dataOrder.recordType = "I";
          const orderLog = new OrderStatusLogs(dataOrder);
          const insertResultOrder = await orderLog.save();
          if (order !== null) {
            let successResponse = genericResponse(
              true,
              "Order updated successfully.",
              {}
            );
            res.status(201).json(successResponse);
            return;
          }
        } else {
          const errorResponse = genericResponse(
            false,
            "orderStatus is not Valid",
            []
          );
          res.status(200).json(errorResponse);
          return;
        }
      } else {
        let errorRespnse = genericResponse(
          false,
          "total Distance can't be Empty",
          []
        );
        res.status(200).json(errorRespnse);
        return;
      }
    } else {
      let errorRespnse = genericResponse(
        false,
        "BussinessUserID can't be Empty",
        []
      );
      res.status(200).json(errorRespnse);
      return;
    }
  } catch (error) {
    console.log("error in getOrderCharges =", error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

// const getOrderCharges = asyncHandler(async (req, res) => {
//     try {

//         const post = req.body
//         console.log("post", post)
//         let fetchOrder = await Orders.find({ _id: mongoose.Types.ObjectId(post.orderID) })
//         console.log("fetchOrder", fetchOrder)
//         let fetchOrderItems = await OrderItems.find({ orderID: mongoose.Types.ObjectId(post.orderID) })
//         console.log("fetchOrderItems", fetchOrderItems)
//         const items = fetchOrderItems;
//         let perItemVariableCharge = [];
//         let businessUserID = fetchOrder[0].businessUserID
//         console.log("Bus" , businessUserID)
//         const receiverLocationLatitude = fetchOrder[0].receiverLocationLatitude
//         const receiverLocationLongitude = fetchOrder[0].receiverLocationLongitude
//         const senderLocationLatitude = fetchOrder[0].senderLocationLatitude
//         const senderLocationLongitude = fetchOrder[0].senderLocationLongitude

//         if (businessUserID !== "" && businessUserID !== undefined) {

//             var unit = "metric"
//             var originAPI = 'https://maps.googleapis.com/maps/api/directions/json?origin=' + senderLocationLatitude + ', ' + senderLocationLongitude + '&destination=' + receiverLocationLatitude + ', ' + receiverLocationLongitude + '&units=' + unit + '&key=AIzaSyCNe-x9Jn_2903j9PxhLPw6SPGXMwIlkCM';

//             const options = {
//                 method: 'POST',
//                 uri: originAPI,
//                 body: req.body,
//                 json: true,
//             }

//             const response = await request(options);
//             const totalDist = response.routes[0].legs[0].distance.value;
//             console.log('totalDist in MM', totalDist);
//             const totalDistance = totalDist / 1000;
//             console.log('totalDistance in Km', totalDistance);

//             if (totalDistance !== '' && totalDistance !== undefined) {
//                 let fixedVolCharges = await ShipmentCharge.find({ businessUserID });
//                 const deliveryTimeEst = await DeliveryTime.find({ businessUserID });
//                 const fixedVolume = fixedVolCharges[0].cargoVolume
//                 console.log("fixedVolumefromtable", fixedVolume)
//                 const cargofixedVolumeCharges = fixedVolCharges[0].cargoVolumeCharges
//                 console.log("cargofixedVolumeChargesfromtable", cargofixedVolumeCharges)
//                 const cargofixedVolumeID = fixedVolCharges[0]._id

//                 const distanceTable = await CargoWeightCharges.find({ shipmentChargeID: cargofixedVolumeID });
//                 const pickupTable = await ConsignmentPickupCharges.find({ shipmentChargeID: cargofixedVolumeID });

//                 let cpcPickupCharges;
//                 let cargoVolumeCharges;
//                 let cwcCargoWeightCharges;
//                 let deliveryEstimateTime;
//                 let applicableItem = null; // Variable to store the matching item
//                 let applicableItemPick = null; // Variable to store the matching item
//                 let applicableDeliveryTime = null;

//                 let totalCharges = 0;

//                 for (let i = 0; i < items.length; i++) {
//                     const cargoWeight = items[i].weightInKg;
//                     const cargoLength = items[i].lengthInMm;
//                     const cargoBreadth = items[i].breadthInMm;
//                     const cargoHeight = items[i].heightInMm;
//                     const cargoVolume = cargoLength * cargoBreadth * cargoHeight;
//                     console.log("Item " + (i + 1) + " - cargoVolumefromcalculation:", cargoVolume);

//                     if (fixedVolume >= cargoVolume) {
//                         console.log("fixedVolume >= cargoVolume",)
//                         cargoVolumeCharges = cargofixedVolumeCharges;
//                         console.log("cargoVolumeCharges", cargoVolumeCharges)

//                         distanceTable.forEach((item) => {
//                             const cwcFromDistance = parseInt(item.cwcFromDistance);
//                             const cwcToDistance = parseInt(item.cwcToDistance);
//                             if (totalDistance >= cwcFromDistance && totalDistance <= cwcToDistance) {
//                                 applicableItem = item;
//                                 return;
//                             }
//                         });

//                         if (applicableItem) {
//                             // console.log("In Cargo Weight table", applicableItem);
//                             const fixedCharges = parseFloat(applicableItem.cwcCargoWeightCharges.replace("$", ""));
//                             console.log("fixedCharges", fixedCharges);
//                             cwcCargoWeightCharges = cargoWeight * fixedCharges;
//                             console.log("cargoWeight", cargoWeight);
//                             console.log("cwcCargoWeightCharges", cwcCargoWeightCharges);

//                             pickupTable.forEach((item) => {
//                                 const cpcFromDistance = parseInt(item.cpcFromDistance);
//                                 const cpcToDistance = parseInt(item.cpcToDistance);
//                                 if (totalDistance >= cpcFromDistance && totalDistance <= cpcToDistance) {
//                                     applicableItemPick = item;
//                                     return;
//                                 }
//                             });
//                             if (applicableItemPick) {
//                                 // console.log("In consignment Pickup charges", applicableItemPick);
//                                 cpcPickupCharges = parseFloat(applicableItemPick.cpcPickupCharges.replace("$", ""));
//                                 const greaterValue = Math.max(cargoVolumeCharges, cwcCargoWeightCharges);
//                                 console.log("greaterValue", greaterValue);
//                                 perItemVariableCharge.push(greaterValue);
//                                 totalCharges += greaterValue;
//                                 console.log("-------------");
//                             }
//                             else {
//                                 console.log("No applicable item found for the given PickUpCharges.");
//                             }
//                         } else {
//                             console.log("No applicable item found for the given distance.");
//                         }
//                         deliveryTimeEst.forEach((item) => {
//                             const fromDistance = parseInt(item.fromDistance);
//                             const toDistance = parseInt(item.toDistance);
//                             if (totalDistance >= fromDistance && totalDistance <= toDistance) {
//                                 applicableDeliveryTime = item;
//                                 return;
//                             }
//                         });

//                         if (applicableDeliveryTime) {
//                             deliveryEstimateTime = applicableDeliveryTime.deliveryTime;
//                         } else {
//                             console.log("No applicable DeliveryTime found for the given distance.");
//                         }

//                     }

//                     else if (fixedVolume < cargoVolume) {
//                         console.log("fixedVolume =< cargoVolume",)
//                         const data = Math.ceil(cargoVolume / fixedVolume);
//                         console.log("data", data)
//                         cargoVolumeCharges = cargofixedVolumeCharges * data;
//                         console.log("cargoVolumeCharges", cargoVolumeCharges)
//                         // const distanceTable = await CargoWeightCharges.find({ shipmentChargeID: cargofixedVolumeID });

//                         // Variable to store the matching item

//                         distanceTable.forEach((item) => {
//                             const cwcFromDistance = parseInt(item.cwcFromDistance);
//                             const cwcToDistance = parseInt(item.cwcToDistance);
//                             if (totalDistance >= cwcFromDistance && totalDistance <= cwcToDistance) {

//                                 applicableItem = item;
//                                 return;
//                             }
//                         });

//                         if (applicableItem) {
//                             // console.log("In Cargo Weight table", applicableItem);
//                             const fixedCharges = parseFloat(applicableItem.cwcCargoWeightCharges.replace("$", ""));
//                             console.log("fixedCharges", fixedCharges);
//                             cwcCargoWeightCharges = cargoWeight * fixedCharges;
//                             console.log("cargoWeight", cargoWeight);
//                             console.log("cwcCargoWeightCharges", cwcCargoWeightCharges);

//                             pickupTable.forEach((item) => {
//                                 const cpcFromDistance = parseInt(item.cpcFromDistance);
//                                 const cpcToDistance = parseInt(item.cpcToDistance);
//                                 if (totalDistance >= cpcFromDistance && totalDistance <= cpcToDistance) {
//                                     applicableItemPick = item;
//                                     return;
//                                 }
//                             });
//                             if (applicableItemPick) {
//                                 // console.log("In consignment Pickup charges", applicableItemPick);
//                                 cpcPickupCharges = parseFloat(applicableItemPick.cpcPickupCharges.replace("$", ""));
//                                 const greaterValue = Math.max(cargoVolumeCharges, cwcCargoWeightCharges);
//                                 console.log("greaterValue", greaterValue);
//                                 perItemVariableCharge.push(greaterValue);
//                                 totalCharges += greaterValue;
//                                 console.log("-------------");
//                             }
//                             else {
//                                 console.log("No applicable item found for the given PickUpCharges.");
//                             }
//                         } else {
//                             console.log("No applicable item found for the given distance.");
//                         }
//                         deliveryTimeEst.forEach((item) => {
//                             const fromDistance = parseInt(item.fromDistance);
//                             const toDistance = parseInt(item.toDistance);
//                             if (totalDistance >= fromDistance && totalDistance <= toDistance) {
//                                 applicableDeliveryTime = item;
//                                 return;
//                             }
//                         });

//                         if (applicableDeliveryTime) {
//                             deliveryEstimateTime = applicableDeliveryTime.deliveryTime;
//                         } else {
//                             console.log("No applicable DeliveryTime found for the given distance.");
//                         }

//                     }
//                 }
//                 console.log("cpcPickupCharges", cpcPickupCharges);
//                 let variableCharges = totalCharges;
//                 console.log("variableCharges", variableCharges);
//                 let totalChargesvalues = cpcPickupCharges + variableCharges;
//                 console.log("totalCharges", totalChargesvalues);
//                 console.log("perItemVariableCharge", perItemVariableCharge);
//                 console.log("deliveryEstimateTime", deliveryEstimateTime);
//                 var queryNew = { _id: mongoose.Types.ObjectId(post.orderID) };
//                 let newData = {};
//                 newData.fixedCharges = cpcPickupCharges
//                 newData.variableCharges = variableCharges
//                 newData.totalCharges = totalChargesvalues
//                 newData.distance = totalDistance
//                 newData.estimatedDeliveryTime = deliveryEstimateTime
//                 var newValues = { $set: newData };
//                 const order = await Orders.updateMany(queryNew, newValues);

//                 const queryOrderID = { orderID: mongoose.Types.ObjectId(post.orderID) }
//                 const orderItems = await OrderItems.find(queryOrderID);
//                 for (let i = 0; i < orderItems.length; i++) {
//                     const orderItem = orderItems[i];
//                     const updatedPerItemVariableCharge = perItemVariableCharge[i]; // Get the corresponding value from the response array
//                     orderItem.itemVariableCharge = updatedPerItemVariableCharge;
//                     orderItem.recordType = 'U';
//                     orderItem.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//                     await OrderItems.updateOne({_id:mongoose.Types.ObjectId(orderItems[i]._id)} , {$set:orderItem});
//                 }

//                 if (post.orderStatus === "Draft") {
//                     var query = { _id: mongoose.Types.ObjectId(post.orderID) };
//                     console.log("query", query)
//                     post.orderStatus = "New"

//                     if (fetchOrder[0].shipmentType && fetchOrder[0].shipmentType === "drop at Warehouse") {

//                         post.orderStatus = "In Progress";
//                     }
//                     post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//                     post.recordType = 'U';
//                     var newValues = { $set: post };
//                     const order = await Orders.updateMany(query, newValues);
//                     const updateOrderList = await OrderItems.updateMany({ orderID: post.orderID }, { $set: { itemStatus: "Pending" } })
//                     // console.log("postss" , businessUserID)
//                     let fetchCredit = [
//                         {
//                             $match: {
//                                 _id: mongoose.Types.ObjectId(businessUserID)
//                             }
//                         },

//                         {
//                             $lookup: {
//                                 from: "business_user_plans",
//                                 localField: "_id",
//                                 foreignField: "businessUserID",
//                                 as: "businessUserPlans",
//                                 pipeline: [
//                                     {
//                                         $sort: { _id: -1 }
//                                     },
//                                     {
//                                         $limit: 1
//                                     }
//                                 ]
//                             }
//                         },
//                         { $unwind: "$businessUserPlans" },

//                         {
//                             $lookup: {
//                                 from: "plan_features",
//                                 localField: "businessUserPlans.planID",
//                                 foreignField: "planID",
//                                 as: "planFeatures",
//                             },
//                         },
//                         { $unwind: "$planFeatures" },

//                         {
//                             $lookup: {
//                                 from: "standard_features",
//                                 localField: "planFeatures.featureID",
//                                 foreignField: "_id",
//                                 pipeline: [
//                                     {
//                                         $match: {
//                                             featureCode: "CUPCB"
//                                         }
//                                     }
//                                 ],
//                                 as: "standardFeatures",
//                             },
//                         },
//                         { $unwind: "$standardFeatures" },

//                         {
//                             $project: {
//                                 availableCredits: 1,
//                                 featureCount: "$planFeatures.featureCount"

//                             }
//                         }

//                     ]

//                     const fetchFeature = await BusinessUsers.aggregate(fetchCredit)

//                     if (fetchFeature[0].availableCredits < fetchFeature[0].featureCount) {
//                         let successResponse = genericResponse(true, "Available Credits are Insufficient", []);
//                         res.status(201).json(successResponse);
//                         return;
//                     }
//                     post.transactionDescription = "Order Placed"
//                     post.transactionDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//                     post.creditsBalance = fetchFeature[0].availableCredits - fetchFeature[0].featureCount
//                     post.creditsUsed = fetchFeature[0].featureCount
//                     post.creditsPurchased = 0
//                     post.businessUserID = businessUserID
//                     post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//                     await new BussinessUserCredit(post).save()
//                     await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(businessUserID) }, { $set: { availableCredits: post.creditsBalance } })

//                     const fetchorder = await Orders.find(query);
//                     const fetchCustomer = await Customer.find({ _id: mongoose.Types.ObjectId(fetchorder[0].customerID) });
//                     let emailSubject
//                     let emailBody
//                     const templateQuery = { templateStatus: 'Active', templateName: 'MakePaymentLink' };
//                     const fetchedTemplates = await Templates.find(templateQuery);
//                     if (fetchedTemplates.length > 0) {
//                         let val = fetchedTemplates[0];
//                         val.templateSubject = val.templateSubject.replaceAll('[FirstName]', fetchCustomer[0].firstName);
//                         val.templateSubject = val.templateSubject.replaceAll('[LastName]', fetchCustomer[0].lastName);
//                         emailSubject = val.templateSubject;

//                         val.templateMessage = val.templateMessage.replaceAll('[FirstName]', fetchCustomer[0].firstName);
//                         val.templateMessage = val.templateMessage.replaceAll('[LastName]', fetchCustomer[0].lastName);
//                         val.templateMessage = val.templateMessage.replaceAll('PaymentLink', `${process.env.PAYMENT_LINK}${post.orderID}`);
//                         emailBody = val.templateMessage;
//                         await sendEmail(fetchCustomer[0].emailAddress, emailSubject, emailBody);
//                     }

//                     let dataTrack = {};
//                     dataTrack.orderID = post.orderID
//                     dataTrack.statusDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//                     dataTrack.trackStatus = "Order Booked";
//                     dataTrack.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//                     dataTrack.recordType = 'I';
//                     const trackLog = new TrackStatusLogs(dataTrack);
//                     const insertResultTrack = await trackLog.save();
//                     console.log("insertResultTrack", insertResultTrack);

//                     let dataOrder = {};
//                     dataOrder.orderID = post.orderID
//                     dataOrder.statusDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//                     dataOrder.orderStatus = "New";

//                     if (fetchOrder[0].shipmentType && fetchOrder[0].shipmentType === "drop at Warehouse") {

//                         dataOrder.orderStatus = "In Progress";
//                     }
//                     dataOrder.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//                     dataOrder.recordType = 'I';
//                     const orderLog = new OrderStatusLogs(dataOrder);
//                     const insertResultOrder = await orderLog.save();
//                     console.log("insertResultOrder", insertResultOrder);

//                     if (order !== null) {
//                         let successResponse = genericResponse(true, "Order updated successfully.", {
//                         });
//                         res.status(201).json(successResponse);
//                         return;
//                     }
//                 } else {
//                     const errorResponse = genericResponse(false, "orderStatus is not Valid", []);
//                     res.status(200).json(errorResponse);
//                     return;
//                 }

//                 // let successResponse =
//                 //     genericResponse(true, "Order added successfully.", [{
//                 //         fixedCharges: cpcPickupCharges,
//                 //         variableCharges: variableCharges,
//                 //         totalCharges: totalChargesvalues,
//                 //         distance: totalDistance,
//                 //         perItemVariableCharge: perItemVariableCharge,
//                 //         estimatedDeliveryTime: deliveryEstimateTime
//                 //     }]);

//                 // res.status(201).json(successResponse);
//             } else {
//                 let errorRespnse = genericResponse(false, "total Distance can't be Empty", []);
//                 res.status(200).json(errorRespnse)
//                 return;
//             }
//         }
//         else {
//             let errorRespnse = genericResponse(false, "BussinessUserID can't be Empty", []);
//             res.status(200).json(errorRespnse)
//             return;
//         }
//     }
//     catch (error) {
//         console.log("error in getOrderCharges =", error.message);
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(400).json(errorRespnse);
//     }
// });

const fetchCreditInfo = asyncHandler(async (req, res) => {
  try {
    const post = req.body;

    let fetchCredit = [
      {
        $match: {
          _id: mongoose.Types.ObjectId(post.businessUserID),
        },
      },

      {
        $lookup: {
          from: "business_user_plans",
          localField: "_id",
          foreignField: "businessUserID",
          as: "businessUserPlans",
          pipeline: [
            {
              $sort: { _id: -1 },
            },
            {
              $limit: 1,
            },
          ],
        },
      },
      { $unwind: "$businessUserPlans" },

      {
        $lookup: {
          from: "plan_features",
          localField: "businessUserPlans.planID",
          foreignField: "planID",
          as: "planFeatures",
        },
      },
      { $unwind: "$planFeatures" },

      {
        $lookup: {
          from: "standard_features",
          localField: "planFeatures.featureID",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                featureCode: "CUPCB",
              },
            },
          ],
          as: "standardFeatures",
        },
      },
      { $unwind: "$standardFeatures" },

      {
        $project: {
          availableCredits: 1,
          featureCount: "$planFeatures.featureCount",
        },
      },
    ];

    const fetchFeature = await BusinessUsers.aggregate(fetchCredit);

    if (fetchFeature.length > 0) {
      let successResponse = genericResponse(
        true,
        "count fetch successfully.",
        fetchFeature
      );
      res.status(200).json(successResponse);
    } else {
      let successResponse = genericResponse(false, "Failed To fetch", []);
      res.status(200).json(successResponse);
    }
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const createGatewayUrl = asyncHandler(async (req, res) => {
  try {
    const post = req.body;


    const session = await stripe.checkout.sessions.create({
      customer: post.gatewayUserID,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: "Product Name",
            },
            unit_amount: Math.round(parseFloat(post.amount)), // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://192.168.5.4:5000/api/order/successPage?orderID=${post.orderID}`,
      cancel_url: `http://192.168.5.4:3000/makePayment/${post.orderID}?Failed=true`,
      metadata: {
        orderID: post.orderID,
        businessUserID: post.businessUserID,
      },
    });

    await Orders.updateOne(
      { _id: mongoose.Types.ObjectId(post.orderID) },
      { $set: { sessionID: session.id } }
    );
    let successResponse = genericResponse(true, "Customer not found.", session);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error===>", error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const webhook = asyncHandler(
  express.raw({ type: "application/json" }),
  async (request, response) => {
    try {
      const sig = request.headers[process.env.STRIPE_SECRET_KEY];
      const endpointSecret =
        "whsec_45ee1480df21c5fe6e8fa55dedf83dbafca4697381934079696fe5e833b6f12c";

      // let event;

      const payload = {
        id: request.body.id,
        object: "event",
      };

      const payloadString = JSON.stringify(payload, null, 2);
      const secret = endpointSecret;

      const header = stripe.webhooks.generateTestHeaderString({
        payload: payloadString,
        secret,
      });

      const event = stripe.webhooks.constructEvent(
        payloadString,
        header,
        secret
      );

      // Do something with mocked signed event
      expect(event.id).to.equal(payload.id);

      // try {
      //   event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
      // } catch (err) {
      //   response.status(400).send(`Webhook Error: ${err.message}`);
      //   return;
      // }

      // Handle the event
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntentSucceeded = event.data.object;
          // Then define and call a function to handle the event payment_intent.succeeded
          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      // Return a 200 response to acknowledge receipt of the event
      response.send();
      // let errorRespnse = genericResponse(true, "Customer not found.", session);
      // res.status(200).json(errorRespnse);
    } catch (error) {
      let errorRespnse = genericResponse(false, error.message, []);
      res.status(200).json(errorRespnse);
    }
  }
);

const successPage = asyncHandler(async (req, res) => {
  try {
    const post = req.query;
    let fetchOrder = await Orders.find({
      _id: mongoose.Types.ObjectId(post.orderID),
    });
    const session = await stripe.checkout.sessions.retrieve(
      fetchOrder[0].sessionID
    );
    res.send(`<!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          
          .ok-icon {
            width: 100px;
            height: 100px;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
          }
          
          h1 {
            margin-top: 170px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <img class="ok-icon" src="https://img.icons8.com/dusk/64/000000/ok.png" alt="OK Icon">
        <h1>Thanks for your order, ${session.customer_details.name}!</h1>
      </body>
    </html>`);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) };

    const update = await Orders.updateOne(query, {
      $set: { paymentStatus: "Failed" },
    });

    let successResponse = genericResponse(
      true,
      "Payment Failed Please Retry.",
      []
    );
    res.status(200).json(successResponse);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});
const fetchOrderItemDetailsByID = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const fetch = await OrderItems.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(post.id) } },
      {
        $lookup: {
          from: "orders",
          localField: "orderID",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },
      {
        $project: {
          paymentType: "$order.paymentType",
          shipmentType: "$order.shipmentType",
          businessUserID: "$order.businessUserID",
          customerID: "$order.customerID",
          receiverStateID: "$order.receiverStateID",
          receiverCountryID: "$order.receiverCountryID",
          selectUser: "$order.selectUser",
          orderNumber: "$order.orderNumber",
          orderDate: "$order.orderDate",
          senderName: "$order.senderName",
          senderContactNumber: "$order.senderContactNumber",
          senderStreetAddress: "$order.senderStreetAddress",
          senderZipCode: "$order.senderZipCode",
          senderCity: "$order.senderCity",

          receiverName: "$order.receiverName",
          receiverfirstName: "$order.receiverfirstName",
          receiverlastName: "$order.receiverlastName",
          receiverContactNumber: "$order.receiverContactNumber",
          receiverStreetAddress: "$order.receiverStreetAddress",
          receiverCity: "$order.receiverCity",
          receiverZipCode: "$order.receiverZipCode",

          _id: "$_id",
          cargoType: "$cargoType",
          numberOfItems: "$numberOfItems",
          cargoTemperature: "$cargoTemperature",
          lengthInMm: "$lengthInMm",
          breadthInMm: "$breadthInMm",
          heightInMm: "$heightInMm",
          weightInKg: "$weightInKg",
          description: "$description",
        },
      },
    ]);

    if (fetch.length > 0) {
      let dateOptions = { month: "short", day: "2-digit", year: "numeric" };
      fetch.forEach((element) => {
        let upDate = element.orderDate.toLocaleDateString("en-US", dateOptions);
        element.orderDate = upDate;
      });
      return res
        .status(200)
        .json(genericResponse(true, "order Item details fetched", fetch));
    } else {
      return res
        .status(202)
        .json(genericResponse(false, `Not fetch Order details`));
    }
  } catch (error) {
    console.log("error===>", error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

// const GenerateOrderQRCode = asyncHandler(async (req, res) => {
//     const post = req.body;
//     console.log("post", post)
//     try {
//         const fetch = await Orders.aggregate([
//             { $match: { _id: mongoose.Types.ObjectId(post.id) } },
//             {
//                 $lookup: {
//                     from: 'order_items',
//                     localField: '_id',
//                     foreignField: 'orderID',
//                     as: 'items'
//                 }
//             }
//             , { $unwind: "$items" },
//             {
//                 $project: {
//                     paymentType: "$paymentType",
//                     businessUserID: "$businessUserID",
//                     customerID: "$customerID",
//                     receiverStateID: "$receiverStateID",
//                     receiverCountryID: "$receiverCountryID",
//                     selectUser: '$selectUser',
//                     orderNumber: "$orderNumber",
//                     orderDate: "$orderDate",
//                     senderName: "$senderName",
//                     senderContactNumber: '$senderContactNumber',
//                     senderStreetAddress: '$senderStreetAddress',
//                     senderZipCode: '$senderZipCode',
//                     senderCity: '$senderCity',

//                     receiverName: '$receiverName',
//                     receiverfirstName: '$receiverfirstName',
//                     receiverlastName: '$receiverlastName',
//                     receiverContactNumber: '$receiverContactNumber',
//                     receiverStreetAddress: '$receiverStreetAddress',
//                     receiverCity: '$receiverCity',
//                     receiverZipCode: '$receiverZipCode',

//                     _id: "$items._id",
//                     cargoType: "$items.cargoType",
//                     numberOfItems: "$items.numberOfItems",
//                     cargoTemperature: "$items.cargoTemperature",
//                     lengthInMm: "$items.lengthInMm",
//                     breadthInMm: "$items.breadthInMm",
//                     heightInMm: "$items.heightInMm",
//                     weightInKg: "$items.weightInKg",
//                     description: "$items.description",

//                 }
//             }

//         ]);
//         console.log("fetch", fetch)
//         if (fetch.length > 0) {
//             let contentList = [];
//             const frontPageStyle = '"width:215.9mm; height:100%; display:flex;align-items:flex-end;box-sizing:border-box;page-break-after: always;padding-bottom:23.368mm;"';
//             let counter = 1;
//             let contentArray = [];
//             for (let i = 0; i < fetch.length; i++) {
//                 let element = fetch[i];

//                 contentList += `<div  style="width: calc(215.9mm / 2 - 15px); height: calc(279.4mm / 3 - 15px); border: 1px dashed black; font-family: arial;">
//               <p style="text-align:center;">Order No :  ${element.orderNumber}dfsdfsdf</p>
//               <p style="text-align:center;">Sender Name: ${element.senderName}</p>
//               <p style="text-align:center;">Receiver Name: ${element.receiverName}</p>
//               <p style="text-align:center;">Item Type: ${element.cargoType}</p>
//               <div style="display:grid;justify-content:space-around"><div style="width:100%;">

//               </div>
//               <div>
//               <img src="${await QRGenerator()}" height="140px" width="140px">

//               </div></div></div>`;

//                 if (counter % 6 == 0 || i == fetch.length - 1) {
//                     contentArray += `<style>

//                   body {
//                       width: 100%;
//                        height: 100%;
//                       display: grid;
//                       grid-template-columns: repeat(2, 1fr);
//                       grid-template-rows: repeat(3, 1fr);
//                       row-gap:15px;

//                   }
//               </style>
//               ${contentList}
//               `
//                     contentList = [];
//                 }
//                 counter++;
//             }
//             const path = await generatePDF(contentArray, `OrderNo_${fetch[0].orderNumber}_` + new Date().getTime());
//             if (path) {
//                 let response = {
//                     path: path,
//                     orderNumber: fetch[0].orderNumber
//                 }
//                 console.log(`Order PDF Generated Successfully`, path);
//                 return res.status(200).json(genericResponse(true, 'order details fetched', response))
//             } else {
//                 return res.status(202).json(genericResponse(false, "Something went wrong in PDF Generating"));
//             }

//         } else {
//             return res.status(202).json(genericResponse(false, `Not fetch Order details`))
//         }
//     } catch (error) {
//         console.log("error===>", error.message)
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(400).json(errorRespnse);
//     }
// });
const GenerateOrderQRCode = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const fetch = await Orders.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(post.id) } },
      {
        $lookup: {
          from: "order_items",
          localField: "_id",
          foreignField: "orderID",
          as: "items",
        },
      },
      { $unwind: "$items" },
      {
        $project: {
          orderNumber: "$orderNumber",
          orderDate: "$orderDate",
          senderName: "$senderName",
          barCodeID: "$items.barCodeID",
          senderContactNumber: "$senderContactNumber",
          senderStreetAddress: "$senderStreetAddress",
          senderZipCode: "$senderZipCode",
          senderCity: "$senderCity",

          receiverName: "$receiverName",
          receiverContactNumber: "$receiverContactNumber",
          receiverStreetAddress: "$receiverStreetAddress",
          receiverCity: "$receiverCity",
          receiverZipCode: "$receiverZipCode",

          _id: "$items._id",
          cargoType: "$items.cargoType",
          numberOfItems: "$items.numberOfItems",
          description: "$items.description",
          weightInKg: "$items.weightInKg",
          cargoTemperature: "$items.cargoTemperature",
          orderNo_with_Date: {
            $concat: [
              { $toString: "$orderNumber" },
              "/",
              {
                $let: {
                  vars: {
                    monthsInString: [
                      ,
                      "Jan ",
                      "Feb ",
                      "Mar ",
                      "Apr ",
                      "May ",
                      "Jun ",
                      "Jul ",
                      "Aug ",
                      "Sep ",
                      "Oct ",
                      "Nov ",
                      "Dec ",
                    ],
                  },
                  in: {
                    $arrayElemAt: [
                      "$$monthsInString",
                      { $month: "$orderDate" },
                    ],
                  },
                },
              },
              { $dateToString: { format: "%d", date: "$orderDate" } },
              ",",
              { $dateToString: { format: "%Y", date: "$orderDate" } },
            ],
          },
          cargoDetails: {
            $concat: [
              "$items.cargoType",
              " ",
              {
                $cond: {
                  if: { $eq: ["$items.cargoTemperature", ""] },
                  then: "",
                  else: {
                    $concat: ["( Temp: ", "$items.cargoTemperature", ")"],
                  },
                },
              },
            ],
          },
        },
      },
    ]);
    if (fetch.length > 0) {
      let count = 0;
      let contentList = [];
      let contentArray = [];
      for (let i = 0; i < fetch.length; i++) {
        let element = fetch[i];
        count++;
        const canvas = createCanvas();
        const barcodeValue = element.barCodeID;

        const options = {
          format: "CODE128",
          lineColor: "black",
          height: 80,
        };
        JsBarcode(canvas, barcodeValue, options);
        const barcodeImage = canvas.toDataURL("image/png");
        contentList += `<div style="width:208.56mm; height:88.96mm;border: 1px solid black; font-family: arial;">
          <div style="width:100%;display:flex;border-bottom:1px solid; height:25px">
          <div style="width:50%;padding-left:10px;">
          <h5 style="margin-top:4px">${element.senderName}</h5>
          </div>
          <div style="width:50%;padding-left:10px;">
          <h5 style="margin-top:4px">C/N : ${element.orderNumber}</h5>
          </div>
          </div>
        
        <div style="width:100%;display:flex;height:35%">
          
          <div style="width:50% ;padding-left:10px">
            <div style"height:15%">
             
              <h5 style="margin-top:4px">${element.receiverName}</h5> 
              <h5 style="margin-top:-18px">${element.receiverStreetAddress},</h5>    
              
            </div>
            <div style"height:3%">
             <h5 style="margin-top:4px">${element.receiverCity} &nbsp; ${element.receiverZipCode}</h5> 
            </div>
            
             <p style="font-size:12px;margin-top:-15px">CONTACT TELEPHONE: ${element.receiverContactNumber}</p> 
            
                
          </div>
          <div style="width:50%; padding-left:10px">
            
             
             <h5 style="margin-top:4px;padding-left:10px;">U2</h5> 
             <h5 style="margin-top:-18px;padding-left:10px;">BOOKING Ref : </h5>  
             <div style="display:flex">
             <div style="width:50%">
              <p style="font-size:12px;padding-left:10px;margin-top:-18px">Dest State:</p> 
              <h1 style="padding-left:10px;margin-top:-13px">WA</h1>
             </div>
             <div style="width:50%">
             <p style="font-size:12px;padding-left:10px;margin-top:-18px">Routing Port:</p> 
             </div>
             </div>         
          
           
            
          </div>
        </div>
        <div style="width:100%;display:flex;height:60%;margin-top:-10px">
         <div style="width:50% ;border : 1px solid black; border-bottom:0px; border-left:0px">
         <div class="border-bottom" style"height:8%; ">
          <div style="display:flex;">
           <div width:"width:20%;">
             <p style="font-size:13px;padding-left:10px;margin-top:3px">From:</p> 
           </div>
           <div width:"width:80%;">
             <p style="font-size:13px;padding-left:10px;margin-top:3px">${element.senderName}, ${element.senderStreetAddress}</p> 
             <p style="font-size:13px;padding-left:10px;margin-top:-13px">${element.senderCity}, ${element.senderZipCode}</p> 
           </div>
          </div>
          <div style="display:flex;margin-top:-23px">
           <div width:"width:20%;">
             <p style="font-size:12px;padding-left:10px">Contact No:</p> 
           </div>
           <div width:"width:80%;">
             <p style="font-size:12px;padding-left:10px ;">${element.senderContactNumber}}</p> 
           </div>
          </div>
         
         </div>
        
         <div class="border-bottom" style"height:8%; border-top:1px solid">
          <div style="display:flex;">
           <div width:"width:20%;">
             <p style="font-size:13px;padding-left:10px;margin-top:3px">Instuctions:</p> 
           </div>
           <div width:"width:80%;">
             <h5 style="padding-left:10px;margin-top:3px"></h5> 
           </div>
          </div>          
         
         </div>
         <div class="border-bottom" style"height:5%; border-top:1px solid">
          <div style="display:flex;">
           <div width:"width:20%;">
             <p style="font-size:13px;padding-left:10px;margin-top:3px">Ref:</p> 
           </div>
           <div width:"width:80%;">
             <h5 style="padding-left:10px;margin-top:3px;margin-bottom:0px;padding-bottom:0px"></h5> 
             <b style="padding-left:10px;font-size:10px">5860461</b>
           </div>
          </div>        
                   
         </div>
        
          <div style="display:flex;">
           <div width:"width:50%;">
             <h4 style="padding-left:10px;margin-top:3px">WGHT:&nbsp; ${element.weightInKg}KG <br /> ITEM NO &nbsp; ${count}</h4> 
           </div>
          <div width:"width:50%;">
            <p style="font-size:13px;padding-left:30px;margin-top:3px;">Dispatch Date:</p> 
             <h3 style="padding-left:30px;margin-top:-13px">11/07/2023</h3> 
             </div>
         </div>
         
         </div>
         <div >
         <p style="font-size:13px;padding-left:10px;margin-top:3px">Item Description: </p>
         <p style="font-size:13px;padding-left:10px;">${element.description}</p>
         <br/>
          <img  style="margin-left:10px; "  src="${barcodeImage}"/>
         </div>        
       </div>                      
      </div>`;
      }
      contentArray += `<div>
               <div style="display:flex;flex-wrap:wrap;row-gap:10px;padding:0px 2.64mm 2.64mm 2.64mm;"> ${contentList} </div>
       </div>`;

      const path = await generatePDF(
        contentArray,
        `OrderNo_${fetch[0].orderNumber}_` + new Date().getTime()
      );
      if (path) {
        let response = {
          path: path,
          orderNumber: fetch[0].orderNumber,
        };
        return res
          .status(200)
          .json(genericResponse(true, "order details fetched", response));
      } else {
        return res
          .status(202)
          .json(
            genericResponse(false, "Something went wrong in PDF Generating")
          );
      }
    } else {
      return res
        .status(202)
        .json(genericResponse(false, `Not fetch Order details`));
    }
  } catch (error) {
    console.log("error===>", error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateItemStatus = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    let fetchItem;
    const query = { barCodeID: post.barCodeID };
    const fetchRecord = await OrderItems.find({ barCodeID: post.barCodeID, orderID: post.orderID })
    if (fetchRecord.length === 0) {
      let successResponse = genericResponse(
        false,
        "BarCode ID is not associated with this order",
        []
      );
      res.status(200).json(successResponse);
      return;
    }


    if (
      post.loadPlanVehiclesID !== "" &&
      post.loadPlanVehiclesID !== undefined &&
      post.loadPlanVehiclesID !== null
    ) {
      let fetchQuery = [
        {
          $match: {
            barCodeID: post.barCodeID,
            loadPlanVehicleID: mongoose.Types.ObjectId(post.loadPlanVehiclesID),
          },
        },
        {
          $lookup: {
            from: "order_items",
            localField: "orderItemID",
            foreignField: "_id",
            as: "orderItem",
          },
        },
        {
          $unwind: "$orderItem",
        },
        {
          $project: {
            itemStatus: 1,
            numberOfItems: "$orderItem.numberOfItems",
            receivedQty: 1,
            orderID: 1,
          },
        },
      ];
      let fetchItemData = await LoadVehicleOrder.aggregate(fetchQuery);
      fetchItem = fetchItemData[0];
    } else {
      fetchItem = await OrderItems.findOne(query);
    }

    let status;

    if (fetchItem.itemStatus === "Pending") {
      if (fetchItem.numberOfItems === parseInt(post.itemQuantity)) {
        status = "Received";
      } else if (fetchItem.numberOfItems > parseInt(post.itemQuantity)) {
        status = "Partial Received";
      } else if (fetchItem.numberOfItems < parseInt(post.itemQuantity)) {
        let successResponse = genericResponse(
          false,
          "Recieve Item Quantity is not Valid",
          []
        );
        res.status(200).json(successResponse);
        return;
      }

      if (
        post.loadPlanVehiclesID !== "" &&
        post.loadPlanVehiclesID !== undefined &&
        post.loadPlanVehiclesID !== null
      ) {
        await LoadVehicleOrder.updateMany(
          {
            barCodeID: post.barCodeID,
            loadPlanVehicleID: mongoose.Types.ObjectId(post.loadPlanVehiclesID),
          },
          { $set: { notes: post.notes, itemStatus: status, receivedQty: post.itemQuantity } }
        );
      } else {
        await OrderItems.updateOne(query, {
          $set: { notes: post.notes, itemStatus: status, receivedQty: post.itemQuantity },
        });
      }
    } else if (fetchItem.itemStatus === "Partial Received") {
      let quantity =
        parseInt(fetchItem.receivedQty) + parseInt(post.itemQuantity);
      if (fetchItem.numberOfItems === quantity) {
        status = "Received";
      } else if (fetchItem.numberOfItems > quantity) {
        status = "Partial Received";
      } else if (fetchItem.numberOfItems < quantity) {
        let successResponse = genericResponse(
          false,
          "Recieve Item Quantity is not Valid",
          []
        );
        res.status(200).json(successResponse);
        return;
      }

      if (
        post.loadPlanVehiclesID !== "" &&
        post.loadPlanVehiclesID !== undefined &&
        post.loadPlanVehiclesID !== null
      ) {
        await LoadVehicleOrder.updateMany(
          {
            barCodeID: post.barCodeID,
            loadPlanVehicleID: mongoose.Types.ObjectId(post.loadPlanVehiclesID),
          },
          { $set: { notes: post.notes, itemStatus: status, receivedQty: quantity } }
        );
      } else {
        await OrderItems.updateOne(query, {
          $set: { notes: post.notes, itemStatus: status, receivedQty: quantity },
        });
      }
    } else if (fetchItem.itemStatus === "Received") {
      let successResponse = genericResponse(
        false,
        "Received Item can't be modified!",
        []
      );
      res.status(200).json(successResponse);
      return;
    }
    if (
      post.loadPlanVehiclesID !== "" &&
      post.loadPlanVehiclesID !== undefined &&
      post.loadPlanVehiclesID !== null
    ) {
      const fetchAllOrderItemLoad = await LoadVehicleOrder.find({
        loadPlanVehicleID: post.loadPlanVehiclesID,
        orderDropWarehouseID: post.warehouseID,
        itemStatus: { $in: ["Partial Received", "Pending"] },
      });
      // const fetchAllOrderItemLoad = await LoadVehicleOrder.find({ loadPlanVehiclesID: post.loadPlanVehiclesID, dropWarehouseID: post.warehouseID, itemStatus: { $in: ['Partial Received', 'Pending'] } })
      if (fetchAllOrderItemLoad.length === 0) {
        const fetchDropWArehouseID = await LoadTrailerDropWarehouses.find({
          loadPlanVehiclesID: post.loadPlanVehiclesID,
          dropWarehouseID: post.warehouseID,
        });
        if (fetchDropWArehouseID[0].jobStatus === "Job Dropped" || fetchDropWArehouseID[0].jobStatus === "To be Dropped") {
          await LoadTrailerDropWarehouses.updateOne(
            {
              loadPlanVehiclesID: post.loadPlanVehiclesID,
              dropWarehouseID: post.warehouseID,
            },
            { $set: { jobStatus: "Job Completed", warehouseRecievedDateTime: new Date() } }
          );
        } else {
          await LoadTrailerDropWarehouses.updateOne(
            {
              loadPlanVehiclesID: post.loadPlanVehiclesID,
              dropWarehouseID: post.warehouseID,
            },
            { $set: { jobStatus: "Job Received" } }
          );
        }
      }
    } else {
      const fetchAllOrderItem = await OrderItems.find({
        orderID: fetchItem.orderID,
        itemStatus: { $in: ["Partial Received", "Pending"] },
      });
      if (fetchAllOrderItem.length === 0) {
        let jobDetail = await OrderDriverJob.find({
          orderID: fetchItem.orderID,
        });
        if (jobDetail[0].jobStatus === "Job Dropped" || jobDetail[0].jobStatus === "To be Dropped") {
          await OrderDriverJob.updateOne(
            { orderID: fetchItem.orderID },
            { $set: { jobStatus: "Job Completed", warehouseRecievedDateTime: new Date() } }
          );

          if (jobDetail[0].assignedDriverID) {
            const fetchUser = await Employee.aggregate([
              {
                $match: {
                  _id: mongoose.Types.ObjectId(jobDetail[0].assignedDriverID),
                },
              },

              {
                $project: {
                  fullName: { $concat: ["$firstName", " ", "$lastName"] },
                  _id: 1,
                  pushNotificationID: 1,
                },
              },
            ]);

            if (fetchUser.length > 0 && fetchUser[0].pushNotificationID) {
              await appNotification(
                [fetchUser[0].pushNotificationID],
                "Job Completed",
                "Job number " + jobDetail[0].jobNumber + " completed.",
                999999
              );

              let add = {};
              add.notificationID = 999999;
              add.userID = fetchUser[0]._id;
              add.shortText = "Job Completed";
              add.longText =
                "Job number " + jobDetail[0].jobNumber + " completed.";
              add.notificationStatus = "SENT";
              add.isSelected = false;
              add.sentDateTime = new Date(
                new Date() - new Date().getTimezoneOffset() * 60000
              );
              add.createdDate = new Date(
                new Date() - new Date().getTimezoneOffset() * 60000
              );
              const notification = new NotificationsModel(add);
              await notification.save();
            }
          }
        } else {
          await OrderDriverJob.updateOne(
            { orderID: fetchItem.orderID },
            { $set: { jobStatus: "Job Received" } }
          );
        }
      }
    }

    let successResponse = genericResponse(true, "Added Successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error==>", error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchReacherOrderByID = asyncHandler(async (req, res) => {
  const post = req.body;
  let fetch;
  try {
    if (
      post.loadPlanVehiclesID !== "" &&
      post.loadPlanVehiclesID !== undefined &&
      post.loadPlanVehiclesID !== null
    ) {
      fetch = await LoadVehicleOrder.aggregate([
        {
          $match: {
            loadPlanVehicleID: mongoose.Types.ObjectId(post.loadPlanVehiclesID),
            orderDropWarehouseID: mongoose.Types.ObjectId(post.warehouseID),
            orderID: mongoose.Types.ObjectId(post.orderID),
          },
        },

        {
          $lookup: {
            from: "orders",
            localField: "orderID",
            foreignField: "_id",
            as: "orders",
          },
        },
        { $unwind: "$orders" },
        {
          $lookup: {
            from: "order_items",
            localField: "orderItemID",
            foreignField: "_id",
            as: "items",
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            // orderItemID:"$orderItemID",
            _id: {
              orderItemID: "$orderItemID",
              barCodeID: "$items.barCodeID",
              notes: "$items.notes",
              // loadPlanVehicleID:"$fetchReacherOrderByID",
              shipmentType: "$orders.shipmentType",
              paymentType: "$orders.paymentType",
              businessUserID: "$orders.businessUserID",
              customerID: "$orders.customerID",
              receiverStateID: "$orders.receiverStateID",
              receiverCountryID: "$orders.receiverCountryID",
              selectUser: "$orders.selectUser",
              orderNumber: "$orders.orderNumber",
              orderStatus: "$orders.orderStatus",
              orderDate: "$orders.orderDate",
              senderName: "$orders.senderName",
              senderContactNumber: "$orders.senderContactNumber",
              senderStreetAddress: "$orders.senderStreetAddress",
              senderZipCode: "$orders.senderZipCode",
              senderCity: "$orders.senderCity",

              receiverName: "$orders.receiverName",
              receiverfirstName: "$orders.receiverfirstName",
              receiverlastName: "$orders.receiverlastName",
              receiverContactNumber: "$orders.receiverContactNumber",
              receiverStreetAddress: "$orders.receiverStreetAddress",
              receiverCity: "$orders.receiverCity",
              receiverZipCode: "$orders.receiverZipCode",

              _id: "$items._id",
              cargoType: "$items.cargoType",
              numberOfItems: "$items.numberOfItems",
              cargoTemperature: "$items.cargoTemperature",
              lengthInMm: "$items.lengthInMm",
              breadthInMm: "$items.breadthInMm",
              heightInMm: "$items.heightInMm",
              weightInKg: "$items.weightInKg",
              description: "$items.description",
              itemStatus: "$itemStatus",
              orderItemID: "$items._id",
              receivedQty: "$receivedQty",
              // loadVehicleOrderID: "$_id",
            },
            // uniqueDoc: { $first: "$$ROOT" }
          },
        },

        {
          $project: {
            barCodeID: "$_id.barCodeID",
            notes: "$_id.notes",
            // loadPlanVehicleID:"$_id.fetchReacherOrderByID",
            shipmentType: "$_id.shipmentType",
            paymentType: "$_id.paymentType",
            businessUserID: "$_id.businessUserID",
            customerID: "$_id.customerID",
            receiverStateID: "$_id.receiverStateID",
            receiverCountryID: "$_id.receiverCountryID",
            selectUser: "$_id.selectUser",
            orderNumber: "$_id.orderNumber",
            orderStatus: "$_id.orderStatus",
            orderDate: "$_id.orderDate",
            senderName: "$_id.senderName",
            senderContactNumber: "$_id.senderContactNumber",
            senderStreetAddress: "$_id.senderStreetAddress",
            senderZipCode: "$_id.senderZipCode",
            senderCity: "$_id.senderCity",

            receiverName: "$_id.receiverName",
            receiverfirstName: "$_id.receiverfirstName",
            receiverlastName: "$_id.receiverlastName",
            receiverContactNumber: "$_id.receiverContactNumber",
            receiverStreetAddress: "$_id.receiverStreetAddress",
            receiverCity: "$_id.receiverCity",
            receiverZipCode: "$_id.receiverZipCode",

            _id: "$_id._id",
            cargoType: "$_id.cargoType",
            numberOfItems: "$_id.numberOfItems",
            cargoTemperature: "$_id.cargoTemperature",
            lengthInMm: "$_id.lengthInMm",
            breadthInMm: "$_id.breadthInMm",
            heightInMm: "$_id.heightInMm",
            weightInKg: "$_id.weightInKg",
            description: "$_id.description",
            itemStatus: "$_id.itemStatus",
            orderItemID: "$_id.orderItemID",
            receivedQty: "$_id.receivedQty",
          },
        },
      ]);
    } else {
      fetch = await Orders.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(post.orderID) } },
        {
          $lookup: {
            from: "order_items",
            localField: "_id",
            foreignField: "orderID",
            as: "items",
          },
        },
        { $unwind: "$items" },
        {
          $project: {
            shipmentType: "$shipmentType",
            barCodeID: "$items.barCodeID",
            paymentType: "$paymentType",
            businessUserID: "$businessUserID",
            customerID: "$customerID",
            receiverStateID: "$receiverStateID",
            receiverCountryID: "$receiverCountryID",
            selectUser: "$selectUser",
            orderNumber: "$orderNumber",
            orderStatus: "$orderStatus",
            orderDate: "$orderDate",
            senderName: "$senderName",
            senderContactNumber: "$senderContactNumber",
            senderStreetAddress: "$senderStreetAddress",
            senderZipCode: "$senderZipCode",
            senderCity: "$senderCity",

            receiverName: "$receiverName",
            receiverfirstName: "$receiverfirstName",
            receiverlastName: "$receiverlastName",
            receiverContactNumber: "$receiverContactNumber",
            receiverStreetAddress: "$receiverStreetAddress",
            receiverCity: "$receiverCity",
            receiverZipCode: "$receiverZipCode",

            _id: "$items._id",
            notes: "$items.notes",
            cargoType: "$items.cargoType",
            numberOfItems: "$items.numberOfItems",
            cargoTemperature: "$items.cargoTemperature",
            lengthInMm: "$items.lengthInMm",
            breadthInMm: "$items.breadthInMm",
            heightInMm: "$items.heightInMm",
            weightInKg: "$items.weightInKg",
            description: "$items.description",
            itemStatus: "$items.itemStatus",
            orderItemID: "$items._id",
            receivedQty: "$items.receivedQty",
          },
        },
      ]);
    }
    if (fetch.length > 0) {
      let dateOptions = { month: "short", day: "2-digit", year: "numeric" };
      let timeOption = {
        timeZone: "UTC",
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      };
      fetch.forEach((element) => {
        let upDate = element.orderDate.toLocaleDateString("en-US", dateOptions);
        element.orderDate = upDate;
        // let upTime = element.orderDate.toLocaleTimeString("en-US", timeOption);
        // element.orderDate = (upDate + ' ' + upTime);
      });
      return res
        .status(200)
        .json(genericResponse(true, "order details fetched", fetch));
    } else {
      return res
        .status(202)
        .json(genericResponse(false, `Not fetch Order details`));
    }
  } catch (error) {
    console.log("error===>", error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});
const fetchPaymentIntent = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const post = req.body;
    let fetchOrder = await Orders.find({
      _id: mongoose.Types.ObjectId(post.orderID),
    });
    let fetchOrderItems = await OrderItems.find({
      orderID: mongoose.Types.ObjectId(post.orderID),
    });
    let businessUserID = fetchOrder[0].businessUserID;
    const receiverLocationLatitude = fetchOrder[0].receiverLocationLatitude;
    const receiverLocationLongitude = fetchOrder[0].receiverLocationLongitude;
    const senderLocationLatitude = fetchOrder[0].senderLocationLatitude;
    const senderLocationLongitude = fetchOrder[0].senderLocationLongitude;
    let warehouseList = await getWarehouse(
      senderLocationLatitude,
      senderLocationLongitude,
      post.businessUserID,
      fetchOrder[0].senderCity
    );
    if (warehouseList === "" || warehouseList === undefined) {
      let successResponse = genericResponse(
        false,
        "No Warehouse Located In Your City!",
        []
      );
      res.status(201).json(successResponse);
      return;
    }
    if (businessUserID !== "" && businessUserID !== undefined) {
      var unit = "metric";
      var originAPI =
        "https://maps.googleapis.com/maps/api/directions/json?origin=" +
        senderLocationLatitude +
        ", " +
        senderLocationLongitude +
        "&destination=" +
        receiverLocationLatitude +
        ", " +
        receiverLocationLongitude +
        "&units=" +
        unit +
        "&key=AIzaSyCNe-x9Jn_2903j9PxhLPw6SPGXMwIlkCM";

      const options = {
        method: "POST",
        uri: originAPI,
        body: req.body,
        json: true,
      };

      const response = await request(options);
      if (response.status === 'ZERO_RESULTS') {
        let errorRespnse = genericResponse(false, "No Route for this Address Kindly Change..", []);
        res.status(200).json(errorRespnse)
        return;
      }
      const totalDist = response.routes[0].legs[0].distance.value;
      const totalDistance = totalDist / 1000;
      const [pickupCharges, deliveryTimeEst, distanceTable] = await Promise.all([
        await ConsignmentPickupCharges.find({
          businessUserID: businessUserID,
          cpcFromDistance: { $lte: warehouseList.distance },
          cpcToDistance: { $gte: warehouseList.distance },
        }),
        await DeliveryTime.find({
          businessUserID: businessUserID,
          fromDistance: { $lte: parseInt(totalDistance) },
          toDistance: { $gte: parseInt(totalDistance) },
        }),
        await CargoWeightCharges.find({
          businessUserID: businessUserID,
          cwcFromDistance: { $lte: totalDistance },
          cwcToDistance: { $gte: totalDistance },
        })
      ])
      if (pickupCharges.length === 0) {
        let successResponse = genericResponse(false, "Something Went Wrong!", []);
        res.status(201).json(successResponse);
        return;
      }
      if (deliveryTimeEst.length === 0) {
        let successResponse = genericResponse(
          false,
          "Something Went Wrong!",
          []
        );
        res.status(201).json(successResponse);
        return;
      }
      if (distanceTable.length === 0) {
        let successResponse = genericResponse(
          false,
          "Something Went Wrong!",
          []
        );
        res.status(201).json(successResponse);
        return;
      }
      let orderVariableCharges = 0;
      let pickUpChargeAmount = 0;
      let shipmentCharegeAmount = 0;
      for (let data of fetchOrderItems) {
        let finalWeight;
        const cargoWeight = data.weightInKg * data.numberOfItems;
        const itemVolume =
          ((data.lengthInMm * data.breadthInMm * data.heightInMm) / 1000000000) *
          data.numberOfItems *
          333;
        if (itemVolume > cargoWeight) finalWeight = itemVolume;
        else finalWeight = cargoWeight;
        shipmentCharegeAmount +=
          finalWeight * distanceTable[0].cwcCargoWeightCharges;
        data.recordType = "U";
        data.lastModifiedDate = new Date(
          new Date() - new Date().getTimezoneOffset() * 60000
        );
        if (data.itemDescription === "PLT–Pallet") {
          data.itemVariableCharge = 0;
          if (fetchOrder[0].shipmentType !== "drop at Warehouse") {
            pickUpChargeAmount += pickupCharges[0].cpcPickupCharges * data.numberOfItems;
          }
          data.itemVariableCharge = (finalWeight * distanceTable[0].cwcCargoWeightCharges).toFixed(2);
          orderVariableCharges += (data.itemVariableCharge);

        } else {
          data.itemVariableCharge = 0;
          if (fetchOrder[0].shipmentType !== "drop at Warehouse") {
            pickUpChargeAmount += pickupCharges[0].cpcPickupCharge * Math.ceil(finalWeight / 1000);
          }
          data.itemVariableCharge = (finalWeight * distanceTable[0].cwcCargoWeightCharges).toFixed(2);
          orderVariableCharges += (data.itemVariableCharge);
        }

        await OrderItems.updateOne(
          { _id: mongoose.Types.ObjectId(data._id) },
          { $set: data }
        );
      }


      var queryNew = { _id: mongoose.Types.ObjectId(post.orderID) };
      let newData = {};
      newData.fixedCharges = pickUpChargeAmount.toFixed(2);
      newData.variableCharges = shipmentCharegeAmount.toFixed(2);
      newData.totalCharges = (orderVariableCharges + pickUpChargeAmount).toFixed(2);
      newData.distance = totalDistance;
      newData.estimatedDeliveryTime = deliveryTimeEst[0].deliveryTime;
      newData.startWarehouseID = warehouseList.warehouseID;
      var newValues = { $set: newData };
      await Orders.updateOne(queryNew, newValues);


      if (totalDistance !== "" && totalDistance !== undefined) {
        if (fetchOrder[0].paymentType === "Self-Payment") {
          const fetchUser = await Customer.find({
            _id: mongoose.Types.ObjectId(post.customerID),
          });
          const paymentIntent = await stripe.paymentIntents.create({
            customer: fetchUser[0].gatewayUserID,
            setup_future_usage: "off_session",
            amount: Math.round(orderVariableCharges * 100),
            currency: "aud",
            automatic_payment_methods: {
              enabled: true,
            },
            metadata: {
              businessUserID: post.businessUserID,
              paymentType: "Order",
              gatewayUserID: fetchUser[0].gatewayUserID,
              amount: Math.round(orderVariableCharges * 100),
              orderID: post.orderID,
            },
          });
          let data = [
            {
              paymentId: paymentIntent.id,
              paymentClientSlient: paymentIntent.client_secret,
            },
          ];
          let successResponse = genericResponse(
            true,
            "Data fetched successfully.",
            data
          );
          res.status(200).json(successResponse);
        } else {
          if (post.orderStatus === "Draft") {
            var query = { _id: mongoose.Types.ObjectId(post.orderID) };
            post.orderStatus = "New";

            if (
              fetchOrder[0].shipmentType &&
              fetchOrder[0].shipmentType === "drop at Warehouse"
            ) {
              post.orderStatus = "In Progress";
            }
            post.lastModifiedDate = new Date(
              new Date() - new Date().getTimezoneOffset() * 60000
            );
            post.recordType = "U";
            post.paymentStatus = "Successful";
            post.chargeCreditFlag = 1;
            var newValues = { $set: post };
            const order = await Orders.updateMany(query, newValues);
            const updateOrderList = await OrderItems.updateMany(
              { orderID: post.orderID },
              { $set: { itemStatus: "Pending" } }
            );
            // console.log("postss" , businessUserID)

            let dataTrack = {};
            dataTrack.orderID = post.orderID;
            dataTrack.statusDateTime = new Date(
              new Date() - new Date().getTimezoneOffset() * 60000
            );
            dataTrack.trackStatus = "Order Booked";
            dataTrack.createdDate = new Date(
              new Date() - new Date().getTimezoneOffset() * 60000
            );
            dataTrack.recordType = "I";
            const trackLog = new TrackStatusLogs(dataTrack);
            const insertResultTrack = await trackLog.save();
            let dataOrder = {};
            dataOrder.orderID = post.orderID;
            dataOrder.statusDateTime = new Date(
              new Date() - new Date().getTimezoneOffset() * 60000
            );
            dataOrder.orderStatus = "New";

            if (
              fetchOrder[0].shipmentType &&
              fetchOrder[0].shipmentType === "drop at Warehouse"
            ) {
              if (fetchOrder[0].paymentType === "Self-Payment") {
                dataOrder.orderStatus = "Payment Pending";
              } else {
                dataOrder.orderStatus = "In Progress";
              }

              (post.pickupContactName = fetchOrder[0].senderName),
                (post.pickupContactNumber = fetchOrder[0].senderContactNumber),
                (post.pickupStreetAddress = fetchOrder[0].senderStreetAddress),
                (post.pickupCity = fetchOrder[0].senderCity),
                (post.pickupZipCode = fetchOrder[0].senderZipCode),
                (post.pickupCountryID = fetchOrder[0].senderCountryID),
                (post.pickupStateID = fetchOrder[0].senderStateID),
                (post.orderNumber = fetchOrder[0].orderNumber),
                (post.jobNotes = post.notes),
                (post.createdDate = new Date(
                  new Date() - new Date().getTimezoneOffset() * 60000
                )),
                (post.recordType = "I"),
                (post.assignedDriverDateTime = new Date(
                  new Date() - new Date().getTimezoneOffset() * 60000
                ));
              if (
                fetchOrder[0].pickupWarehouseID !== undefined &&
                fetchOrder[0].pickupWarehouseID !== ""
              ) {
                let fetchWarehouse = await Warehouse.find({
                  _id: mongoose.Types.ObjectId(fetchOrder[0].pickupWarehouseID),
                });
                post.dropWarehouseID = fetchOrder[0].pickupWarehouseID;
                (post.dropContactName = fetchWarehouse[0].warehouseName),
                  (post.dropStreetAddress = fetchWarehouse[0].streetAddress),
                  (post.dropCity = fetchWarehouse[0].city),
                  (post.dropZipCode = fetchWarehouse[0].zipCode),
                  (post.dropCountryID = fetchWarehouse[0].countryId),
                  (post.dropStateID = fetchWarehouse[0].stateId),
                  (post.createdDate = new Date(
                    new Date() - new Date().getTimezoneOffset() * 60000
                  )),
                  (post.recordType = "I");
              }
              let jobNumber = 0;
              let fetchJob = await OrderDriverJob.find({
                businessUserID: mongoose.Types.ObjectId(post.businessUserID),
              })
                .sort({ _id: -1 })
                .limit(1);
              if (fetchJob.length > 0) {
                jobNumber = fetchJob[0].jobNumber + 1;
              } else {
                jobNumber += 1;
              }

              post.businessUserID = post.businessUserID;
              (post.jobNumber = jobNumber), delete post._id;
              const orderJobLog = new OrderDriverJob(post);

              const insertOrderJob = await orderJobLog.save();
              let fetchCredit = [
                {
                  $match: {
                    _id: mongoose.Types.ObjectId(businessUserID),
                  },
                },

                {
                  $lookup: {
                    from: "business_user_plans",
                    localField: "_id",
                    foreignField: "businessUserID",
                    as: "businessUserPlans",
                    pipeline: [
                      {
                        $sort: { _id: -1 },
                      },
                      {
                        $limit: 1,
                      },
                    ],
                  },
                },
                { $unwind: "$businessUserPlans" },

                {
                  $lookup: {
                    from: "plan_features",
                    localField: "businessUserPlans.planID",
                    foreignField: "planID",
                    as: "planFeatures",
                  },
                },
                { $unwind: "$planFeatures" },

                {
                  $lookup: {
                    from: "standard_features",
                    localField: "planFeatures.featureID",
                    foreignField: "_id",
                    pipeline: [
                      {
                        $match: {
                          featureCode: "CUPCB",
                        },
                      },
                    ],
                    as: "standardFeatures",
                  },
                },
                { $unwind: "$standardFeatures" },

                {
                  $project: {
                    availableCredits: 1,
                    featureCount: "$planFeatures.featureCount",
                  },
                },
              ];

              const fetchFeature = await BusinessUsers.aggregate(fetchCredit);

              if (
                fetchFeature[0].availableCredits < fetchFeature[0].featureCount
              ) {
                let successResponse = genericResponse(
                  true,
                  "Available Credits are Insufficient",
                  []
                );
                res.status(201).json(successResponse);
                return;
              }
              post.transactionDescription = "Order Placed";
              post.transactionDateTime = new Date(
                new Date() - new Date().getTimezoneOffset() * 60000
              );
              post.creditsBalance =
                fetchFeature[0].availableCredits - fetchFeature[0].featureCount;
              post.creditsUsed = fetchFeature[0].featureCount;
              post.creditsPurchased = 0;
              post.businessUserID = businessUserID;
              post.createdDate = new Date(
                new Date() - new Date().getTimezoneOffset() * 60000
              );
              await new BussinessUserCredit(post).save();
              await BusinessUsers.updateOne(
                { _id: mongoose.Types.ObjectId(businessUserID) },
                { $set: { availableCredits: post.creditsBalance } }
              );


            }
            dataOrder.createdDate = new Date(
              new Date() - new Date().getTimezoneOffset() * 60000
            );
            dataOrder.recordType = "I";
            const orderLog = new OrderStatusLogs(dataOrder);
            const insertResultOrder = await orderLog.save();

            let successResponse = genericResponse(
              true,
              "Order updated successfully.",
              []
            );
            res.status(201).json(successResponse);
            return;
          } else {
            const errorResponse = genericResponse(
              false,
              "orderStatus is not Valid",
              []
            );
            res.status(200).json(errorResponse);
            return;
          }
        }
      } else {
        let errorRespnse = genericResponse(
          false,
          "total Distance can't be Empty",
          []
        );
        res.status(200).json(errorRespnse);
        return;
      }
    } else {
      let errorRespnse = genericResponse(
        false,
        "BussinessUserID can't be Empty",
        []
      );
      res.status(200).json(errorRespnse);
      return;
    }
  } catch (error) {
    console.log("Catch in fetchPlans: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});
const addEditAddress = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (post.id !== "" && post.id !== undefined) {
      await CustomerOrderAddresses.updateOne(
        { _id: mongoose.Types.ObjectId(post.id) },
        { $set: post }
      );
      let successResponse = genericResponse(true, "Updated Successsfully!", []);
      res.status(200).json(successResponse);
      return;
    } else {
      post.createdDate = new Date(
        new Date() - new Date().getTimezoneOffset() * 60000
      );
      const savedAddress = await new CustomerOrderAddresses(post).save();
      if (savedAddress._id !== undefined) {
        let successResponse = genericResponse(true, "Added Succcessfully!", []);
        res.status(200).json(successResponse);
        return;
      } else {
        let successResponse = genericResponse(
          false,
          "Something went Wrong",
          []
        );
        res.status(200).json(successResponse);
        return;
      }
    }
  } catch (error) {
    console.log("Catch in fetchPlans: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchAddress = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = {
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
      customerStatus: "Active",
    };

    if (post.fetchByCustomerID !== "" && post.fetchByCustomerID !== undefined) {
      query._id = mongoose.Types.ObjectId(post.fetchByCustomerID);
    }
    const fetchAddressAndCustomer = await Customer.aggregate([
      { $match: query },

      {
        $lookup: {
          from: "customer_order_addresses",
          localField: "_id",
          foreignField: "customerID",
          as: "customerOrderAddress",
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          phoneNumber: 1,
          businessName: 1,
          address: "$customerOrderAddress",
        },
      },
    ]);
    let successResponse = genericResponse(
      true,
      "Address Fetched Succcessfully!",
      fetchAddressAndCustomer
    );
    res.status(200).json(successResponse);
    return;
  } catch (error) {
    console.log("Catch in fetchPlans: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchAddressByID = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post.id) };
    const fetchAddress = await CustomerOrderAddresses.findById(query);
    let successResponse = genericResponse(
      true,
      "Address Fetched Succcessfully!",
      fetchAddress
    );
    res.status(200).json(successResponse);
    return;
  } catch (error) {
    console.log("Catch in fetchPlans: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});
const deleteAddress = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const fetchAddress = await CustomerOrderAddresses.remove({
      _id: mongoose.Types.ObjectId(post.id),
    });
    let successResponse = genericResponse(true, " Deleted Succcessfully!", []);
    res.status(200).json(successResponse);
    return;
  } catch (error) {
    console.log("Catch in fetchPlans: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

export {
  fetchOrder,
  fetchOrderByID,
  fetchDriver,
  fetchDropLocation,
  assignJobToDriver,
  fetchCustomerBybusinessID,
  fetchCustomerDetailsById,
  addOrder,
  fetchWarehouseByID,
  addOrderItems,
  fetchOrderItems,
  orderStatusUpdate,
  editOrderforfinalbyId,
  updateOrderDetails,
  fetchOrderStatusLog,
  reAssignDriver,
  editOrderItemsforfinalbyId,
  deleteOrderItems,
  fetchOrderItemsByID,
  updateOrderItems,
  fetchCreditInfo,
  createGatewayUrl,
  webhook,
  successPage,
  updatePaymentStatus,
  getOrderCharges,
  GenerateOrderQRCode,
  fetchAddress,
  fetchOrderItemDetailsByID,
  updateItemStatus,
  fetchReacherOrderByID,
  fetchPaymentIntent,
  addEditAddress,
  fetchAddressByID,
  deleteAddress,
};
