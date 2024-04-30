import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import { appNotification, generateSearchParameterList } from '../routes/genericMethods.js';
import Warehouse from '../models/warehouseModel.js';
import Orders from '../models/ordersModel.js';
import OrderItems from '../models/orderItemsModel.js';
import Vehicle from '../models/vehicleModel.js';
import LoadPlanVehicles from '../models/loadPlanVehicleModel.js';
import parameterSettings from '../models/ParameterSettingModel.js';
import LoadVehicleSlot from '../models/loadVehicleSlotModel.js';
import LoadTrailerDropWarehouse from '../models/loadTrailerDropWarehouses.js';
import Employee from '../models/employeeBfmModel.js';
import LoadTrailerDropWarehouses from '../models/loadTrailerDropWarehouseModel.js';
import LoadTrailersVehicles from '../models/loadTrailersVehicleModel.js';
import OrderDriverJob from '../models/orderDriverJobsModel.js';
import LoadVehicleOrder from '../models/loadVehicleOrdersModel.js';
import { createRequire } from 'module';
import { fetchOrder } from './orderController.js';
import { query } from 'express';
import NotificationsModel from '../models/notificationModel.js';

const require = createRequire(import.meta.url);
const crypto = require('crypto');




// const fetchWarehouseOrderByStatus = asyncHandler(async (req, res) => {

//     try {
//         const post = req.body;

//         var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }


//         const fetchQuery = [
//             { $match: query },
//             {
//                 $lookup: {
//                     from: "order_driver_jobs",
//                     localField: "_id",
//                     foreignField: "orderID",
//                     as: "orderJobs"
//                 }
//             },
//             {
//                 $unwind: {
//                     path: "$orderJobs",
//                     preserveNullAndEmptyArrays: true
//                 }
//             },
//             {




//                 $match: {
//                     orderStatus: "In Progress",
//                     $or: [
//                         { "orderJobs.jobStatus":{$in:["Job Completed" ,"Job Reached","Job Received"] } },
//                         { "orderJobs.jobStatus": { $exists: false } }
//                     ]
//                 }

//             },

//             {
//                 $addFields: {
//                     shipmentTypeAndID: {

//                         ID: "$_id",
//                         orderNumber:"$orderNumber",
//                         orderStatus: "$orderStatus",
//                         jobStatus: "$orderJobs.jobStatus",

//                     }
//                 }
//             }
//         ];


//         const fetch = await Orders.aggregate(fetchQuery)

//         let arrData = []
//         for (let data of fetch) {

//             let orderItems = await OrderItems.find({ orderID: mongoose.Types.ObjectId(data._id) })

//             let totalWeight = 0;
//             let totalVolume = 0;

//             for (let i = 0; i < orderItems.length; i++) {
//                 const item = orderItems[i];
//                 const volume = item.lengthInMm * item.breadthInMm * item.heightInMm;
//                 totalVolume += volume;
//                 totalWeight += orderItems[i].weightInKg;
//             }


//             data.totalWeight = totalWeight;
//             data.totalVolume = totalVolume;
//             var dateOptions = { month: 'short', day: '2-digit', year: 'numeric' };
//             var timeOption = { timeZone: 'UTC', hour12: true, hour: '2-digit', minute: '2-digit', }

//             var upDate = data.orderDate.toLocaleDateString("en-US", dateOptions);
//             var upTime = data.orderDate.toLocaleTimeString("en-US", timeOption);
//             data.orderDate = upDate + ' ' + upTime;
//             var upDate1 = data.lastModifiedDate.toLocaleDateString("en-US", dateOptions);
//             var upTime1 = data.lastModifiedDate.toLocaleTimeString("en-US", timeOption);
//             data.lastModifiedDate = upDate1 + ' ' + upTime1;
//             arrData.push(data)
//         }

//         let successResponse = genericResponse(true, "Fetch Order Successfully!", arrData);
//         res.status(200).json(successResponse);

//     }
//     catch (error) {
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(400).json(errorRespnse);
//     }

// });

