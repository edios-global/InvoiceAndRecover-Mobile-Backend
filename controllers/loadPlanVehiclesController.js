import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import Vehicle from '../models/vehicleModel.js';
import LoadPlanVehicles from '../models/loadPlanVehicleModel.js';
import Warehouse from '../models/warehouseModel.js';
import LoadTrailerDropWarehouses from '../models/loadTrailerDropWarehouseModel.js';
import { generateSearchParameterList } from '../routes/genericMethods.js';



const loadVehicleCategory = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
    var fetchQuery = [
      { $match: query },
      {
        $lookup: {
          from: "parameter_lists",
          localField: "vehicleCategory",
          foreignField: "_id",
          pipeline: [
            { $match: { parameterListName: "Trailer" } }
          ],
          as: "parameterlists",
        }
      },
      { $unwind: "$parameterlists" },


      {
        $lookup: {
          from: "load_plan_vehicles",
          localField: "_id",
          foreignField: "vehicleID",
          as: "loadPlanVehicle",
          pipeline: [
            { $match: { vehicleStatus: { $nin: ["Completed"] } } }
          ]
        }
      },
      {
        $project: {
          registrationNumber: 1,
          vehicleCategory: "Trailer",
          vehicleType: 1,
          palletCount: 1,
          vehicleAllocated: { $size: "$loadPlanVehicle" }
        }
      },
    ];

    const userCount = await Vehicle.aggregate(fetchQuery)
    let successResponse = genericResponse(
      true,
      "Vehicles with Trailer category fetched successfully.",
      userCount
    );
    res.status(200).json(successResponse);
  } catch (error) {
    console.log(error);
    let errorResponse = genericResponse(false, error.message, []);
    res.status(500).json(errorResponse);
  }
});

