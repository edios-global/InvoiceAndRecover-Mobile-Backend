import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import { generateSearchParameterList } from '../routes/genericMethods.js';
import Warehouse from '../models/warehouseModel.js';
import TestData from '../models/testDataModel.js';




const addWarehouse = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        const checkIfWarehouseNameAlreadyExist = await Warehouse.find({ warehouseName: { '$regex': '^' + post.warehouseName.trim() + '$', '$options': 'i' } });
        if (checkIfWarehouseNameAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Warehouse Name already exists.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkIfWarehouseCodeAlreadyExist = await Warehouse.find({ warehouseCode: { '$regex': '^' + post.warehouseCode.replace(/\s+/g, ' ').trim() + '$', '$options': 'i' } });
        if (checkIfWarehouseCodeAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Warehouse Code already exists.", []);
            res.status(201).json(successResponse);
            return;
        }
        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.recordType = "I";
        const addedWarehouse = await new Warehouse(post).save();
        if (addedWarehouse._id !== null) {
            let successResponse = genericResponse(true, "add Warehouse added successfully.", []);
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

const fetchWarehouse = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = {
            // warehouseStatus: post.warehouseStatus,
            businessUserID: mongoose.Types.ObjectId(post.businessUserID)
        };
        var sort = {};
        if (post.filterValues != undefined && post.filterValues != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
        let fetchQuery = [

            {
                $lookup: {
                    from: "country_states",
                    localField: "stateId",
                    foreignField: "_id",
                    as: "state"
                }
            },
            { $unwind: '$state' },
            {
                $project: {
                    warehouseName: "$warehouseName",
                    warehouseCode: "$warehouseCode",
                    warehouseStatus: "$warehouseStatus",
                    city: "$city",
                    businessUserID: "$businessUserID",
                    stateName: "$state.stateName",
                },
            },
            { $match: query }

        ]
        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;

            fetchQuery.push({ $sort: sort });
        } else {
            sort = { createdDate: -1 }
        }
        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
        if (post.warehouseStatus !== "All") {
            query.warehouseStatus = post.warehouseStatus;
            fetchQuery.push({ $match: query });
        }
        let myAggregation = Warehouse.aggregate()
        myAggregation._pipeline = fetchQuery
        Warehouse.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "Warehouse fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );
    } catch (error) {
        console.log("error in fetch Warehouse =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});


const fetchWarehouseById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        const fetchWarehouse = await Warehouse.find(query);
        if (fetchWarehouse.length > 0) {
            let successResponse = genericResponse(true, "fetchWarehouseById fetched successfully.", fetchWarehouse);
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

// const updateWarehouse = asyncHandler(async (req, res) => {
//     const post = req.body;
//     console.log("post",post)
//     try {
//         const query = { _id: mongoose.Types.ObjectId(post._id) }
//         post.recordType = 'U';
//         post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//         var newValues = { $set: post }
//         const updateWarehouse = await Warehouse.updateOne(query, newValues);
//         if (updateWarehouse.modifiedCount > 0) {
//             let successResponse = genericResponse(true, "Warehouse  updated successfully.", []);
//             res.status(200).json(successResponse);
//         } else {
//             let errorRespnse = genericResponse(false, "Warehouse not updated successfully.", []);
//             res.status(200).json(errorRespnse);
//             return;
//         }
//     } catch (error) {
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(400).json(errorRespnse);
//     }
// });

const updateWarehouse = asyncHandler(async (req, res) => {
    try {
        const checkIfWarehouseNameAlreadyExist = await Warehouse.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, warehouseName: { '$regex': '^' + req.body.warehouseName.trim() + '$', '$options': 'i' } });
        if (checkIfWarehouseNameAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Warehouse Name Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkIfWarehouseCodeAlreadyExist = await Warehouse.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, warehouseCode: { '$regex': '^' + req.body.warehouseCode.trim() + '$', '$options': 'i' } });
        if (checkIfWarehouseCodeAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Warehouse Code Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const post = req.body;
        const query = { _id: mongoose.Types.ObjectId(post._id) }
        post.recordType = 'U';
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        var newValues = { $set: post }
        const updateWarehouse = await Warehouse.updateOne(query, newValues);
        let successResponse = genericResponse(true, "Warehouse  updated successfully.", []);
        res.status(200).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});



const deleteWarehouse = asyncHandler(async (req, res) => {
    try {
        if (req.body._id.length > 0) {
            const fetchedWarehouse = await Warehouse.deleteMany({ _id: { $in: req.body._id } });
            let successResponse = genericResponse(true, "deleteWarehouse deleted successfully.", []);
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

const fetchWarehouseList = asyncHandler(async (req, res) => {
    try {
        let mysort = { _id: 1 };
        var mycollection = { locale: "en", caseLevel: true };
        const post = req.body;
        const fetchCS = await Warehouse.find({ warehouseStatus: "Active", businessUserID: mongoose.Types.ObjectId(post.businessUserID) }).sort(mysort).collation(mycollection);
        let successResponse = genericResponse(true, "fetchWarehouseList fetched successfully.", fetchCS);
        res.status(200).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
})


const addData = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        const added = await TestData.insertMany(post);
        if (added._id !== null) {
            let successResponse = genericResponse(true, "add  added successfully.", []);
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

const fetchtempData = asyncHandler(async (req, res) => {
    try {
        const added = await TestData.find();
        let successResponse = genericResponse(true, "add  added successfully.", added);
        res.status(201).json(successResponse);
        return;

    } catch (error) {
        console.log(error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

export {
    addWarehouse,
    fetchWarehouse,
    fetchWarehouseById,
    updateWarehouse,
    deleteWarehouse,
    fetchWarehouseList,
    addData, fetchtempData

}