const fetchWarehouseOrderByStatus = asyncHandler(async (req, res) => {

    try {
        const post = req.body;
        let query = { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID), jobStatus: { $nin: ["Pending"], }, orderID: { $exists: true } }
        let order = []

        let warID = mongoose.Types.ObjectId(post.warehouseID)

        let combinedAggregation = [
            {
                $facet: {
                    LoadTrailerDropWarehouses: [

                        {
                            $lookup: {
                                from: "load_trailer_dropwarehouses",
                                localField: "_id",
                                foreignField: "jobID",
                                pipeline: [
                                    { $match: { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },
                                ],
                                as: "loadTrailerDropwarehouses",
                            }
                        },
                        { $unwind: "$loadTrailerDropwarehouses" },

                        {
                            $lookup: {
                                from: "order_driver_jobs",
                                localField: "loadTrailerDropwarehouses.jobID",
                                foreignField: "_id",
                                as: "job",
                            }
                        },
                        { $unwind: "$job" },
                        {
                            $lookup: {
                                from: "load_vehicle_orders",
                                localField: "loadTrailerDropwarehouses.loadPlanVehiclesID",
                                foreignField: "loadPlanVehicleID",
                                pipeline: [
                                    { $match: { orderDropWarehouseID: warID } }

                                ],
                                as: "loadVehicleOrder",
                            }
                        },
                        { $unwind: "$loadVehicleOrder" },
                        {
                            $lookup: {
                                from: "orders",
                                localField: "loadVehicleOrder.orderID",
                                foreignField: "_id",
                                as: "order",
                            }
                        },
                        { $unwind: "$order" },
                        {
                            $lookup: {
                                from: "order_items",
                                localField: "order._id",
                                foreignField: "orderID",
                                as: "orderItems",
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    orderID: "$order._id",
                                    orderNumber: "$order.orderNumber",
                                    orderItem: "$orderItems",
                                    orderDate: "$order.orderDate",
                                    senderCity: "$order.senderCity",
                                    receiverCity: "$order.receiverCity",
                                    receiverName: "$order.receiverName",
                                    jobStatus: "$loadTrailerDropwarehouses.jobStatus",
                                    jobNumber: "$job.jobNumber",
                                    loadPlanVehiclesID: "$loadTrailerDropwarehouses.loadPlanVehiclesID",
                                    pickedDateTime: "$job.pickedDateTime",
                                    reachedDateTime: "$job.reachedDateTime",
                                    droppedDateTime: "$job.droppedDateTime",
                                    warehouseRecievedDateTime: "$job.warehouseRecievedDateTime"
                                },

                                totalWeight: {
                                    $sum: {
                                        $reduce: {
                                            input: "$orderItems",
                                            initialValue: 0,
                                            in: { $add: ["$$value", "$$this.weightInKg"] },
                                        },
                                    },
                                },
                                totalVolume: {
                                    $sum: {
                                        $reduce: {
                                            input: "$orderItems",
                                            initialValue: 0,
                                            in: {
                                                $add: [
                                                    "$$value",
                                                    {
                                                        $divide: [
                                                            { $multiply: ["$$this.lengthInMm", "$$this.breadthInMm", "$$this.heightInMm", "$$this.numberOfItems"] },
                                                            1000000000,
                                                        ],
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                },


                            },
                        },

                        {

                            $project: {
                                _id: 0,
                                orderID: "$_id.orderID",
                                orderDa: "$_id.orderDate",
                                jobNumber: "$_id.jobNumber",
                                warehouseRecievedDateTime: {
                                    $concat: [
                                        {
                                            $let: {
                                                vars: {
                                                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                                    date: "$_id.warehouseRecievedDateTime" // Assuming this is your date field
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

                                reachedDateTime: {
                                    $concat: [
                                        {
                                            $let: {
                                                vars: {
                                                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                                    date: "$_id.reachedDateTime" // Assuming this is your date field
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
                                pickedDateTime: {
                                    $concat: [
                                        {
                                            $let: {
                                                vars: {
                                                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                                    date: "$_id.pickedDateTime" // Assuming this is your date field
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
                                orderDate: {
                                    $concat: [
                                        {
                                            $let: {
                                                vars: {
                                                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                                    date: "$_id.orderDate" // Assuming this is your date field
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
                                senderCity: "$_id.senderCity",
                                receiverCity: "$_id.receiverCity",
                                receiverName: "$_id.receiverName",
                                jobStatus: "$_id.jobStatus",
                                totalWeight: "$totalWeight",
                                totalVolume: "$totalVolume",
                                orderNumber: "$_id.orderNumber",
                                loadPlanVehiclesID: "$_id.loadPlanVehiclesID",
                                shipmentTypeAndID: { jobStatus: "$_id.jobStatus", ID: "$_id.orderID", orderNumber: "$_id.orderNumber", loadPlanVehiclesID: "$_id.loadPlanVehiclesID", }
                            }
                        },
                    ],
                    orderDriverJobs: [

                        { $match: query },
                        {
                            $lookup: {
                                from: "orders",
                                localField: "orderID",
                                foreignField: "_id",
                                as: "orders",
                            }
                        },
                        { $unwind: "$orders" },
                        {
                            $lookup: {
                                from: "order_items",
                                localField: "orders._id",
                                foreignField: "orderID",
                                as: "orderItems",
                            }
                        },
                        // {$unwind:"$orderItems"},
                        {
                            $group: {
                                _id: {
                                    orderID: "$orders._id",
                                    orderNumber: "$orders.orderNumber",
                                    orderItem: "$orderItems",
                                    orderDate: "$orders.orderDate",
                                    senderCity: "$orders.senderCity",
                                    receiverCity: "$orders.receiverCity",
                                    receiverName: "$orders.receiverName",
                                    jobStatus: "$jobStatus",
                                    droppedDateTime: "$droppedDateTime",
                                    reachedDateTime: "$reachedDateTime",
                                    pickedDateTime: "$pickedDateTime",
                                    warehouseRecievedDateTime: "$warehouseRecievedDateTime"
                                },
                                totalWeight: {
                                    $sum: {
                                        $reduce: {
                                            input: "$orderItems",
                                            initialValue: 0,
                                            in: { $add: ["$$value", "$$this.weightInKg"] },
                                        },
                                    },
                                },
                                totalVolume: {
                                    $sum: {
                                        $reduce: {
                                            input: "$orderItems",
                                            initialValue: 0,
                                            in: {
                                                $add: [
                                                    "$$value",
                                                    {
                                                        $divide: [
                                                            { $multiply: ["$$this.lengthInMm", "$$this.breadthInMm", "$$this.heightInMm", "$$this.numberOfItems"] },
                                                            1000000000,
                                                        ],
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                },
                            },
                        },

                        {

                            $project: {
                                _id: 0,
                                orderID: "$_id.orderID",
                                orderDa: "$_id.orderDate",
                                warehouseRecievedDateTime: {
                                    $concat: [
                                        {
                                            $let: {
                                                vars: {
                                                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                                    date: "$_id.warehouseRecievedDateTime" // Assuming this is your date field
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
                                droppedDateTime: {
                                    $concat: [
                                        {
                                            $let: {
                                                vars: {
                                                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                                    date: "$_id.droppedDateTime" // Assuming this is your date field
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
                                reachedDateTime: {
                                    $concat: [
                                        {
                                            $let: {
                                                vars: {
                                                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                                    date: "$_id.reachedDateTime" // Assuming this is your date field
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
                                pickedDateTime: {
                                    $concat: [
                                        {
                                            $let: {
                                                vars: {
                                                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                                    date: "$_id.pickedDateTime" // Assuming this is your date field
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
                                orderDate: {
                                    $concat: [
                                        {
                                            $let: {
                                                vars: {
                                                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                                    date: "$_id.orderDate" // Assuming this is your date field
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
                                senderCity: "$_id.senderCity",
                                receiverCity: "$_id.receiverCity",
                                receiverName: "$_id.receiverName",
                                jobStatus: "$_id.jobStatus",
                                totalWeight: "$totalWeight",
                                totalVolume: "$totalVolume",
                                orderNumber: "$_id.orderNumber",
                                shipmentTypeAndID: { jobStatus: "$_id.jobStatus", ID: "$_id.orderID", orderNumber: "$_id.orderNumber" }
                            }
                        },
                        {
                            $sort: { orderDa: -1 }
                        },
                    ]
                }
            },
            {
                $project: {
                    combinedResults: {
                        $concatArrays: ["$LoadTrailerDropWarehouses", "$orderDriverJobs"]
                    }
                }
            },
            {
                $unwind: "$combinedResults"
            },
            {
                $replaceRoot: { newRoot: "$combinedResults" }
            }

        ];

        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: { orderNumber: -1 } };
        let myAggregation = OrderDriverJob.aggregate()
        myAggregation._pipeline = combinedAggregation
        OrderDriverJob.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch data", []);
                    res.status(400).json(errorResponse);
                } else {
                    console.log("DFgdfgdgdf", result)
                    const successResponse = genericResponse(true, "Data fetched successfully", result);
                    res.status(200).json(successResponse);
                }
            }
        );


    }
    catch (error) {
        console.log("eroor ==>", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});


const fetchWarehouseOrderForFinalDelivery = asyncHandler(async (req, res) => {

    try {
        const post = req.body;
        let query = { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID), jobStatus: { $nin: ["Pending"] } }
        let order = []

        let warID = mongoose.Types.ObjectId(post.warehouseID)
        const fetchLoadPlan = await LoadTrailerDropWarehouses.aggregate([
            { $match: { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },

            {
                $lookup: {
                    from: "load_vehicle_orders",
                    localField: "loadPlanVehiclesID",
                    foreignField: "loadPlanVehicleID",
                    pipeline: [
                        { $match: { orderDropWarehouseID: warID, itemStatus: { $in: ["Pending", "Partial Received", "Delivered"] } } },

                    ],
                    as: "loadVehicleOrders",
                }
            },
            { $unwind: "$loadVehicleOrders" },
        ])
        const OrderList = fetchLoadPlan.map(data => mongoose.Types.ObjectId(data.loadVehicleOrders.orderID))
        const fetchOders = await LoadTrailerDropWarehouses.aggregate([
            { $match: { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },

            {
                $lookup: {
                    from: "order_driver_jobs",
                    localField: "jobID",
                    foreignField: "_id",
                    as: "job",
                }
            },
            { $unwind: "$job" },
            {
                $lookup: {
                    from: "load_vehicle_orders",
                    localField: "loadPlanVehiclesID",
                    foreignField: "loadPlanVehicleID",
                    pipeline: [
                        { $match: { orderDropWarehouseID: warID, orderID: { $nin: OrderList } } }

                    ],
                    as: "loadVehicleOrder",
                }
            },
            { $unwind: "$loadVehicleOrder" },
            {
                $lookup: {
                    from: "orders",
                    localField: "loadVehicleOrder.orderID",
                    foreignField: "_id",
                    pipeline: [
                        { $match: { jobID: { $exists: false } } }
                    ],
                    as: "order",
                }
            },
            { $unwind: "$order" },
            {
                $lookup: {
                    from: "order_items",
                    localField: "order._id",
                    foreignField: "orderID",
                    as: "orderItems",
                }
            },
            {
                $group: {
                    _id: {
                        orderID: "$order._id",
                        receiverStreetAddress: "$order.receiverStreetAddress",
                        customerID: "$order.customerID",
                        orderNumber: "$order.orderNumber",
                        orderItem: "$orderItems",
                        orderDate: "$order.orderDate",
                        senderCity: "$order.senderCity",
                        receiverCity: "$order.receiverCity",
                        receiverName: "$order.receiverName",
                        jobStatus: "$jobStatus",
                        loadPlanVehiclesID: "$loadPlanVehiclesID"
                    },
                    totalWeight: {
                        $sum: {
                            $reduce: {
                                input: "$orderItems",
                                initialValue: 0,
                                in: { $add: ["$$value", "$$this.weightInKg"] },
                            },
                        },
                    },
                    totalVolume: {
                        $sum: {
                            $reduce: {
                                input: "$orderItems",
                                initialValue: 0,
                                in: {
                                    $add: [
                                        "$$value",
                                        {
                                            $divide: [
                                                { $multiply: ["$$this.lengthInMm", "$$this.breadthInMm", "$$this.heightInMm", "$$this.numberOfItems"] },
                                                1000000000,
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },

                    // totalWeight: { $sum: "$orderItems.weightInKg" },
                    // totalVolume: {
                    //     $sum: {
                    //       $divide: [
                    //         { $multiply: ["$orderItems.lengthInMm", "$orderItems.breadthInMm", "$orderItems.heightInMm", "$orderItems.numberOfItems"] },
                    //         50000000,
                    //       ],
                    //     },
                    //   }
                },
            },

            {

                $project: {
                    _id: 0,
                    orderID: "$_id.orderID",
                    orderDa: "$_id.orderDate",
                    customerID: "$_id.customerID",
                    receiverStreetAddress: "$_id.receiverStreetAddress",
                    orderDate: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$_id.orderDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$_id.orderDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$_id.orderDate" } },
                        ]
                    },

                    senderCity: "$_id.senderCity",
                    receiverCity: "$_id.receiverCity",
                    receiverName: "$_id.receiverName",
                    jobStatus: "$_id.jobStatus",
                    totalWeight: "$totalWeight",
                    totalVolume: "$totalVolume",
                    orderNumber: "$_id.orderNumber",
                    loadPlanVehiclesID: "$_id.loadPlanVehiclesID",
                    shipmentTypeAndID: { jobStatus: "$_id.jobStatus", ID: "$_id.orderID", orderNumber: "$_id.orderNumber", loadPlanVehiclesID: "$_id.loadPlanVehiclesID", }
                }
            }
        ])
        const fetchOrderJob = await OrderDriverJob.aggregate([

            { $match: { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },
            {
                $lookup: {
                    from: "order_items",
                    localField: "orderID",
                    foreignField: "orderID",
                    pipeline: [
                        { $match: { itemStatus: { $in: ["Pending", "Partial Received", "Delivered"] } } }

                    ],
                    as: "orderItems",
                }
            },
            { $unwind: "$orderItems" },

        ])
        const OrderIDS = fetchOrderJob.map(data => mongoose.Types.ObjectId(data.orderItems.orderID))

        fetchOders.map(orders => {
            orders.totalVolume = parseFloat(orders.totalVolume).toFixed(2)
            order.push(orders)
        })

        const fetchOder = await OrderDriverJob.aggregate([


            { $match: query },
            {
                $lookup: {
                    from: "orders",
                    localField: "orderID",
                    pipeline: [
                        { $match: { _id: { $nin: OrderIDS }, jobID: { $exists: false } } }
                    ],
                    foreignField: "_id",
                    as: "orders",
                }
            },
            { $unwind: "$orders" },
            {
                $lookup: {
                    from: "order_items",
                    localField: "orders._id",
                    foreignField: "orderID",

                    as: "orderItems",
                }
            },
            // {$unwind:"$orderItems"},
            {
                $group: {
                    _id: {
                        orderID: "$orders._id",
                        orderNumber: "$orders.orderNumber",
                        orderItem: "$orderItems",
                        receiverStreetAddress: "$orders.receiverStreetAddress",
                        customerID: "$orders.customerID",
                        orderDate: "$orders.orderDate",
                        senderCity: "$orders.senderCity",
                        receiverCity: "$orders.receiverCity",
                        receiverName: "$orders.receiverName",
                        jobStatus: "$jobStatus"
                    },
                    totalWeight: {
                        $sum: {
                            $reduce: {
                                input: "$orderItems",
                                initialValue: 0,
                                in: { $add: ["$$value", "$$this.weightInKg"] },
                            },
                        },
                    },
                    totalVolume: {
                        $sum: {
                            $reduce: {
                                input: "$orderItems",
                                initialValue: 0,
                                in: {
                                    $add: [
                                        "$$value",
                                        {
                                            $divide: [
                                                { $multiply: ["$$this.lengthInMm", "$$this.breadthInMm", "$$this.heightInMm", "$$this.numberOfItems"] },
                                                1000000000,
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },

                    // totalWeight: { $sum: "$orderItems.weightInKg" },
                    // totalVolume: {
                    //     $sum: {
                    //       $divide: [
                    //         { $multiply: ["$orderItems.lengthInMm", "$orderItems.breadthInMm", "$orderItems.heightInMm", "$orderItems.numberOfItems"] },
                    //         50000000,
                    //       ],
                    //     },
                    //   }
                },
            },

            {

                $project: {
                    _id: 0,
                    orderID: "$_id.orderID",
                    orderDa: "$_id.orderDate",
                    customerID: "$_id.customerID",
                    receiverStreetAddress: "$_id.receiverStreetAddress",
                    orderDate: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$_id.orderDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$_id.orderDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$_id.orderDate" } },
                        ]
                    },
                    senderCity: "$_id.senderCity",
                    receiverCity: "$_id.receiverCity",
                    receiverName: "$_id.receiverName",
                    jobStatus: "$_id.jobStatus",
                    totalWeight: "$totalWeight",
                    totalVolume: "$totalVolume",
                    orderNumber: "$_id.orderNumber",
                    shipmentTypeAndID: { jobStatus: "$_id.jobStatus", ID: "$_id.orderID", orderNumber: "$_id.orderNumber" }
                }
            }
        ])
        fetchOder.map(orders => {
            orders.totalVolume = parseFloat(orders.totalVolume).toFixed(2)
            order.push(orders)
        })



        //   let filtereData =[]
        //     for(let data of order){

        //         const fetchData = await Orders.find({_id:mongoose.Types.ObjectId(data.orderID) ,jobID:{$exists:false }} )
        //         if(fetchData.length > 0){
        //             filtereData.push(data)
        //         }

        //     }
        // const orderIDS = order.map(data => mongoose.Types.ObjectId(data.orderID))

        // const fetchData = await Orders.find({_id:{$in:orderIDS}, jobID:{$exists:true }} )


        // console.log("Orders", filtereData)
        // return

        let finalArr = []
        for (let filter of order) {
            const fetchOrder = await LoadPlanVehicles.aggregate([
                { $match: { warehouseID: mongoose.Types.ObjectId(post.warehouseID) } },
                {
                    $lookup: {
                        from: "load_vehicle_orders",
                        localField: "_id",
                        foreignField: "loadPlanVehicleID",
                        pipeline: [
                            { $match: { orderID: mongoose.Types.ObjectId(filter.orderID) } }
                        ],
                        as: "loadPlanVehicleID",
                    }
                },
                { $unwind: "$loadPlanVehicleID" },
                {
                    $project: {
                        orderID: "$loadPlanVehicleID.orderID"
                    }
                }
            ])
            if (fetchOrder.length === 0) {
                finalArr.push(filter)
            }
        }

        console.log("fsdfsdf", finalArr)

        let successResponse = genericResponse(true, "Fetch Order Successfully!", finalArr);
        res.status(200).json(successResponse);

    }
    catch (error) {
        console.log("eroor ==>", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});

// const fetchWarehouseOrderForFinalDelivery = asyncHandler(async (req, res) => {

//     try {
//         const post = req.body;
//         let query
//         let order = []
//         if (post.state === "Pending") {
//             query = { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) }
//         } else if (post.state === "Recieve") {
//             query = { senderWarehouseID: mongoose.Types.ObjectId(post.warehouseID) }
//         }
//         let warID = mongoose.Types.ObjectId(post.warehouseID)
//         const fetchOders = await LoadTrailerDropWarehouses.aggregate([
//             { $match: { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },

//             {
//                 $lookup: {
//                     from: "order_driver_jobs",
//                     localField: "jobID",
//                     foreignField: "_id",
//                     as: "job",
//                 }
//             },
//             { $unwind: "$job" },
//             {
//                 $lookup: {
//                     from: "load_vehicle_orders",
//                     localField: "loadPlanVehiclesID",
//                     foreignField: "loadPlanVehicleID",
//                     pipeline: [
//                         { $match: { orderDropWarehouseID: warID, itemStatus: "Received" } }

//                     ],
//                     as: "loadVehicleOrder",
//                 }
//             },
//             { $unwind: "$loadVehicleOrder" },
//             {
//                 $lookup: {
//                     from: "orders",
//                     localField: "loadVehicleOrder.orderID",
//                     foreignField: "_id",
//                     as: "order",
//                 }
//             },
//             { $unwind: "$order" },
//             {
//                 $lookup: {
//                     from: "order_items",
//                     localField: "order._id",
//                     foreignField: "orderID",
//                     as: "orderItems",
//                 }
//             },
//             { $unwind: "$orderItems" },
//             {
//                 $project: {

//                     orderID: "$order._id",
//                     orderNumber: "$order.orderNumber",
//                     senderName: "$order.senderName",
//                     orderDate: {
//                         $concat: [
//                             {
//                                 $let: {
//                                     vars: {
//                                         monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
//                                     },
//                                     in: {
//                                         $arrayElemAt: ['$$monthsInString', { $month: "$order.orderDate" }]
//                                     }
//                                 }
//                             },
//                             { $dateToString: { format: "%d", date: "$order.orderDate" } }, ", ",
//                             { $dateToString: { format: "%Y", date: "$order.orderDate" } },
//                         ]
//                     },
//                     senderCity: "$order.senderCity",
//                     receiverCity: "$order.receiverCity",
//                     receiverName: "$order.receiverName",
//                     jobStatus: "$jobStatus",
//                     loadPlanVehiclesID: "$loadPlanVehiclesID",
//                     weightInKg: "$orderItems.weightInKg",
//                     heightInMm: "$orderItems.heightInMm",
//                     breadthInMm: "$orderItems.breadthInMm",
//                     lengthInMm: "$orderItems.lengthInMm",
//                     numberOfItems: "$orderItems.numberOfItems",
//                     description: "$orderItems.description",
//                     cargoTemperature: "$orderItems.cargoTemperature",
//                     cargoType: "$orderItems.cargoType",
//                     _id: "$orderItems._id",
//                 },
//             },
//         ])

//         fetchOders.map(orders => {
//             orders.totalVolume = parseFloat(orders.totalVolume).toFixed(2)
//             order.push(orders)
//         })
//         const fetchOder = await OrderDriverJob.aggregate([


//             { $match: { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },
//             {
//                 $lookup: {
//                     from: "orders",
//                     localField: "orderID",
//                     foreignField: "_id",
//                     as: "order",
//                 }
//             },
//             { $unwind: "$order" },
//             {
//                 $lookup: {
//                     from: "order_items",
//                     localField: "order._id",
//                     foreignField: "orderID",
//                     pipeline: [
//                         { $match: { itemStatus: "Received" } }

//                     ],
//                     as: "orderItems",
//                 }
//             },
//             { $unwind: "$orderItems" },
//             {
//                 $project: {

//                     orderID: "$order._id",
//                     orderNumber: "$order.orderNumber",
//                     senderName: "$order.senderName",
//                     senderCity: "$order.senderCity",
//                     receiverCity: "$order.receiverCity",
//                     receiverName: "$order.receiverName",
//                     jobStatus: "$jobStatus",
//                     weightInKg: "$orderItems.weightInKg",
//                     heightInMm: "$orderItems.heightInMm",
//                     breadthInMm: "$orderItems.breadthInMm",
//                     lengthInMm: "$orderItems.lengthInMm",
//                     numberOfItems: "$orderItems.numberOfItems",
//                     description: "$orderItems.description",
//                     cargoTemperature: "$orderItems.cargoTemperature",
//                     cargoType: "$orderItems.cargoType",
//                     _id: "$orderItems._id",
//                     orderDate: {
//                         $concat: [
//                             {
//                                 $let: {
//                                     vars: {
//                                         monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
//                                     },
//                                     in: {
//                                         $arrayElemAt: ['$$monthsInString', { $month: "$order.orderDate" }]
//                                     }
//                                 }
//                             },
//                             { $dateToString: { format: "%d", date: "$order.orderDate" } }, ", ",
//                             { $dateToString: { format: "%Y", date: "$order.orderDate" } },
//                         ]
//                     },



//                 },
//             },


//         ])
//         fetchOder.map(orders => {
//             orders.totalVolume = parseFloat(orders.totalVolume).toFixed(2)
//             order.push(orders)
//         })
//         let successResponse = genericResponse(true, "Fetch Order Successfully!", order);
//         res.status(200).json(successResponse);

//     }
//     catch (error) {
//         console.log("eroor ==>", error.message)
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(400).json(errorRespnse);
//     }

// });
const fetchWarehouseOrderForAllocate = asyncHandler(async (req, res) => {

    try {
        const post = req.body;
        let query
        let order = []

        query = { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID), jobStatus: { $nin: ["Pending"] } }

        let warID = mongoose.Types.ObjectId(post.warehouseID)



        const fetchLoadPlan = await LoadTrailerDropWarehouses.aggregate([
            { $match: { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },

            {
                $lookup: {
                    from: "load_vehicle_orders",
                    localField: "loadPlanVehiclesID",
                    foreignField: "loadPlanVehicleID",
                    pipeline: [
                        { $match: { orderDropWarehouseID: warID, itemStatus: { $in: ["Pending", "Partial Received", "Delivered"] } } },

                    ],
                    as: "loadVehicleOrders",
                }
            },
            { $unwind: "$loadVehicleOrders" },
        ])
        const OrderList = fetchLoadPlan.map(data => mongoose.Types.ObjectId(data.loadVehicleOrders.orderID))
        const fetchOders = await LoadTrailerDropWarehouses.aggregate([
            { $match: { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },

            {
                $lookup: {
                    from: "order_driver_jobs",
                    localField: "jobID",
                    foreignField: "_id",
                    as: "job",
                }
            },
            { $unwind: "$job" },
            {
                $lookup: {
                    from: "load_vehicle_orders",
                    localField: "loadPlanVehiclesID",
                    foreignField: "loadPlanVehicleID",
                    pipeline: [
                        { $match: { orderDropWarehouseID: warID, orderID: { $nin: OrderList } } }

                    ],
                    as: "loadVehicleOrder",
                }
            },
            { $unwind: "$loadVehicleOrder" },
            {
                $lookup: {
                    from: "orders",
                    localField: "loadVehicleOrder.orderID",
                    foreignField: "_id",
                    pipeline: [
                        { $match: { jobID: { $exists: false } } }
                    ],
                    as: "order",
                }
            },
            { $unwind: "$order" },
            {
                $lookup: {
                    from: "customers",
                    localField: "order.customerID",
                    foreignField: "_id",
                    as: "customers",
                }
            },
            {
                $unwind: {
                    path: "$customers",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "order_items",
                    localField: "order._id",
                    foreignField: "orderID",
                    as: "orderItems",
                }
            },
            { $unwind: "$orderItems" },
            {
                $group: {
                    _id: {
                        _id: "$orderItems._id",
                        orderID: "$orderItems.orderID",
                        orderNumber: "$order.orderNumber",
                        senderName: "$order.senderName",
                        customerCode: "$customers.customerCode",
                        senderCity: "$order.senderCity",
                        receiverCity: "$order.receiverCity",
                        receiverName: "$order.receiverName",
                        loadPlanVehiclesID: "$loadPlanVehiclesID",
                        jobStatus: "$jobStatus",
                        weightInKg: "$orderItems.weightInKg",
                        heightInMm: "$orderItems.heightInMm",
                        breadthInMm: "$orderItems.breadthInMm",
                        lengthInMm: "$orderItems.lengthInMm",
                        numberOfItems: "$orderItems.numberOfItems",
                        barCodeID: "$orderItems.barCodeID",
                        description: "$orderItems.description",
                        cargoTemperature: "$orderItems.cargoTemperature",
                        cargoType: "$orderItems.cargoType",
                        itemStatus: "$orderItems.itemStatus",

                        orderDate: {
                            $concat: [
                                {
                                    $let: {
                                        vars: {
                                            monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                        },
                                        in: {
                                            $arrayElemAt: ['$$monthsInString', { $month: "$order.orderDate" }]
                                        }
                                    }
                                },
                                { $dateToString: { format: "%d", date: "$order.orderDate" } }, ", ",
                                { $dateToString: { format: "%Y", date: "$order.orderDate" } },
                            ]
                        },

                    }



                },
            },

            {
                $project: {

                    orderID: "$_id.orderID",
                    orderNumber: "$_id.orderNumber",
                    senderName: "$_id.senderName",
                    customerCode: "$_id.customerCode",
                    itemStatus: "$_id.itemStatus",
                    orderDate: "$_id.orderDate",
                    senderCity: "$_id.senderCity",
                    receiverCity: "$_id.receiverCity",
                    receiverName: "$_id.receiverName",
                    jobStatus: "$_id.jobStatus",
                    loadPlanVehiclesID: "$_id.loadPlanVehiclesID",
                    weightInKg: "$_id.weightInKg",
                    heightInMm: "$_id.heightInMm",
                    breadthInMm: "$_id.breadthInMm",
                    lengthInMm: "$_id.lengthInMm",
                    numberOfItems: "$_id.numberOfItems",
                    barCodeID: "$_id.barCodeID",
                    description: "$_id.description",
                    cargoTemperature: "$_id.cargoTemperature",
                    cargoType: "$_id.cargoType",
                    _id: "$_id._id",
                },
            },
        ])
        fetchOders.map(orders => {
            orders.totalVolume = parseFloat(orders.totalVolume).toFixed(2)
            order.push(orders)
        })
        const fetchOrderJob = await OrderDriverJob.aggregate([

            { $match: { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },
            {
                $lookup: {
                    from: "order_items",
                    localField: "orderID",
                    foreignField: "orderID",
                    pipeline: [
                        { $match: { itemStatus: { $in: ["Pending", "Partial Received", "Delivered"] } } }

                    ],
                    as: "orderItems",
                }
            },
            { $unwind: "$orderItems" },

        ])
        const OrderIDS = fetchOrderJob.map(data => mongoose.Types.ObjectId(data.orderItems.orderID))
        const fetchOder = await OrderDriverJob.aggregate([
            { $match: { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },
            {
                $lookup: {
                    from: "orders",
                    localField: "orderID",
                    foreignField: "_id",
                    pipeline: [
                        { $match: { jobID: { $exists: false } } }
                    ],
                    as: "order",
                }
            },
            { $unwind: "$order" },
            {
                $lookup: {
                    from: "customers",
                    localField: "order.customerID",
                    foreignField: "_id",
                    as: "customers",
                }
            },
            {
                $unwind: {
                    path: "$customers",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "order_items",
                    localField: "order._id",
                    foreignField: "orderID",
                    pipeline: [
                        { $match: { orderID: { $nin: OrderIDS } } }
                    ],
                    as: "orderItems",
                }
            },
            { $unwind: "$orderItems" },
            {
                $project: {

                    orderID: "$order._id",
                    orderNumber: "$order.orderNumber",
                    senderName: "$order.senderName",
                    customerCode: "$customers.customerCode",
                    senderCity: "$order.senderCity",
                    receiverCity: "$order.receiverCity",
                    receiverName: "$order.receiverName",
                    jobStatus: "$jobStatus",
                    weightInKg: "$orderItems.weightInKg",
                    heightInMm: "$orderItems.heightInMm",
                    breadthInMm: "$orderItems.breadthInMm",
                    lengthInMm: "$orderItems.lengthInMm",
                    numberOfItems: "$orderItems.numberOfItems",
                    barCodeID: "$orderItems.barCodeID",
                    description: "$orderItems.description",
                    cargoTemperature: "$orderItems.cargoTemperature",
                    cargoType: "$orderItems.cargoType",
                    itemStatus: "$orderItems.itemStatus",
                    _id: "$orderItems._id",
                    orderDate: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$order.orderDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$order.orderDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$order.orderDate" } },
                        ]
                    },

                },
            },


        ])


        // return
        fetchOder.map(orders => {
            orders.totalVolume = parseFloat(orders.totalVolume).toFixed(2)
            order.push(orders)
        })
        let finalArr = []
        for (let filter of order) {
            const fetchOrder = await LoadPlanVehicles.aggregate([
                { $match: { warehouseID: mongoose.Types.ObjectId(post.warehouseID) } },
                {
                    $lookup: {
                        from: "load_vehicle_orders",
                        localField: "_id",
                        foreignField: "loadPlanVehicleID",
                        pipeline: [
                            { $match: { orderItemID: mongoose.Types.ObjectId(filter._id) } }
                        ],
                        as: "loadPlanVehicleID",
                    }
                },
                { $unwind: "$loadPlanVehicleID" },
                {
                    $project: {
                        orderID: "$loadPlanVehicleID.orderID"
                    }
                }
            ])
            if (fetchOrder.length === 0) {
                finalArr.push(filter)
            }
        }
        console.log("adasdas", finalArr)
        let successResponse = genericResponse(true, "Fetch Order Successfully!", finalArr);
        res.status(200).json(successResponse);

    }
    catch (error) {
        console.log("eroor ==>", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});


// const fetchWarehouseOrderByStatus = asyncHandler(async (req, res) => {

//     try {
//         const post = req.body;

// let fetchJobQuery=[
//     {$match:{dropWarehouseID:mongoose.Types.ObjectId(post.warehouseID)}}


// ]

//         const fetch = await LoadTrailerDropWarehouses.aggregate(fetchJobQuery)

//         console.log("fetchData" , fetch)

// return
//         let query
//         if (post.state === "Pending") {
//             query = { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) }
//         } else if (post.state === "Recieve") {
//             query = { senderWarehouseID: mongoose.Types.ObjectId(post.warehouseID) }
//         }



//         let fetchQuery = [
//             { $match: query },
//             {
//                 $lookup: {
//                     from: "load_trailers_vehicles",
//                     localField: "loadVehicleID",
//                     foreignField: "_id",
//                     as: "loadTrailersVehicles",
//                 }
//             },
//             // {
//             //     $unwind: "$loadTrailersVehicles",
//             // },
//             {
//                 $project: {
//                     _id: 0,
//                     orderID:1,
//                     loadIDS: "$loadTrailersVehicles.loadPlanVehiclesID",
//                     jobStatus: 1,
//                 }
//             }
//         ]





//         const fetchLoadPlanID = await OrderDriverJob.aggregate(fetchQuery)

//         let order = []
//         for (let data of fetchLoadPlanID) {
//             let jobStatus = data.jobStatus
//             console.log("Dsadad", data.loadIDS.length)


// if(data.loadIDS.length >0){
//     let loadID = data.loadIDS[0].map((data) => mongoose.Types.ObjectId(data))
//     const fetchOder = await LoadVehicleOrder.aggregate([
//         { $match: { loadPlanVehicleID: { $in: loadID } } },
//         {
//             $lookup: {
//                 from: "orders",
//                 localField: "orderID",
//                 foreignField: "_id",
//                 as: "order",
//             }
//         },
//         { $unwind: "$order" },
//         {
//             $lookup: {
//                 from: "order_items",
//                 localField: "order._id",
//                 foreignField: "orderID",
//                 as: "orderItems",
//             }
//         },
//         {
//             $group: {
//                 _id: {
//                     orderID: "$order._id",
//                     orderNumber: "$order.orderNumber",
//                     orderItem: "$orderItems",
//                     orderDate: "$order.orderDate",
//                     senderCity: "$order.senderCity",
//                     receiverCity: "$order.receiverCity",
//                     receiverName: "$order.receiverName",
//                 },
//                 totalWeight: {
//                     $sum: {
//                       $reduce: {
//                         input: "$orderItems",
//                         initialValue: 0,
//                         in: { $add: ["$$value", "$$this.weightInKg"] },
//                       },
//                     },
//                   }, 
//                   totalVolume: {
//                     $sum: {
//                       $reduce: {
//                         input: "$orderItems",
//                         initialValue: 0,
//                         in: {
//                           $add: [
//                             "$$value",
//                             {
//                               $divide: [
//                                 { $multiply: ["$$this.lengthInMm", "$$this.breadthInMm", "$$this.heightInMm", "$$this.numberOfItems"] },
//                                 50000000,
//                               ],
//                             },
//                           ],
//                         },
//                       },
//                     },
//                   }, 

//                 // totalWeight: { $sum: "$orderItems.weightInKg" },
//                 // totalVolume: {
//                 //     $sum: {
//                 //       $divide: [
//                 //         { $multiply: ["$orderItems.lengthInMm", "$orderItems.breadthInMm", "$orderItems.heightInMm", "$orderItems.numberOfItems"] },
//                 //         50000000,
//                 //       ],
//                 //     },
//                 //   }
//             },
//         },

//         {

//             $project: {
//                 _id: 0,
//                 orderID: "$_id.orderID",
//                 orderDate: "$_id.orderDate",
//                 senderCity: "$_id.senderCity",
//                 receiverCity: "$_id.receiverCity",
//                 receiverName: "$_id.receiverName",
//                 jobStatus: jobStatus,
//                 totalWeight:"$totalWeight",
//                 totalVolume:"$totalVolume",
//                 orderNumber: "$_id.orderNumber",
//                 shipmentTypeAndID: { jobStatus: jobStatus, ID: "$_id.orderID", orderNumber: "$_id.orderNumber" }
//             }
//         }
//     ])
//    fetchOder.map(orders => {
//         orders.totalVolume  = parseFloat(orders.totalVolume).toFixed(2)
//         order.push(orders)
//     })

// }else{


//     const fetchOder = await Orders.aggregate([
//         { $match: { _id: data.orderID } },

//         {
//             $lookup: {
//                 from: "order_items",
//                 localField: "_id",
//                 foreignField: "orderID",
//                 as: "orderItems",
//             }
//         },
//         {
//             $group: {
//                 _id: {
//                     orderID: "$_id",
//                     orderNumber: "$orderNumber",
//                     orderItem: "$orderItems",
//                     orderDate: "$orderDate",
//                     senderCity: "$senderCity",
//                     receiverCity: "$receiverCity",
//                     receiverName: "$receiverName",
//                 },
//                 totalWeight: {
//                     $sum: {
//                       $reduce: {
//                         input: "$orderItems",
//                         initialValue: 0,
//                         in: { $add: ["$$value", "$$this.weightInKg"] },
//                       },
//                     },
//                   }, 
//                   totalVolume: {
//                     $sum: {
//                       $reduce: {
//                         input: "$orderItems",
//                         initialValue: 0,
//                         in: {
//                           $add: [
//                             "$$value",
//                             {
//                               $divide: [
//                                 { $multiply: ["$$this.lengthInMm", "$$this.breadthInMm", "$$this.heightInMm", "$$this.numberOfItems"] },
//                                 50000000,
//                               ],
//                             },
//                           ],
//                         },
//                       },
//                     },
//                   }, 

//                 // totalWeight: { $sum: "$orderItems.weightInKg" },
//                 // totalVolume: {
//                 //     $sum: {
//                 //       $divide: [
//                 //         { $multiply: ["$orderItems.lengthInMm", "$orderItems.breadthInMm", "$orderItems.heightInMm", "$orderItems.numberOfItems"] },
//                 //         50000000,
//                 //       ],
//                 //     },
//                 //   }
//             },
//         },

//         {

//             $project: {
//                 _id: 0,
//                 orderID: "$_id.orderID",
//                 orderDate: "$_id.orderDate",
//                 senderCity: "$_id.senderCity",
//                 receiverCity: "$_id.receiverCity",
//                 receiverName: "$_id.receiverName",
//                 jobStatus: jobStatus,
//                 totalWeight:"$totalWeight",
//                 totalVolume:"$totalVolume",
//                 orderNumber: "$_id.orderNumber",
//                 shipmentTypeAndID: { jobStatus: jobStatus, ID: "$_id.orderID", orderNumber: "$_id.orderNumber" }
//             }
//         }
//     ])

//     console.log("SFSDfsd" , fetchOder)
//     // return
//    fetchOder.map(orders => {
//         orders.totalVolume  = parseFloat(orders.totalVolume).toFixed(2)
//         order.push(orders)
//     })




// }


//         }
//         let successResponse = genericResponse(true, "Fetch Order Successfully!", order);
//         res.status(200).json(successResponse);
//     }
//     catch (error) {
//         console.log("eroor ==>", error.message)
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(400).json(errorRespnse);
//     }

// });

const fetchPlanVehicle = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        const fetchQuery = [
            {
                $match: {
                    businessUserID: mongoose.Types.ObjectId(post.businessUserID),
                },
            },
            {
                $lookup: {
                    from: "parameter_lists",
                    let: { vehicleCategory: "$vehicleCategory" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$vehicleCategory", "$_id"] },
                                        { $eq: ["$parameterListName", "Trailer"] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: "vehicleCategory",
                },
            },
            {
                $unwind: {
                    path: "$vehicleCategory",
                },
            },
        ];

        const fetch = await Vehicle.aggregate(fetchQuery);

        let successResponse = genericResponse(true, "Fetch Order Successfully!", fetch);
        res.status(200).json(successResponse);
    } catch (error) {
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});
const fetchDroplocation = asyncHandler(async (req, res) => {
    try {
        const post = req.body;

        const fetchQuery = [
            {
                $match: {
                    loadPlanVehiclesID: mongoose.Types.ObjectId(post.loadPlanVehicleID),
                },
            },
            {
                $lookup: {
                    from: "warehouses",
                    localField: "dropWarehouseID",
                    foreignField: "_id",
                    as: "warehouses"
                }
            },
            {
                $unwind: {
                    path: "$warehouses",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    warehouseName: "$warehouses.warehouseName",
                    warehouseCity: "$warehouses.city",
                }
            }
        ];
        const fetch = await LoadTrailerDropWarehouse.aggregate(fetchQuery);

        if (fetch.length !== 0) {
            let successResponse = genericResponse(true, "fetch Droplocation Successfully!", fetch);
            res.status(200).json(successResponse);
        } else {
            const errorResponse = genericResponse(false, "No any Vehicle found", []);
            res.status(200).json(errorResponse);
            return;
        }

    } catch (error) {
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const fetchPalletFromVehicle = asyncHandler(async (req, res) => {
    try {
        const post = req.body;


        var query = { _id: mongoose.Types.ObjectId(post.loadPlanVehicleID) }

        const fetch = await Vehicle.find(query);

        let successResponse = genericResponse(true, "Fetch Order Successfully!", fetch);
        res.status(200).json(successResponse);
    } catch (error) {
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const fetchMaxPalletVolume = asyncHandler(async (req, res) => {
    try {
        const post = req.body;

        const fetchParameterSettings = await parameterSettings.find(
            {
                parameterName: {
                    $in: [
                        "PalletLength(mm)",
                        "PalletBreadth(mm)",
                        "PalletHeight(mm)",
                    ],
                },
            },
            {
                parameterName: 1,
                parameterValue: 1,
                _id: 0, // Exclude the "_id" field
            }
        );

        const palletLength = fetchParameterSettings.find(
            (setting) => setting.parameterName === 'PalletLength(mm)'
        ).parameterValue;
        const palletBreadth = fetchParameterSettings.find(
            (setting) => setting.parameterName === 'PalletBreadth(mm)'
        ).parameterValue;
        const palletHeight = fetchParameterSettings.find(
            (setting) => setting.parameterName === 'PalletHeight(mm)'
        ).parameterValue;

        // Convert the parameter values to numbers and calculate the volume
        const maxPalletVolume = Number(palletLength) * Number(palletBreadth) * Number(palletHeight);

        let successResponse = genericResponse(true, "maxPalletVolume fetch Successfully!", maxPalletVolume);
        res.status(200).json(successResponse);
    } catch (error) {
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});


const fetchSummaryByLoadedVehicleID = asyncHandler(async (req, res) => {
    try {
        const post = req.body;


        const query = { loadPlanVehicleID: mongoose.Types.ObjectId(post.loadPlanVehicleID) };
        console.log("sadasda", post.loadPlanVehicleID)

        // const fetch = await LoadVehicleSlot.find(query);
        const fetch = await LoadVehicleSlot.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "load_vehicle_orders",
                    let: { slot: "$slotNumber", type: "$trailerPalletType", id: "$loadPlanVehicleID" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$slotNumber", "$$slot"] },
                                        { $eq: ["$trailerPalletType", "$$type"] },
                                        { $eq: ["$loadPlanVehicleID", "$$id"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "loadVehicleOrders"
                }
            },
            {
                $lookup: {
                    from: "orders",
                    localField: "loadVehicleOrders.orderID",
                    foreignField: "_id",
                    as: "orders",
                }
            },
            {
                $lookup: {
                    from: "customers",
                    localField: "orders.customerID",
                    foreignField: "_id",
                    as: "customer",
                }
            },
            //   {$unwind:"$customer"},
            {
                $project: {
                    slotNumber: 1,
                    loadedWeight: 1,
                    customerCode: "$customer.customerCode",
                    slotCapacity: 1,
                    loadedVolume: 1,
                    balanceVolume: 1,
                    trailerPalletType: 1,
                    addIDAndSlot: {
                        slotNo: "$slotNumber",
                        ID: "$loadPlanVehicleID",
                        trailerPalletType: "$trailerPalletType"
                    },
                    order: "$orders"

                }
            }
        ])




        console.log("fetch", fetch)
        // return
        if (fetch.length !== 0) {
            // Calculate the balanceVolume for each fetched slot
            // const slotsWithBalanceVolume = fetch.map(slot => {
            //     const balanceVolume = slot.slotCapacity - slot.loadedVolume;
            //     const slotNo = slot.slotNumber;
            //     const addIDAndSlot = {
            //         slotNo: slot.slotNumber,
            //         ID: slot.loadPlanVehicleID,
            //         trailerPalletType: slot.trailerPalletType
            //     }
            //     return { ...slot._doc, balanceVolume, addIDAndSlot };
            // });

            let successResponse = genericResponse(true, "fetchSummary By LoadedVehicleID Successfully!", fetch);
            res.status(200).json(successResponse);
        } else {
            const errorResponse = genericResponse(false, "No any Data found", []);
            res.status(200).json(errorResponse);
            return;
        }

    } catch (error) {
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const fetchOrderItemsWarehouse = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        if (post.orderID !== "" && post.orderID !== undefined) {



            const fetchQuery = [
                {
                    $match: {
                        orderID: mongoose.Types.ObjectId(post.orderID),
                    },
                },
                {
                    $lookup: {
                        from: "orders",
                        localField: "orderID",
                        foreignField: "_id",
                        as: "order"
                    }
                },
                {
                    $unwind: {
                        path: "$order",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        itemOrderNumber: "$order.orderNumber",
                    }
                }
            ];



            const fetchorderitems = await OrderItems.aggregate(fetchQuery);

            let filterData = []
            for (let data of fetchorderitems) {
                let record = await LoadVehicleOrder.find({ orderItemID: data._id })
                if (record.length === 0) {
                    filterData.push(data)
                }
            }

            let successResponse = genericResponse(true, "Order added successfully.", filterData);
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

})

const fetchSlotDetailsBySlotNumber = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log("dnaskdfaf", post)
        // const fetchQuery = { slotNumber: post.slotNumber };

        const fetchQuery = [
            {
                $match: {
                    slotNumber: post.slotNumber, loadPlanVehicleID: mongoose.Types.ObjectId(post.loadPlanVehicleID)
                },
            },
            {
                $lookup: {
                    from: "order_items",
                    localField: "orderItemID",
                    foreignField: "_id",
                    as: "orderItem"
                }
            },
            {
                $unwind: {
                    path: "$orderItem",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "orders",
                    localField: "orderItem.orderID",
                    foreignField: "_id",
                    as: "order"
                }
            },
            {
                $unwind: {
                    path: "$order",
                    preserveNullAndEmptyArrays: true
                }
            },
            // {
            //     $addFields: {
            //         warehouseName: "$warehouses.warehouseName",
            //         warehouseCity: "$warehouses.city",
            //     }
            // }
        ];
        const fetch = await LoadVehicleOrder.aggregate(fetchQuery);

        let successResponse = genericResponse(true, "Fetch Order Successfully!", fetch);
        res.status(200).json(successResponse);
    } catch (error) {
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const fetchSlotDetailsBySlotNumber1 = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log("post", post);
        const fetchQuery = { slotNumber: post.slotNumber };

        const fetch = await LoadVehicleOrder.find(fetchQuery);

        let successResponse = genericResponse(true, "Fetch Order Successfully!", fetch);
        res.status(200).json(successResponse);
    } catch (error) {
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const addLoadVehicleAndSlot = asyncHandler(async (req, res) => {

    try {
        const post = req.body;


        let data = post.selectedNormalSlot.concat(post.selectedMezzSlot)

        for (let orderItem of post.selectedItems) {
            const addLoad = {}
            addLoad.orderID = orderItem.orderID
            addLoad.orderItemID = orderItem._id
            addLoad.loadPlanVehicleID = post.loadPlanVehicleID
            addLoad.orderDropWarehouseID = post.orderDropWarehouseID
            addLoad.orderNumber = orderItem.orderNumber
            addLoad.barCodeID = orderItem.barCodeID
            addLoad.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            addLoad.allocationDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            addLoad.recordType = "I"
            addLoad.itemStatus = "Pending"
            console.log("fgfdg", orderItem.breadthInMm * orderItem.heightInMm * orderItem.lengthInMm)
            let orderItemVoume = ((orderItem.breadthInMm * orderItem.heightInMm * orderItem.lengthInMm) / 1000000000).toFixed(4)
            let weightperVol = (orderItem.weightInKg / orderItemVoume).toFixed(4)
            let loadedVolume = orderItemVoume
            let loadedVolume1 = orderItemVoume
            let flag = false

            if (data.length > 0) {
                if (data.length === 1) {
                    let loadedVol = 0
                    let LoadBal
                    let queryforUpdate = { loadPlanVehicleID: post.loadPlanVehicleID, slotNumber: data[0].slotNumber, trailerPalletType: data[0].trailerPalletType }
                    const fetchSlot = await LoadVehicleSlot.find(queryforUpdate)
                    if (fetchSlot.length > 0) {
                        loadedVol = fetchSlot[0].loadedVolume
                        LoadBal = fetchSlot[0].slotCapacity - fetchSlot[0].loadedVolume
                    } else {
                        LoadBal = data[i].balanceVolume
                    }
                    addLoad.slotCapacity = data[0].slotCapacity,
                        addLoad.loadedVolume = (loadedVol + parseFloat(orderItemVoume)).toFixed(2),
                        addLoad.trailerPalletType = data[0].trailerPalletType
                    addLoad.balanceVolume = (LoadBal - orderItemVoume).toFixed(4),
                        addLoad.loadedWeight = (weightperVol * (loadedVol - orderItemVoume)).toFixed(2)
                    addLoad.slotNumber = data[0].slotNumber
                    await new LoadVehicleOrder(addLoad).save()
                    let data3 = {
                        loadedWeight: (weightperVol * (loadedVol - orderItemVoume)).toFixed(2),
                        loadedVolume: addLoad.loadedVolume,
                        balanceVolume: (LoadBal - orderItemVoume).toFixed(2),
                        lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000))
                    }
                    await LoadVehicleSlot.updateOne(queryforUpdate, { $set: data3 })
                } else {
                    for (let i = 0; i < data.length; i++) {
                        let loadedVol = 0
                        let LoadBal
                        let queryforUpdate = { loadPlanVehicleID: post.loadPlanVehicleID, slotNumber: data[i].slotNumber, trailerPalletType: data[i].trailerPalletType }
                        addLoad.slotCapacity = data[i].slotCapacity,
                            addLoad.trailerPalletType = data[i].trailerPalletType
                        addLoad.slotNumber = data[i].slotNumber
                        const fetchSlot = await LoadVehicleSlot.find(queryforUpdate)
                        if (fetchSlot.length > 0) {
                            loadedVol = fetchSlot[0].loadedVolume
                            LoadBal = fetchSlot[0].slotCapacity - fetchSlot[0].loadedVolume
                        } else {
                            LoadBal = data[i].balanceVolume
                        }
                        if (LoadBal > orderItemVoume) {
                            addLoad.loadedVolume = (loadedVol + parseFloat(orderItemVoume)).toFixed(2),
                                addLoad.balanceVolume = (LoadBal - orderItemVoume).toFixed(2),
                                addLoad.loadedWeight = (weightperVol * (loadedVol - orderItemVoume)).toFixed(2)
                            await new LoadVehicleOrder(addLoad).save()

                            let data3 = {
                                loadedWeight: (weightperVol * (loadedVol - orderItemVoume)).toFixed(2),
                                loadedVolume: addLoad.loadedVolume,
                                balanceVolume: (LoadBal - orderItemVoume).toFixed(2),
                                lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000))

                            }
                            await LoadVehicleSlot.updateOne(queryforUpdate, { $set: data3 })
                            break
                        } else {
                            if (LoadBal > loadedVolume) {
                                addLoad.loadedVolume = parseFloat(loadedVolume).toFixed(2),
                                    addLoad.balanceVolume = (LoadBal - parseFloat(loadedVolume)).toFixed(2),
                                    addLoad.loadedWeight = (weightperVol * parseFloat(loadedVolume)).toFixed(2)
                                await new LoadVehicleOrder(addLoad).save()
                                let data1 = {
                                    loadedWeight: (weightperVol * parseFloat(loadedVolume)).toFixed(2),
                                    loadedVolume: addLoad.loadedVolume,
                                    balanceVolume: (LoadBal - parseFloat(loadedVolume)).toFixed(2),
                                    lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000))

                                }
                                await LoadVehicleSlot.updateOne(queryforUpdate, { $set: data1 })
                                break

                            } else if (LoadBal === data[i].slotCapacity) {
                                loadedVolume = (parseFloat(loadedVolume) - LoadBal)
                                addLoad.loadedVolume = LoadBal,
                                    addLoad.balanceVolume = 0,
                                    addLoad.loadedWeight = (weightperVol * LoadBal).toFixed(2)
                                await new LoadVehicleOrder(addLoad).save()
                                let data2 = {
                                    loadedWeight: (weightperVol * LoadBal).toFixed(2),
                                    loadedVolume: LoadBal,
                                    balanceVolume: 0,
                                    lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000))

                                }
                                await LoadVehicleSlot.updateOne(queryforUpdate, { $set: data2 })
                                // data.splice(i, 1);
                            } else {
                                loadedVolume1 = loadedVolume1 - LoadBal
                                loadedVolume = loadedVolume - LoadBal
                                if (i + 1 === data.length) {
                                    addLoad.loadedVolume = LoadBal + loadedVolume1,
                                        addLoad.balanceVolume = LoadBal - loadedVolume1,
                                        addLoad.loadedWeight = (weightperVol * LoadBal).toFixed(2)
                                    await new LoadVehicleOrder(addLoad).save()
                                    let data2 = {
                                        loadedWeight: (weightperVol * LoadBal).toFixed(2),
                                        loadedVolume: LoadBal + loadedVolume1,
                                        balanceVolume: LoadBal - loadedVolume1,
                                        lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000))
                                    }
                                    await LoadVehicleSlot.updateOne(queryforUpdate, { $set: data2 })
                                    break
                                } else {
                                    let calLoad = data[i].slotCapacity
                                    let bal = 0
                                    if (loadedVolume1 < 0) {
                                        break
                                    } else if (LoadBal > loadedVolume1) {
                                        calLoad = (parseFloat(LoadBal) + parseFloat(loadedVolume1)).toFixed(2)
                                        bal = (parseFloat(LoadBal) - parseFloat(loadedVolume1)).toFixed(2)
                                    }
                                    addLoad.loadedVolume = calLoad,
                                        addLoad.balanceVolume = bal,
                                        addLoad.loadedWeight = (weightperVol * LoadBal).toFixed(2)
                                    await new LoadVehicleOrder(addLoad).save()
                                    let data2 = {
                                        loadedWeight: (weightperVol * LoadBal).toFixed(2),
                                        loadedVolume: calLoad,
                                        balanceVolume: bal,
                                        lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000))
                                    }
                                    await LoadVehicleSlot.updateOne(queryforUpdate, { $set: data2 })
                                }
                            }
                        }
                    }
                }
            }
        }
        // return
        let successResponse = genericResponse(true, "addLoadVehicleAndSlot added successfully.", []);
        res.status(201).json(successResponse);

        return













        // var query = { loadPlanVehicleID: mongoose.Types.ObjectId(post.loadPlanVehicleID), slotNumber: post.slotNumber, trailerPalletType: post.trailerPalletType }
        // if (post.orderItemIDS.length > 0) {
        //     for (let data of post.orderItemIDS) {
        //         post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        //         post.recordType = "I";
        //         post.allocationDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        //         post.orderItemID = data
        //         post.itemStatus = "Pending"
        //         post.receivedQty = 0
        //         const added = await new LoadVehicleOrder(post).save();

        //     }
        // }

        // let fetched = await LoadVehicleSlot.find(query)
        // // console.log("fetched", fetched[0].loadPlanVehicleID)

        // if (fetched.length > 0 && fetched[0].loadPlanVehicleID !== undefined) {
        //     // Existing loadPlanVehicleID found, update the data
        //     let data = {
        //         loadPlanVehicleID: post.loadPlanVehicleID,
        //         slotNumber: post.slotNumber,
        //         slotCapacity: post.totalPalletVolume,
        //         loadedVolume: post.loadedVolume,
        //         loadedWeight: post.loadedWeight,
        //         trailerPalletType: post.trailerPalletType,
        //         lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000))
        //     };
        //     var newValues = { $set: data };
        //     const orderJob = await LoadVehicleSlot.updateOne(query, newValues);
        // } else {
        //     // No existing loadPlanVehicleID found, create a new entry
        //     let data = {
        //         loadPlanVehicleID: post.loadPlanVehicleID,
        //         slotNumber: post.slotNumber,
        //         slotCapacity: post.totalPalletVolume,
        //         loadedVolume: post.loadedVolume,
        //         loadedWeight: post.loadedWeight,
        //         trailerPalletType: post.trailerPalletType,
        //         createdDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000))
        //     };
        //     const added1 = await new LoadVehicleSlot(data).save();
        // }


        // let successResponse = genericResponse(true, "addLoadVehicleAndSlot added successfully.", []);
        // res.status(201).json(successResponse);
        // return;

    } catch (error) {
        console.log(error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchLoadedSlot = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        const fetchQuery = [
            {
                $match: {
                    _id: mongoose.Types.ObjectId(post.loadPlanVehicleID)
                },
            },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicleID",
                    foreignField: "_id",
                    as: "vehicles",
                },
            },
            { $unwind: "$vehicles" },
            // {  load_vehicle_orders


            // }
            {
                $lookup: {
                    from: "load_vehicle_slots",
                    localField: "_id",
                    foreignField: "loadPlanVehicleID",
                    as: "loadPlanSlot",
                },
            },
            // { $unwind: "$loadPlanSlot" },

            {
                $project: {
                    shippingType: 1,
                    maximumVolume: 1,
                    vehicleCategory: 1,
                    vehicleStatus: 1,
                    vehicleType: 1,
                    registrationNumber: 1,
                    maximumWeight: 1,
                    vehicleStatus: 1,
                    trailerType: "$vehicles.trailerType",
                    // upperPalletCount: "$vehicles.upperPalletCount",
                    // belowPalletCount: "$vehicles.belowPalletCount",
                    palletCount: "$vehicles.palletCount",
                    slotHeight: "$vehicles.slotHeight",
                    slotBreadth: "$vehicles.slotBreadth",
                    slotLength: "$vehicles.slotLength",
                    slotLength: "$vehicles.slotLength",
                    slots: "$loadPlanSlot",
                    mezzHeight: "$vehicles.mezzHeight",
                    mezzPalletCount: "$vehicles.mezzPalletCount"
                    // slotNumber:"$loadPlanSlot.slotNumber",
                    // loadedWeight:"$loadPlanSlot.loadedWeight",
                    // loadedVolume:"$loadPlanSlot.loadedVolume",
                    // slotCapacity:"$loadPlanSlot.slotCapacity",


                }
            }
        ];

        const fetch = await LoadPlanVehicles.aggregate(fetchQuery);
        console.log("fetch", fetch)
        if (fetch[0].slots.length === 0) {
            let loadedWeight = (fetch[0].slotHeight * fetch[0].slotBreadth * fetch[0].slotLength) / 1000000000

            let filterData = []
            let mezz = []
            for (let i = 0; i < parseInt(fetch[0].palletCount); i++) {
                let data = {
                    loadPlanVehicleID: post.loadPlanVehicleID,
                    slotNumber: (i + 1),
                    trailerPalletType: "Normal",
                    slotCapacity: loadedWeight,
                    loadedVolume: 0,
                    balanceVolume: loadedWeight,
                    createdDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000))
                }
                filterData.push(data)


            }
            await LoadVehicleSlot.insertMany(filterData)

            for (let i = 0; i < parseInt(fetch[0].mezzPalletCount); i++) {
                let data = {
                    loadPlanVehicleID: post.loadPlanVehicleID,
                    slotNumber: (i + 1),
                    slotCapacity: loadedWeight,
                    loadedVolume: 0,
                    trailerPalletType: "Mezz",
                    balanceVolume: loadedWeight,
                    createdDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000))
                }
                mezz.push(data)
            }
            if (mezz.length > 0) {
                await LoadVehicleSlot.insertMany(mezz)
            }
        }

        const fetchmezz = await LoadVehicleSlot.find({ loadPlanVehicleID: post.loadPlanVehicleID, trailerPalletType: "Mezz" }).sort({ slotNumber: 1 })
        const fetchNormal = await LoadVehicleSlot.find({ loadPlanVehicleID: post.loadPlanVehicleID, trailerPalletType: "Normal" }).sort({ slotNumber: 1 })




        // console.log("sdbjkasdsad" , fetch)
        // // return
        // let filterData = []
        // let loadedWeight = (fetch[0].slotHeight * fetch[0].slotBreadth * fetch[0].slotLength) / 50000000
        // for (let i = 0; i < parseInt(fetch[0].palletCount); i++) {

        //     console.log("dsadadasdadasd")
        //     let data = {
        //         slotNumber: (i + 1),
        //         trailerPalletType: "Normal",
        //         slotCapacity: loadedWeight,
        //         loadedVolume: 0,
        //         balanceVolume: loadedWeight
        //     }

        //     if (fetch[0].slots.length > 0) {
        //         for (let slot of fetch[0].slots) {

        //             if (slot.slotNumber === (i + 1) && slot.trailerPalletType === "Normal") {
        //                 let data = {
        //                     slotNumber: slot.slotNumber,
        //                     slotCapacity: loadedWeight,
        //                     loadedVolume: slot.loadedVolume,
        //                     trailerPalletType: slot.trailerPalletType,
        //                     balanceVolume: slot.slotCapacity - slot.loadedVolume
        //                 }
        //                 filterData.push(data)
        //             }else{

        //                 filterData.push(data)

        //             }

        //         }
        //     } else {
        //         filterData.push(data)
        //     }


        // }
        // let mezz = []
        // if (fetch[0].trailerType === "Mezz") {


        // }
        //     for (let i = 0; i < parseInt(fetch[0].mezzPalletCount); i++) {
        //         let data = {
        //             slotNumber: (i + 1),
        //             slotCapacity: loadedWeight,
        //             loadedVolume: 0,
        //             trailerPalletType: "Mezz",
        //             balanceVolume: loadedWeight
        //         }

        //         if (fetch[0].slots.length > 0) {
        //             for (let slot of fetch[0].slots) {
        //                 if (slot.slotNumber === (i + 1) && slot.trailerPalletType === "Mezz") {
        //                     let data = {
        //                         slotNumber: slot.slotNumber,
        //                         trailerPalletType: slot.trailerPalletType,
        //                         slotCapacity: loadedWeight,
        //                         loadedVolume: slot.loadedVolume,
        //                         balanceVolume: slot.slotCapacity - slot.loadedVolume
        //                     }
        //                     mezz.push(data)
        //                 }else{
        //                     mezz.push(data)
        //                 }
        //             }
        //         } else {
        //             mezz.push(data)

        //     }
        // }

        let successResponse = genericResponse(true, "Fetch Loaded Slot successfully.",
            {
                mezzPallet: fetchmezz,
                normalPallet: fetchNormal
            });
        res.status(201).json(successResponse);



        return
        var query = { loadPlanVehicleID: mongoose.Types.ObjectId(post.loadPlanVehicleID), slotNumber: post.slotNumber, trailerPalletType: post.trailerPalletType };

        let fetched = await LoadVehicleSlot.find(query);
        console.log("fetched", fetched);

        if (fetched.length > 0) {
            const loadedSlot = fetched[0];
            const balanceVolume = loadedSlot.slotCapacity - loadedSlot.loadedVolume;

            let successResponse = genericResponse(true, "Fetch Loaded Slot successfully.", {
                ...loadedSlot._doc,
                balanceVolume: balanceVolume,
            });
            res.status(201).json(successResponse);
            return;
        } else {
            let errorResponse = genericResponse(false, "No records found.", []);
            res.status(200).json(errorResponse);
            return;
        }
    } catch (error) {
        console.log(error.message);
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const fetchLoadPlanVehicle = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        const fetchQuery = [
            {
                $match: {
                    businessUserID: mongoose.Types.ObjectId(post.businessUserID), warehouseID: mongoose.Types.ObjectId(post.warehouseID), vehicleStatus: { $in: ["New", "Locked"] }
                },
            },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicleID",
                    foreignField: "_id",
                    as: "vehicles",
                },
            },
            { $unwind: "$vehicles" },
            {
                $project: {
                    shippingType: 1,
                    maximumVolume: 1,
                    vehicleCategory: 1,
                    vehicleStatus: 1,
                    vehicleType: 1,
                    registrationNumber: 1,
                    maximumWeight: 1,
                    vehicleStatus: 1,
                    trailerType: "$vehicles.trailerType",
                    // upperPalletCount: "$vehicles.upperPalletCount",
                    // belowPalletCount: "$vehicles.belowPalletCount",
                    palletCount: "$vehicles.palletCount",
                    slotHeight: "$vehicles.slotHeight",
                    slotBreadth: "$vehicles.slotBreadth",
                    slotLength: "$vehicles.slotLength",
                    slotLength: "$vehicles.slotLength",
                    mezzHeight: "$vehicles.mezzHeight",
                    mezzPalletCount: "$vehicles.mezzPalletCount"


                }
            }
        ];

        const fetch = await LoadPlanVehicles.aggregate(fetchQuery);

        let successResponse = genericResponse(true, "Fetch Order Successfully!", fetch);
        res.status(200).json(successResponse);
    } catch (error) {
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const updatPlanLoadStatus = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        const fetch = await LoadPlanVehicles.updateOne({ _id: mongoose.Types.ObjectId(post.loadPlanVehicleID) }, { $set: { vehicleStatus: post.vehicleStatus } });
        if (post.vehicleStatus === "Locked") {
            let successResponse = genericResponse(true, "Status Changed to Locked Successfully!", fetch);
            res.status(200).json(successResponse);
        } else {
            let successResponse = genericResponse(true, "Status Changed to New Successfully!!", fetch);
            res.status(200).json(successResponse);
        }
    } catch (error) {
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const fetchPrimeMover = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log("sfjdfjsdhfhsdfghdfghdgfjhgfsd", post)
        const fetchQuery = [
            {
                $match: {
                    businessUserID: mongoose.Types.ObjectId(post.businessUserID),
                },
            },
            {
                $lookup: {
                    from: "parameter_lists",
                    let: { vehicleCategory: "$vehicleCategory" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$vehicleCategory", "$_id"] },
                                        { $eq: ["$parameterListName", "Prime Mover"] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: "vehicleCategory",
                },
            },
            {
                $unwind: {
                    path: "$vehicleCategory",
                },
            },
        ];

        const fetch = await Vehicle.aggregate(fetchQuery);

        let successResponse = genericResponse(true, "Fetch Order Successfully!", fetch);
        res.status(200).json(successResponse);
    } catch (error) {
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});


const fetchDriver = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log("sadsadasdsda", post)
        // const fetchQuery = [
        //     {
        //         $match: {
        //             businessUserID: mongoose.Types.ObjectId(post.businessUserID),
        //         },
        //     },
        //     {
        //         $lookup: {
        //             from: "parameter_lists",
        //             let: { vehicleCategory: "$vehicleCategory" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ["$$vehicleCategory", "$_id"] },
        //                                 { $eq: ["$parameterListName", "Prime Mover"] },
        //                             ],
        //                         },
        //                     },
        //                 },
        //             ],
        //             as: "vehicleCategory",
        //         },
        //     },
        //     {
        //         $unwind: {
        //             path: "$vehicleCategory",
        //         },
        //     },
        // ];

        const fetch = await Employee.aggregate([

            { $match: { businessUserID: mongoose.Types.ObjectId(post.businessUserID), department: "Driver" } },

            {
                $lookup: {
                    from: "order_driver_jobs",
                    localField: "_id",
                    foreignField: "assignedDriverID",
                    pipeline: [
                        { $match: { jobStatus: { $nin: ["Job Dropped", "Job Completed", "Job Rejected"] } } }
                    ],
                    as: "job",
                }
            },

            {
                $project: {
                    job: { $size: "$job" },
                    firstName: 1,
                    lastName: 1
                }
            }
        ]);
        console.log("asdsada", fetch)
        let successResponse = genericResponse(true, "Fetch Order Successfully!", fetch);
        res.status(200).json(successResponse);
    } catch (error) {

        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const assignDriverToPrime = asyncHandler(async (req, res) => {

    try {
        const post = req.body;
        console.log("post", post)

        if (post.jobID !== "" && post.jobID !== "" && post.jobID) {
            post.jobStatus = "Job Assigned"
            await OrderDriverJob.updateOne({ _id: mongoose.Types.ObjectId(post.jobID) }, { $set: post })
            let successResponse = genericResponse(true, " Added successfully.", []);
            res.status(201).json(successResponse);
            return;

        }



        let jobNumber = 0

        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.recordType = "I";
        const added = await new LoadTrailersVehicles(post).save();
        const trailerID = added._id
        const fetchLoadPlanVehiclesIDs = added.loadPlanVehiclesID
        const loadPlanVehiclesIDs = fetchLoadPlanVehiclesIDs.map((id) => {
            if (id.length !== 24) {
                throw new Error('Invalid ObjectID format: ' + id);
            }
            return mongoose.Types.ObjectId(id);
        });
        let data1 = [];
        for (let ID of loadPlanVehiclesIDs) {
            console.log("ID", ID);
            let newJobValues = { $set: { jobStatus: "Job Assigned" } }
            await LoadTrailerDropWarehouses.updateMany({ loadPlanVehiclesID: mongoose.Types.ObjectId(ID) }, newJobValues);
            let newData = await LoadTrailerDropWarehouses.find({ loadPlanVehiclesID: mongoose.Types.ObjectId(ID) });
            data1.push(newData);
        }
        let fetchDropDetails; // Declare the variable here to access it later
        // Define fetchWarehouse here to access it later
        let fetchWare = await Warehouse.find({ _id: mongoose.Types.ObjectId(post.dropWarehouseID) });
        let fetchWarehouse = await Warehouse.find({ _id: mongoose.Types.ObjectId(post.warehouseID) });
        let fetchJob = await OrderDriverJob.find({ businessUserID: mongoose.Types.ObjectId(post.businessUserID) }).sort({ _id: -1 }).limit(1)
        if (fetchJob.length > 0) {
            jobNumber = fetchJob[0].jobNumber + 1
        } else {
            jobNumber += 1
        }

        let dataNew = {}
        dataNew.assignedDriverID = post.assignedDriverID
        dataNew.loadVehicleID = trailerID
        dataNew.senderWarehouseID = fetchWarehouse[0]._id,
            dataNew.pickupContactName = fetchWarehouse[0].warehouseName,
            dataNew.pickupStreetAddress = fetchWarehouse[0].streetAddress,
            dataNew.pickupCity = fetchWarehouse[0].city,
            dataNew.pickupZipCode = fetchWarehouse[0].zipCode,
            dataNew.pickupCountryID = fetchWarehouse[0].countryId,
            dataNew.pickupStateID = fetchWarehouse[0].stateId,
            dataNew.jobStatus = "Job Assigned",
            dataNew.businessUserID = post.businessUserID
        dataNew.jobNumber = jobNumber,
            dataNew.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
            dataNew.recordType = 'I',
            dataNew.assignedDriverDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000))

        // dataNew.dropContactName = fetchWare[0].contactPersonName,
        dataNew.senderWarehouseID = post.warehouseID
        dataNew.dropWarehouseID = fetchWare[0]._id,
            dataNew.dropContactName = fetchWare[0].warehouseName,
            dataNew.dropStreetAddress = fetchWare[0].streetAddress,
            dataNew.dropCity = fetchWare[0].city,
            dataNew.dropZipCode = fetchWare[0].zipCode,
            dataNew.dropCountryID = fetchWare[0].countryId,
            dataNew.dropStateID = fetchWare[0].stateId

        const orderJobLog = new OrderDriverJob(dataNew);
        const insertOrderJob = await orderJobLog.save();

        const fetchUser = await Employee.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(post.assignedDriverID) }
            },
            {
                $project: {
                    fullName: { $concat: ["$firstName", " ", "$lastName"] },
                    _id: 1,
                    pushNotificationID: 1,
                }
            }
        ]);
        console.log("fetchUser", fetchUser)

        if (fetchUser.length > 0 && fetchUser[0].pushNotificationID) {

            await appNotification([fetchUser[0].pushNotificationID],
                "New Job #" + insertOrderJob.jobNumber, "You have been assigned a new Job number is " + insertOrderJob.jobNumber + ".", 999999)

            let add = {};
            add.notificationID = 999999;
            add.userID = fetchUser[0]._id;
            add.shortText = "New Job #" + insertOrderJob.jobNumber;
            add.longText = "You have been assigned a new Job number is " + insertOrderJob.jobNumber + ".";
            add.notificationStatus = "SENT";
            add.isSelected = false;
            add.sentDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            add.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            const notification = new NotificationsModel(add);
            await notification.save();

        }

        for (let ID of loadPlanVehiclesIDs) {
            await LoadPlanVehicles.updateOne({ _id: mongoose.Types.ObjectId(ID) }, { $set: { vehicleStatus: "Vehicle Assigned" } })
            await LoadTrailerDropWarehouses.updateMany({ loadPlanVehiclesID: mongoose.Types.ObjectId(ID) }, { $set: { jobID: insertOrderJob._id } });
        }

        let successResponse = genericResponse(true, " Added successfully.", []);
        res.status(201).json(successResponse);
        return;

    } catch (error) {
        console.log(error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

// const assignDriverToPrime = asyncHandler(async (req, res) => {

//     try {
//         const post = req.body;
//         console.log("post", post)
//         let jobNumber = 0

//         post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//         post.recordType = "I";
//         const added = await new LoadTrailersVehicles(post).save();
//         const trailerID = added._id
//         const fetchLoadPlanVehiclesIDs = added.loadPlanVehiclesID
//         const loadPlanVehiclesIDs = fetchLoadPlanVehiclesIDs.map((id) => {
//             if (id.length !== 24) {
//                 throw new Error('Invalid ObjectID format: ' + id);
//             }
//             return mongoose.Types.ObjectId(id);
//         });
//         let data1 = [];
//         for (let ID of loadPlanVehiclesIDs) {
//             console.log("ID", ID);
//             let newJobValues = { $set: { jobStatus: "Job Assigned" } }
//             await LoadTrailerDropWarehouses.updateMany({ loadPlanVehiclesID: mongoose.Types.ObjectId(ID) }, newJobValues);
//             let newData = await LoadTrailerDropWarehouses.find({ loadPlanVehiclesID: mongoose.Types.ObjectId(ID) });
//             data1.push(newData);
//         }
//         let fetchDropDetails; // Declare the variable here to access it later
//         // Define fetchWarehouse here to access it later
//         let fetchWare = await Warehouse.find({ _id: mongoose.Types.ObjectId(post.dropWarehouseID) });
//         let fetchWarehouse = await Warehouse.find({ _id: mongoose.Types.ObjectId(post.warehouseID) });
//         let fetchJob = await OrderDriverJob.find({ businessUserID: mongoose.Types.ObjectId(post.businessUserID) }).sort({ _id: -1 }).limit(1)
//         if (fetchJob.length > 0) {
//             jobNumber = fetchJob[0].jobNumber + 1
//         } else {
//             jobNumber += 1
//         }

//         let dataNew = {}
//         dataNew.assignedDriverID = post.assignedDriverID
//         dataNew.loadVehicleID = trailerID
//         dataNew.senderWarehouseID = fetchWarehouse[0]._id,
//             dataNew.pickupContactName = fetchWarehouse[0].warehouseName,
//             dataNew.pickupStreetAddress = fetchWarehouse[0].streetAddress,
//             dataNew.pickupCity = fetchWarehouse[0].city,
//             dataNew.pickupZipCode = fetchWarehouse[0].zipCode,
//             dataNew.pickupCountryID = fetchWarehouse[0].countryId,
//             dataNew.pickupStateID = fetchWarehouse[0].stateId,
//             dataNew.jobStatus = "Job Assigned",
//             dataNew.businessUserID = post.businessUserID
//         dataNew.jobNumber = jobNumber,
//             dataNew.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
//             dataNew.recordType = 'I',
//             dataNew.assignedDriverDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000))

//         // dataNew.dropContactName = fetchWare[0].contactPersonName,
//         dataNew.senderWarehouseID = post.warehouseID
//         dataNew.dropWarehouseID = fetchWare[0]._id,
//             dataNew.dropContactName = fetchWare[0].warehouseName,
//             dataNew.dropStreetAddress = fetchWare[0].streetAddress,
//             dataNew.dropCity = fetchWare[0].city,
//             dataNew.dropZipCode = fetchWare[0].zipCode,
//             dataNew.dropCountryID = fetchWare[0].countryId,
//             dataNew.dropStateID = fetchWare[0].stateId

//         const orderJobLog = new OrderDriverJob(dataNew);
//         const insertOrderJob = await orderJobLog.save();




//         for (let ID of loadPlanVehiclesIDs) {
//             await LoadPlanVehicles.updateOne({ _id: mongoose.Types.ObjectId(ID) }, { $set: { vehicleStatus: "Vehicle Assigned" } })
//             await LoadTrailerDropWarehouses.updateMany({ loadPlanVehiclesID: mongoose.Types.ObjectId(ID) }, { $set: { jobID: insertOrderJob._id } });
//         }

//         let successResponse = genericResponse(true, " Added successfully.", []);
//         res.status(201).json(successResponse);
//         return;

//     } catch (error) {
//         console.log(error.message);
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(400).json(errorRespnse);
//     }
// });


const fetchWarehouses = asyncHandler(async (req, res) => {

    try {
        const post = req.body;
        console.log("dfskfsdf", post)
        let filterID = post.loadPlanVehiclesID.map(data => mongoose.Types.ObjectId(data))

        let fetchQuery = [
            { $match: { loadPlanVehiclesID: { $in: filterID } } },
            {
                $lookup: {
                    from: 'warehouses',
                    localField: 'dropWarehouseID',
                    foreignField: '_id',
                    as: 'warehouse'
                }
            }
            , { $unwind: "$warehouse" },

            {
                $group: {
                    _id: {
                        warehouseID: "$warehouse._id",
                        warehouseName: "$warehouse.warehouseName",
                        streetAddress: "$warehouse.streetAddress",
                        warehouseStatus: "$warehouse.warehouseStatus"
                    },

                }

            },
            {
                $project: {
                    _id: 0,
                    warehouseID: "$_id.warehouseID",
                    warehouseName: "$_id.warehouseName",
                    streetAddress: "$_id.streetAddress",
                    warehouseStatus: "$_id.warehouseStatus"

                }
            }

        ]


        const warehouse = await LoadTrailerDropWarehouses.aggregate(fetchQuery)
        let successResponse = genericResponse(true, " Added successfully.", warehouse);
        res.status(201).json(successResponse);
        return;

    } catch (error) {
        console.log(error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});


const allocateDriverFinalDelivery = asyncHandler(async (req, res) => {

    try {
        const post = req.body;
        const post1 = {}
        console.log("allocateDriverFinalDelivery", post)
        let jobIDArry = []
        let jobNumber = 0
        for (let data of post.finalDeliverSelectedOrders) {
            const fetchJob = await Orders.find({ jobID: { $in: jobIDArry }, customerID: data.customerID, receiverStreetAddress: data.receiverStreetAddress })
            if (fetchJob.length > 0) {
                await Orders.updateOne({ _id: mongoose.Types.ObjectId(data.orderID) }, { $set: { jobID: fetchJob[0].jobID } })
            } else {
                post1.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
                    post1.recordType = 'I',
                    post1.assignedDriverDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000))
                let fetchWarehouse = await Warehouse.find({ _id: mongoose.Types.ObjectId(post.warehouseID) });
                const fetcOrder = await Orders.find({ _id: mongoose.Types.ObjectId(data.orderID) })
                post1.pickupContactName = fetchWarehouse[0].contactPersonName,
                    post1.pickupContactNumber = fetchWarehouse[0].contactPersonNumber,
                    post1.pickupStreetAddress = fetchWarehouse[0].streetAddress,
                    post1.pickupCity = fetchWarehouse[0].city,
                    post1.pickupZipCode = fetchWarehouse[0].zipCode,
                    post1.pickupCountryID = fetchWarehouse[0].countryId,
                    post1.pickupStateID = fetchWarehouse[0].stateId,
                    post1.senderWarehouseID = post.warehouseID
                post1.orderNumber = fetcOrder[0].orderNumber,
                    post1.jobStatus = "Job Assigned",
                    post1.assignedDriverID = post.assignedDriverID
                post1.dropContactName = fetcOrder[0].receiverName,
                    post1.dropContactNumber = fetcOrder[0].receiverContactNumber
                post1.dropStreetAddress = fetcOrder[0].receiverStreetAddress,
                    post1.dropCity = fetcOrder[0].receiverCity,
                    post1.dropZipCode = fetcOrder[0].receiverZipCode,
                    post1.dropCountryID = fetcOrder[0].receiverCountryID,
                    post1.dropStateID = fetcOrder[0].receiverStateID,
                    post1.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
                    post1.recordType = 'I'
                let fetchJobs = await OrderDriverJob.find({ businessUserID: mongoose.Types.ObjectId(post.businessUserID) }).sort({ _id: -1 }).limit(1)
                if (fetchJobs.length > 0) {
                    jobNumber = fetchJobs[0].jobNumber + 1
                } else {
                    jobNumber += 1
                }
                post1.businessUserID = post.businessUserID
                post1.jobNumber = jobNumber
                const job = await new OrderDriverJob(post1).save()
                if (job._id !== "" && job._id !== undefined) {
                    await Orders.updateOne({ _id: mongoose.Types.ObjectId(data.orderID) }, { $set: { jobID: job._id } })
                    jobIDArry.push(job._id)
                }
            }
        }
        let successResponse = genericResponse(true, " Added successfully.", []);
        res.status(201).json(successResponse);
        return;

    } catch (error) {
        console.log(error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchSummaryByLoadType = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        let fetchQuery
        let sort={}
        let query = { senderWarehouseID: mongoose.Types.ObjectId(post.warehouseID) }
        if (post.loadType === "Final Delivery") {
            fetchQuery = [

                { $match: query },
                {
                    $lookup: {
                        from: "orders",
                        localField: "_id",
                        foreignField: "jobID",
                        as: "orders",
                    }
                },
                { $unwind: "$orders" },
                {
                    $lookup: {
                        from: "order_items",
                        localField: "orders._id",
                        foreignField: "orderID",
                        as: "orderItems",
                    }
                },
                // {$unwind:"$orderItems"},
                {
                    $group: {
                        _id: {
                            orderID: "$orders._id",
                            orderNumber: "$orders.orderNumber",
                            orderItem: "$orderItems",
                            orderDate: "$orders.orderDate",
                            senderCity: "$orders.senderCity",
                            receiverCity: "$orders.receiverCity",
                            receiverName: "$orders.receiverName",
                            jobStatus: "$jobStatus",
                            jobID: "$_id",
                            droppedDateTime: "$droppedDateTime"
                        },
                        totalWeight: {
                            $sum: {
                                $reduce: {
                                    input: "$orderItems",
                                    initialValue: 0,
                                    in: { $add: ["$$value", "$$this.weightInKg"] },
                                },
                            },
                        },
                        totalVolume: {
                            $sum: {
                                $reduce: {
                                    input: "$orderItems",
                                    initialValue: 0,
                                    in: {
                                        $add: [
                                            "$$value",
                                            {
                                                $divide: [
                                                    { $multiply: ["$$this.lengthInMm", "$$this.breadthInMm", "$$this.heightInMm", "$$this.numberOfItems"] },
                                                    1000000000,
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },

                {

                    $project: {
                        _id: 0,
                        orderID: "$_id.orderID",
                        orderDa: {
                            $concat: [
                                {
                                    $let: {
                                        vars: {
                                            monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                            date: "$_id.orderDate" // Assuming this is your date field
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

                         orderDate: "$_id.orderDate",
                        senderCity: "$_id.senderCity",
                        receiverCity: "$_id.receiverCity",
                        receiverName: "$_id.receiverName",
                        jobStatus: "$_id.jobStatus",
                        totalWeight: "$totalWeight",
                        totalVolume: "$totalVolume",
                        orderNumber: "$_id.orderNumber",
                        jobID: "$_id.jobID",
                        droppedDateTime: {
                            $concat: [
                                {
                                    $let: {
                                        vars: {
                                            monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                            date: "$_id.droppedDateTime" // Assuming this is your date field
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
                        shipmentTypeAndID: { jobID: "$_id.jobID", jobStatus: "$_id.jobStatus", ID: "$_id.orderID", orderNumber: "$_id.orderNumber" }
                    }
                }
            ]

        } else {

            fetchQuery = [
                { $match: { senderWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },

                {
                    $lookup: {
                        from: "load_trailer_dropwarehouses",
                        localField: "_id",
                        foreignField: "jobID",
                        as: "loadTrailerDropwarehouses",
                    }
                },
                { $unwind: "$loadTrailerDropwarehouses" },
                {
                    $lookup: {
                        from: "load_vehicle_orders",
                        localField: "loadTrailerDropwarehouses.loadPlanVehiclesID",
                        foreignField: "loadPlanVehicleID",
                        as: "loadVehicleOrder",
                    }
                },
                { $unwind: "$loadVehicleOrder" },
                {
                    $lookup: {
                        from: "orders",
                        localField: "loadVehicleOrder.orderID",
                        foreignField: "_id",
                        as: "order",
                    }
                },
                { $unwind: "$order" },
                {
                    $lookup: {
                        from: "order_items",
                        localField: "order._id",
                        foreignField: "orderID",
                        as: "orderItems",
                    }
                },
                {
                    $group: {
                        _id: {
                            jobID: "$_id",
                            orderID: "$order._id",
                            orderNumber: "$order.orderNumber",
                            orderItem: "$orderItems",
                            orderDate: "$order.orderDate",
                            senderCity: "$order.senderCity",
                            receiverCity: "$order.receiverCity",
                            receiverName: "$order.receiverName",
                            jobStatus: "$jobStatus",
                            // loadPlanVehiclesID: "$loadPlanVehiclesID"
                        },
                        totalWeight: {
                            $sum: {
                                $reduce: {
                                    input: "$orderItems",
                                    initialValue: 0,
                                    in: { $add: ["$$value", "$$this.weightInKg"] },
                                },
                            },
                        },
                        totalVolume: {
                            $sum: {
                                $reduce: {
                                    input: "$orderItems",
                                    initialValue: 0,
                                    in: {
                                        $add: [
                                            "$$value",
                                            {
                                                $divide: [
                                                    { $multiply: ["$$this.lengthInMm", "$$this.breadthInMm", "$$this.heightInMm", "$$this.numberOfItems"] },
                                                    1000000000,
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                        },

                    },
                },

                {
                    $project: {
                        _id: 0,
                        orderID: "$_id.orderID",
                        orderDa: {
                            $concat: [
                                {
                                    $let: {
                                        vars: {
                                            monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                            date: "$_id.orderDate" // Assuming this is your date field
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
                        orderDate: "$_id.orderDate",
                        senderCity: "$_id.senderCity",
                        receiverCity: "$_id.receiverCity",
                        receiverName: "$_id.receiverName",
                        jobStatus: "$_id.jobStatus",
                        totalWeight: "$totalWeight",
                        totalVolume: "$totalVolume",
                        orderNumber: "$_id.orderNumber",
                        jobID: "$_id.jobID",
                        // loadPlanVehiclesID: "$_id.loadPlanVehiclesID",
                        shipmentTypeAndID: { jobID: "$_id.jobID", jobStatus: "$_id.jobStatus", ID: "$_id.orderID", orderNumber: "$_id.orderNumber", loadPlanVehiclesID: "$_id.loadPlanVehiclesID", }
                    }
                }



            ]

        }

        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;
      
            fetchQuery.push({ $sort: sort });
          } else {
            sort = { orderNumber: -1 } 
          }
        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
        let myAggregation = OrderDriverJob.aggregate()
        myAggregation._pipeline = fetchQuery
        OrderDriverJob.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    console.log("sdfsdf" , err)
                    const errorResponse = genericResponse(false, "Unable to fetch data", []);
                    res.status(400).json(errorResponse);
                } else {
                    let filterData = []
                    result.docs.map(orders => {
                        orders.totalVolume = parseFloat(orders.totalVolume).toFixed(4)
                        filterData.push(orders)
                    })
                    result.docs = filterData
                    const successResponse = genericResponse(true, "Data fetched successfully", result);
                    res.status(200).json(successResponse);
                }
            }
        );
    } catch (error) {
        console.log("fetchSummaryByLoadType==>", error.message)
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});



const recieveOrder = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        for (let data of post.selectedOrderIDS) {
            const fetchOrderItems = await OrderItems.find({ orderID: data.orderID })
            for (let item of fetchOrderItems) {
                if (
                    data.loadPlanVehiclesID !== "" &&
                    data.loadPlanVehiclesID !== undefined &&
                    data.loadPlanVehiclesID !== null
                ) {
                    await LoadVehicleOrder.updateMany(
                        {
                            orderItemID: item._id,
                            loadPlanVehicleID: mongoose.Types.ObjectId(data.loadPlanVehiclesID),
                        },
                        { $set: { notes: post.notes, itemStatus: "Received", receivedQty: item.numberOfItems } }
                    );
                } else {
                    await OrderItems.updateOne({ _id: mongoose.Types.ObjectId(item._id) }, {
                        $set: { notes: post.notes, itemStatus: "Received", receivedQty: item.numberOfItems },
                    });
                }
            }
            if (
                data.loadPlanVehiclesID !== "" &&
                data.loadPlanVehiclesID !== undefined &&
                data.loadPlanVehiclesID !== null
            ) {
                await LoadTrailerDropWarehouses.updateOne(
                    {
                        loadPlanVehiclesID: data.loadPlanVehiclesID,
                        dropWarehouseID: post.warehouseID,
                    },
                    { $set: { jobStatus: "Job Completed", warehouseRecievedDateTime: new Date() } }
                );

            } else {
                await OrderDriverJob.updateOne(
                    { orderID: data.orderID },
                    { $set: { jobStatus: "Job Completed", warehouseRecievedDateTime: new Date() } }
                );
            }

        }

        let successResponse = genericResponse(true, "Order Recieved Successfully!", []);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("error==>", error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});


const fetchWarehouseOrderByStatus1 = asyncHandler(async (req, res) => {

    try {
        const post = req.body;
        let query = { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID), jobStatus: { $nin: ["Pending"] } }
        let order = []

        let warID = mongoose.Types.ObjectId(post.warehouseID)

        const fetchLoadPlan = await LoadTrailerDropWarehouses.aggregate([
            { $match: { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },

            {
                $lookup: {
                    from: "load_vehicle_orders",
                    localField: "loadPlanVehiclesID",
                    foreignField: "loadPlanVehicleID",
                    pipeline: [
                        { $match: { orderDropWarehouseID: warID, itemStatus: { $in: ["Pending", "Partial Received", "Delivered"] } } },

                    ],
                    as: "loadVehicleOrders",
                }
            },
            { $unwind: "$loadVehicleOrders" },
        ])
        const OrderList = fetchLoadPlan.map(data => mongoose.Types.ObjectId(data.loadVehicleOrders.orderID))

        const fetchOrderJob = await OrderDriverJob.aggregate([

            { $match: { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },
            {
                $lookup: {
                    from: "order_items",
                    localField: "orderID",
                    foreignField: "orderID",
                    pipeline: [
                        { $match: { itemStatus: { $in: ["Pending", "Partial Received", "Delivered"] } } }

                    ],
                    as: "orderItems",
                }
            },
            { $unwind: "$orderItems" },

        ])
        const OrderIDS = fetchOrderJob.map(data => mongoose.Types.ObjectId(data.orderItems.orderID))
        let combinedAggregation = [
            {
                $facet: {
                    LoadTrailerDropWarehouses: [
                        {
                            $lookup: {
                                from: "load_trailer_dropwarehouses",
                                localField: "_id",
                                foreignField: "jobID",
                                pipeline: [
                                    { $match: { dropWarehouseID: mongoose.Types.ObjectId(post.warehouseID) } },
                                ],
                                as: "loadTrailerDropwarehouses",
                            }
                        },

                        {
                            $lookup: {
                                from: "order_driver_jobs",
                                localField: "loadTrailerDropwarehouses.jobID",
                                foreignField: "_id",
                                as: "job",
                            }
                        },
                        { $unwind: "$job" },
                        {
                            $lookup: {
                                from: "load_vehicle_orders",
                                localField: "loadTrailerDropwarehouses.loadPlanVehiclesID",
                                foreignField: "loadPlanVehicleID",
                                pipeline: [
                                    { $match: { orderDropWarehouseID: warID, orderID: { $nin: OrderList } } }

                                ],
                                as: "loadVehicleOrder",
                            }
                        },
                        { $unwind: "$loadVehicleOrder" },
                        {
                            $lookup: {
                                from: "orders",
                                localField: "loadVehicleOrder.orderID",
                                foreignField: "_id",
                                pipeline: [
                                    { $match: { jobID: { $exists: false } } }
                                ],
                                as: "order",
                            }
                        },
                        { $unwind: "$order" },
                        {
                            $lookup: {
                                from: "order_items",
                                localField: "order._id",
                                foreignField: "orderID",
                                as: "orderItems",
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    orderID: "$order._id",
                                    receiverStreetAddress: "$order.receiverStreetAddress",
                                    customerID: "$order.customerID",
                                    orderNumber: "$order.orderNumber",
                                    orderItem: "$orderItems",
                                    orderDate: "$order.orderDate",
                                    senderCity: "$order.senderCity",
                                    receiverCity: "$order.receiverCity",
                                    receiverName: "$order.receiverName",
                                    jobStatus: "$loadTrailerDropwarehouses.jobStatus",
                                    loadPlanVehiclesID: "$loadPlanVehiclesID"
                                },
                                totalWeight: {
                                    $sum: {
                                        $reduce: {
                                            input: "$orderItems",
                                            initialValue: 0,
                                            in: { $add: ["$$value", "$$this.weightInKg"] },
                                        },
                                    },
                                },
                                totalVolume: {
                                    $sum: {
                                        $reduce: {
                                            input: "$orderItems",
                                            initialValue: 0,
                                            in: {
                                                $add: [
                                                    "$$value",
                                                    {
                                                        $divide: [
                                                            { $multiply: ["$$this.lengthInMm", "$$this.breadthInMm", "$$this.heightInMm", "$$this.numberOfItems"] },
                                                            1000000000,
                                                        ],
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                orderID: "$_id.orderID",
                                orderDa: "$_id.orderDate",
                                customerID: "$_id.customerID",
                                receiverStreetAddress: "$_id.receiverStreetAddress",
                                orderDate: {
                                    $concat: [
                                        {
                                            $let: {
                                                vars: {
                                                    monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                                },
                                                in: {
                                                    $arrayElemAt: ['$$monthsInString', { $month: "$_id.orderDate" }]
                                                }
                                            }
                                        },
                                        { $dateToString: { format: "%d", date: "$_id.orderDate" } }, ", ",
                                        { $dateToString: { format: "%Y", date: "$_id.orderDate" } },
                                    ]
                                },

                                senderCity: "$_id.senderCity",
                                receiverCity: "$_id.receiverCity",
                                receiverName: "$_id.receiverName",
                                jobStatus: "$_id.jobStatus",
                                totalWeight: "$totalWeight",
                                totalVolume: "$totalVolume",
                                orderNumber: "$_id.orderNumber",
                                loadPlanVehiclesID: "$_id.loadPlanVehiclesID",
                                shipmentTypeAndID: { jobStatus: "$_id.jobStatus", ID: "$_id.orderID", orderNumber: "$_id.orderNumber", loadPlanVehiclesID: "$_id.loadPlanVehiclesID", }
                            }
                        }],
                    orderDriverJobs: [{ $match: query },
                    {
                        $lookup: {
                            from: "orders",
                            localField: "orderID",
                            pipeline: [
                                { $match: { _id: { $nin: OrderIDS }, jobID: { $exists: false } } }
                            ],
                            foreignField: "_id",
                            as: "orders",
                        }
                    },
                    { $unwind: "$orders" },
                    {
                        $lookup: {
                            from: "order_items",
                            localField: "orders._id",
                            foreignField: "orderID",

                            as: "orderItems",
                        }
                    },
                    // {$unwind:"$orderItems"},
                    {
                        $group: {
                            _id: {
                                orderID: "$orders._id",
                                orderNumber: "$orders.orderNumber",
                                orderItem: "$orderItems",
                                receiverStreetAddress: "$orders.receiverStreetAddress",
                                customerID: "$orders.customerID",
                                orderDate: "$orders.orderDate",
                                senderCity: "$orders.senderCity",
                                receiverCity: "$orders.receiverCity",
                                receiverName: "$orders.receiverName",
                                jobStatus: "$jobStatus"
                            },
                            totalWeight: {
                                $sum: {
                                    $reduce: {
                                        input: "$orderItems",
                                        initialValue: 0,
                                        in: { $add: ["$$value", "$$this.weightInKg"] },
                                    },
                                },
                            },
                            totalVolume: {
                                $sum: {
                                    $reduce: {
                                        input: "$orderItems",
                                        initialValue: 0,
                                        in: {
                                            $add: [
                                                "$$value",
                                                {
                                                    $divide: [
                                                        { $multiply: ["$$this.lengthInMm", "$$this.breadthInMm", "$$this.heightInMm", "$$this.numberOfItems"] },
                                                        1000000000,
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                            },


                        },
                    },

                    {

                        $project: {
                            _id: 0,
                            orderID: "$_id.orderID",
                            orderDa: "$_id.orderDate",
                            customerID: "$_id.customerID",
                            receiverStreetAddress: "$_id.receiverStreetAddress",
                            orderDate: {
                                $concat: [
                                    {
                                        $let: {
                                            vars: {
                                                monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                            },
                                            in: {
                                                $arrayElemAt: ['$$monthsInString', { $month: "$_id.orderDate" }]
                                            }
                                        }
                                    },
                                    { $dateToString: { format: "%d", date: "$_id.orderDate" } }, ", ",
                                    { $dateToString: { format: "%Y", date: "$_id.orderDate" } },
                                ]
                            },
                            senderCity: "$_id.senderCity",
                            receiverCity: "$_id.receiverCity",
                            receiverName: "$_id.receiverName",
                            jobStatus: "$_id.jobStatus",
                            totalWeight: "$totalWeight",
                            totalVolume: "$totalVolume",
                            orderNumber: "$_id.orderNumber",
                            shipmentTypeAndID: { jobStatus: "$_id.jobStatus", ID: "$_id.orderID", orderNumber: "$_id.orderNumber" }
                        }
                    }]
                }
            },
            {
                $project: {
                    combinedResults: {
                        $concatArrays: ["$LoadTrailerDropWarehouses", "$orderDriverJobs"]
                    }
                }
            },
            {
                $unwind: "$combinedResults"
            },
            {
                $replaceRoot: { newRoot: "$combinedResults" }
            },






        ]


        // for (let filter of order) {
        //     const fetchOrder = await LoadPlanVehicles.aggregate([
        //         { $match: { warehouseID: mongoose.Types.ObjectId(post.warehouseID) } },
        //         {
        //             $lookup: {
        //                 from: "load_vehicle_orders",
        //                 localField: "_id",
        //                 foreignField: "loadPlanVehicleID",
        //                 pipeline: [
        //                     { $match: { orderID: mongoose.Types.ObjectId(filter.orderID) } }
        //                 ],
        //                 as: "loadPlanVehicleID",
        //             }
        //         },
        //         { $unwind: "$loadPlanVehicleID" },
        //         {
        //             $project: {
        //                 orderID: "$loadPlanVehicleID.orderID"
        //             }
        //         }
        //     ])
        //     if (fetchOrder.length === 0) {
        //         finalArr.push(filter)
        //     }
        // }



        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: { orderNumber: -1 } };
        let myAggregation = OrderDriverJob.aggregate()
        myAggregation._pipeline = combinedAggregation
        OrderDriverJob.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch data", []);
                    res.status(400).json(errorResponse);
                } else {
                    console.log("DFgdfgdgdf", result)
                    const successResponse = genericResponse(true, "Data fetched successfully", result);
                    res.status(200).json(successResponse);
                }
            }
        );
        return




    }
    catch (error) {
        console.log("eroor ==>", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});








export {

    fetchWarehouseOrderByStatus,
    fetchPlanVehicle,
    fetchDroplocation,
    fetchPalletFromVehicle,
    fetchMaxPalletVolume,
    fetchSummaryByLoadedVehicleID,
    fetchSummaryByLoadType,
    fetchSlotDetailsBySlotNumber,
    fetchOrderItemsWarehouse,
    addLoadVehicleAndSlot,
    recieveOrder,
    fetchLoadedSlot, fetchLoadPlanVehicle, updatPlanLoadStatus, fetchPrimeMover, fetchDriver, assignDriverToPrime, fetchWarehouses, fetchWarehouseOrderForAllocate, fetchWarehouseOrderForFinalDelivery, allocateDriverFinalDelivery, fetchWarehouseOrderByStatus1
}