const addloadVehicleCategory = asyncHandler(async (req, res) => {
  try {

    const post = req.body;
    console.log("post", post)
    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "I";
    const loadVehicles = await new LoadPlanVehicles(post).save();
    if (loadVehicles._id !== null) {


      let addData = []
      for (let data of post.selectedIDS) {
        let obj = {
          loadPlanVehiclesID: loadVehicles._id,
          dropWarehouseID: data,
          createdDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
          trailerStatus: "open",
          jobStatus: "Not Assigned"
        }
        addData.push(obj)

      }
      await LoadTrailerDropWarehouses.insertMany(addData)
      let successResponse = genericResponse(true, "Load Plan Vehicles added successfully.", []);
      res.status(201).json(successResponse);
      return;
    } else {
      let errorRespnse = genericResponse(false, error.message, []);
      res.status(200).json(errorRespnse);
      return;
    }
  } catch (error) {
    console.log(error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchLoadPlanVehicles = asyncHandler(async (req, res) => {
  try {
    const post = req.body;

    var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), warehouseID: mongoose.Types.ObjectId(post.warehouseID) };

    var sort = {};
    if (post.filterValues != undefined && post.filterValues != '')
      query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);

    let fetchQuery = [
      {
        $project: {
          vehicleCategory: "$vehicleCategory",
          registrationNumber: "$registrationNumber",
          businessUserID: "$businessUserID",
          warehouseID: "$warehouseID",
          vehicleStatus: "$vehicleStatus",
        }
      },
      { $match: query }
    ];

    if (post.sortingType && post.sortingField) {
      var sortField = post.sortingField;
      sort[sortField] = post.sortingType;
      fetchQuery.push({ $sort: sort });
    } else {
      sort = { createdDate: -1 }
    }
    let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };

    let myAggregation = LoadPlanVehicles.aggregate()
    myAggregation._pipeline = fetchQuery
    LoadPlanVehicles.aggregatePaginate(
      myAggregation,
      options,
      (err, result) => {
        if (err) {
          const errorResponse = genericResponse(false, "Unable to fetch", []);
          res.status(400).json(errorResponse);

        } else {
          const successResponse = genericResponse(true, "LoadPlanVehicles fetched successfully", result);
          res.status(200).json(successResponse);
        }
      }
    );

  } catch (error) {
    console.log("error in LoadPlanVehicles==", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});


const deleteLoadPlanVehicles = asyncHandler(async (req, res) => {
  try {
    if (req.body._id.length > 0) {
      const objectIdArray = req.body._id.map(id => mongoose.Types.ObjectId(id));
      await LoadPlanVehicles.deleteMany({ _id: { $in: objectIdArray } });
      await LoadTrailerDropWarehouses.deleteMany({ loadPlanVehiclesID: { $in: objectIdArray } })
      res.status(201).json(genericResponse(true, 'deleteLoadPlanVehicles deleted sucessfully', []))
    }
    else
      res.status(400).json(genericResponse(false, 'deleteLoadPlanVehicles is  not found', []))
  } catch (error) {
    console.log("xc", error.message)
    res.status(400).json(genericResponse(false, error.message, []))
  }
});

const fetchLoadPlanVehiclesByID = asyncHandler(async (req, res) => {
  try {
    const post = req.body;

    let fetchQuery = [
      {
        $lookup: {
          from: "load_trailer_dropwarehouses",
          localField: "_id",
          foreignField: "loadPlanVehiclesID",
          as: "loadTrailerDropwarehouses",
        }
      },
      // {$unwind:"$loadTrailerDropwarehouses"},
      {
        $project: {
          vehicleStatus: 1,
          vehicleID: 1,
          maximumWeight: 1,
          maximumVolume: 1,
          shippingType: 1,
          warehouseID: "$loadTrailerDropwarehouses.dropWarehouseID"

        }
      },

      { $match: { _id: mongoose.Types.ObjectId(post._id) } }
    ]

    const loadVehicleID = await LoadPlanVehicles.aggregate(fetchQuery);

    if (loadVehicleID.length > 0) {
      let successResponse = genericResponse(true, "fetchLoadPlanVehiclesByID fetched successfully.", loadVehicleID);
      res.status(201).json(successResponse);
    } else {
      let errorResponse = genericResponse(false, "Something went wrong. Try again!", []);
      res.status(200).json(errorResponse);
      return;
    }
  } catch (error) {
    let errorResponse = genericResponse(false, error.message, []);
    res.status(400).json(errorResponse);
  }
});

const loadPlanVehiclesUpdate = asyncHandler(async (req, res) => {
  try {

    const post = req.body;
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

    post.recordType = 'U';
    var newValues = { $set: post }

    const query = { _id: mongoose.Types.ObjectId(post._id) }
    const vehicleUpdate = await LoadPlanVehicles.updateOne(query, newValues);
    const deleteRecord = await LoadTrailerDropWarehouses.deleteMany({ loadPlanVehiclesID: mongoose.Types.ObjectId(post._id) })
    let addData = []
    for (let data of post.selectedIDS) {
      let obj = {
        loadPlanVehiclesID: post._id,
        dropWarehouseID: data,
        createdDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
        trailerStatus: "open",
        jobStatus: "Not Assigned"

      }
      addData.push(obj)

    }
    console.log("afjafjkadhfk", addData)
    await LoadTrailerDropWarehouses.insertMany(addData)





    let successResponse = genericResponse(true, "LoadPlanVehiclesUpdate updated successfully.", []);
    res.status(200).json(successResponse);

  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchWarehouseByID = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const fetch = await Warehouse.find({ businessUserID: mongoose.Types.ObjectId(post.businessUserID), warehouseStatus: "Active" })
    let successResponse = genericResponse(true, " fetchWarehouseByName fetched successfully.", fetch);
    res.status(201).json(successResponse);
  }
  catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});
export { loadVehicleCategory, addloadVehicleCategory, fetchLoadPlanVehicles, deleteLoadPlanVehicles, fetchLoadPlanVehiclesByID, loadPlanVehiclesUpdate, fetchWarehouseByID };


