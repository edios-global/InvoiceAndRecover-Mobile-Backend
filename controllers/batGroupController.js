import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import { generateSearchParameterList } from '../routes/genericMethods.js';
import Warehouse from '../models/warehouseModel.js';
import BATGroup from '../models/batGroupModel.js';
import Vehicle from '../models/vehicleModel.js';
import { MessagingConfigurationInstance } from 'twilio/lib/rest/verify/v2/service/messagingConfiguration.js';
import { createRequire } from 'module';
import BATVehicle from '../models/batVehicleModel.js';
const require = createRequire(import.meta.url);
const ObjectId = require('mongoose').Types.ObjectId;




const addBatGroup = asyncHandler(async (req, res) => {
    try {
        const checkIfbatGroupNameAlreadyExist = await BATGroup.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), batGroupName: { '$regex': '^' + req.body.batGroupName.replace(/\s+/g, ' ').trim() + '$', '$options': 'i' } });
        if (checkIfbatGroupNameAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "BAT Group Name Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        req.body.batGroupName = req.body.batGroupName.trim()
        const post = req.body;
        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.recordType = "I";
        const addedWarehouse = await new BATGroup(post).save();
        if (addedWarehouse._id !== null) {
            let successResponse = genericResponse(true, "BATGroup added successfully.", []);
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

const fetchBatGroup = asyncHandler(async (req, res) => {
    try {
        const post = req.body;

        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };

        var sort = {};
        if (post.filterValues != undefined && post.filterValues != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);


        const fetchQuery = [

            {
                $project: {
                    batGroupName: "$batGroupName",
                    tareWeight: "$tareWeight",
                    temperatureType: "$temperatureType",
                    batGroupStatus: "$batGroupStatus",
                    businessUserID: "$businessUserID",
                },
            },
            { $match: query },

        ]

        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;

            fetchQuery.push({ $sort: sort });
        } else {
            sort = { createdDate: -1 }
        }
        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
        if (post.batGroupStatus !== "All") {
            query.batGroupStatus = post.batGroupStatus;
            fetchQuery.push({ $match: query });
        }

        let myAggregation = BATGroup.aggregate()
        myAggregation._pipeline = fetchQuery
        BATGroup.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "BATGroup fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );


    } catch (error) {
        console.log("error in fetch BATGroup =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});

const fetchBatGroupById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        const fetchBatGroup = await BATGroup.find(query);
        if (fetchBatGroup.length > 0) {
            let successResponse = genericResponse(true, "fetchBatGroupById fetched successfully.", fetchBatGroup);
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

const updateBatGroup = asyncHandler(async (req, res) => {
    try {
        const checkIfbatGroupNameAlreadyExist = await BATGroup.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, batGroupName: { '$regex': '^' + req.body.batGroupName.trim() + '$', '$options': 'i' } });
        if (checkIfbatGroupNameAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "BAT Group Name Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const post = req.body;
        const query = { _id: mongoose.Types.ObjectId(post._id) }
        post.recordType = 'U';
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        var newValues = { $set: post }
        const updateWarehouse = await BATGroup.updateOne(query, newValues);

        let successResponse = genericResponse(true, "Warehouse  updated successfully.", []);
        res.status(200).json(successResponse);

    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const deleteBatGroup = asyncHandler(async (req, res) => {
    try {
        if (req.body._id.length > 0) {
            let string = "";
            for (let data of req.body._id) {
                const fetched = await BATGroup.find({ _id: data });
                const bat = fetched[0];
                if (bat) {
                    var query = { batGroupID: data };
                    const teamCount = await BATVehicle.count(query);
                    if (teamCount === 0) {
                        const deleteData = await bat.remove();
                    }
                    else {
                        string += `${fetched[0].firstName} ${fetched[0].lastName} `
                    }
                } else {
                    let errorRespnse = genericResponse(false, "BatGroup not found.", []);
                    res.status(200).json(errorRespnse);
                    return
                }

            }

            if (string) {
                let errorRespnse = genericResponse(false, ` BatGroup can't be deleted because ${string}  contains BAT Vehicle  Please First BAT Vehicle and then BatGroup can be deleted.. `, []);
                res.status(200).json(errorRespnse);
                return

            } else {
                let successResponse = genericResponse(true, "BatGroup deleted successfully.", []);
                res.status(200).json(successResponse);
                return
            }
        }
        else {
            let errorRespnse = genericResponse(false, "Please Select Atleast One BatGroup", []);
            res.status(200).json(errorRespnse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchRegistrationNumber = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        console.log("fetchRegistrationNumber(post)", post)
        let vcQuery = { businessUserID: post.businessUserID, vehicleCategory: post.vehicleCategory, vehicleStatus: "Active" };
        const fetchPlan = await Vehicle.find(vcQuery)
        let successResponse = genericResponse(true, "fetchRegistrationNumber fetched successfully.", fetchPlan);
        res.status(201).json(successResponse);

    } catch (error) {
        console.log(error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }

});

const fetchDetailsByRegistration = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        let rnQuery = { vehicleCategory: mongoose.Types.ObjectId(post.vehicleCategory), registrationNumber: post.registrationNumber, vehicleStatus: "Active" };
        const fetchPlan = await Vehicle.find(rnQuery);
        let successResponse = genericResponse(true, "fetchDetailsByRegistration fetched successfully.", fetchPlan);
        res.status(201).json(successResponse);
    } catch (error) {
        console.log(error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});

// =========> batVehicle

const addBatVehicle = asyncHandler(async (req, res) => {
    try {
        const checkIfRegistrationNumberAlreadyExist = await BATVehicle.countDocuments({ batGroupID: mongoose.Types.ObjectId(req.body.batGroupID), registrationNumber: { '$regex': '^' + req.body.registrationNumber.trim() + '$', '$options': 'i' } });
        if (checkIfRegistrationNumberAlreadyExist > 0) {
            let successResponse = genericResponse(false, "Registration Number Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const post = req.body;
        delete post._id;
        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.recordType = "I"
        const addedParameter = await new BATVehicle(post).save();
        if (addedParameter._id !== null) {
            let successResponse = genericResponse(true, "addBatVehicle added successfully.", []);
            res.status(201).json(successResponse);
            return;
        } else {
            let errorRespnse = genericResponse(false, error.message, []);
            res.status(200).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log("errror=>", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchBatVehicle = asyncHandler(async (req, res) => {
    try {
        const post = req.body;

        var query = { batGroupID: mongoose.Types.ObjectId(post._id) };
        console.log("query", query)
        var sort = {};
        if (post.filterValues != undefined && post.filterValues != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);

        const fetchQuery = [
            {
                $lookup: {
                    from: "parameter_lists",
                    localField: "vehicleCategory",
                    foreignField: "_id",
                    as: "vc"
                }
            },
            { $unwind: '$vc' },
            {
                $project: {
                    vehicleCategory: "$vc.parameterListName",
                    registrationNumber: "$registrationNumber",
                    vehicleMakeModel: "$vehicleMakeModel",
                    vehicleManufacturingYear: "$vehicleManufacturingYear",
                    vinChassisNumber: "$vinChassisNumber",
                    engineNumber: "$engineNumber",
                    batGroupID: "$batGroupID",

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

        let myAggregation = BATVehicle.aggregate()
        myAggregation._pipeline = fetchQuery
        BATVehicle.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "BATGroup fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );


    } catch (error) {
        console.log("error in fetch BATGroup =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});

const fetchBatVehicleold = asyncHandler(async (req, res) => {
    const post = req.body;
    console.log("fetchBatVehicle(post)", post)
    try {
        var query = { batGroupID: mongoose.Types.ObjectId(post._id) };
        var mysort = { registrationNumber: 1 };
        var mycollection = { locale: "en", caseLevel: true };

        const fetchpara = [
            {
                $lookup: {
                    from: "parameter_lists",
                    localField: "vehicleCategory",
                    foreignField: "_id",
                    as: "vc"
                }
            },
            { $unwind: '$vc' },
            {
                $project: {
                    vehicleCategory: "$vc.parameterListName",
                    registrationNumber: "$registrationNumber",
                    vehicleMakeModel: "$vehicleMakeModel",
                    vehicleManufacturingYear: "$vehicleManufacturingYear",
                    vinChassisNumber: "$vinChassisNumber",
                    engineNumber: "$engineNumber",
                }
            },
            {
                $match: { query }
            },
        ];

        const fetchData = await BATVehicle.aggregate(fetchpara)

        let successResponse = genericResponse(true, "BATVehicle fetched successfully.", fetchData);
        res.status(200).json(successResponse);

    } catch (error) {
        console.log("sdnsdnksa", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchBatVehicleById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log("gpostf", post)

        var query = { _id: mongoose.Types.ObjectId(post._id) };
        const batVehicle = await BATVehicle.find(query);
        if (batVehicle.length > 0) {
            let successResponse = genericResponse(true, "fetchBatVehicleById fetched successfully.", batVehicle);
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

const updateBatVehicle = asyncHandler(async (req, res) => {
    try {
        const checkIfRegistrationNumberAlreadyExist = await BATVehicle.find({ batGroupID: mongoose.Types.ObjectId(req.body.batGroupID), _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, registrationNumber: req.body.registrationNumber });
        if (checkIfRegistrationNumberAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Registration Number Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const post = req.body;
        console.log("post", post)
        var query = { _id: mongoose.Types.ObjectId(post._id) }
        console.log("query", query)
        post.recordType = 'U';
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        var newValues = { $set: post }
        const updatedVehicle = await BATVehicle.updateOne(query, newValues);

        let successResponse = genericResponse(true, "updateBatVehicle updated successfully.", updatedVehicle);
        res.status(200).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const deleteBatVehicle = asyncHandler(async (req, res) => {
    try {
        if (req.body._id.length > 0) {
            const fetched = await BATVehicle.deleteMany({ _id: { $in: req.body._id } });
            let successResponse = genericResponse(true, "deleteBatVehicle deleted successfully.", []);
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

export {
    addBatGroup,
    fetchBatGroup,
    fetchBatGroupById,
    updateBatGroup,
    deleteBatGroup,
    fetchRegistrationNumber,
    fetchDetailsByRegistration,
    addBatVehicle,
    fetchBatVehicle,
    fetchBatVehicleById,
    updateBatVehicle,
    deleteBatVehicle,

}