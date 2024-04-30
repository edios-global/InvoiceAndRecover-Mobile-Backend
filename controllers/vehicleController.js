import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import { generateSearchParameterList, uploadImageFile } from '../routes/genericMethods.js';
import Vehicle from '../models/vehicleModel.js';
import VehicleDocument from '../models/vehicleDocumentModel.js';
import ParameterList from '../models/parameterListModel.js';

const addVehicle = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        const checkIfRegistrationNumberAlreadyExist = await Vehicle.find({ registrationNumber: { '$regex': '^' + post.registrationNumber.trim() + '$', '$options': 'i' } });
        if (checkIfRegistrationNumberAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Registration Number Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkIfVinChassisNumberAlreadyExist = await Vehicle.find({ vinChassisNumber: { '$regex': '^' + post.vinChassisNumber.trim() + '$', '$options': 'i' } });
        if (checkIfVinChassisNumberAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Vin/ChassisNumber Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        if (post.engineNumber !== "" && post.engineNumber !== undefined) {
            const checkIfEngineNumberAlreadyExist = await Vehicle.find({ engineNumber: { '$regex': '^' + post.engineNumber.trim() + '$', '$options': 'i' } });
            if (checkIfEngineNumberAlreadyExist.length > 0) {
                let successResponse = genericResponse(false, "Engine Number Already Exist.", []);
                res.status(201).json(successResponse);
                return;
            }
        }
        const checkIfEquipmentIDAlreadyExist = await Vehicle.find({ equipmentID: { '$regex': '^' + post.equipmentID.trim() + '$', '$options': 'i' } });
        if (checkIfEquipmentIDAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Equipment ID Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }

        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.recordType = "I";
        const addedVehicle = await new Vehicle(post).save();
        if (addedVehicle._id !== null) {
            let successResponse = genericResponse(true, "Add Vehicle added successfully.", []);
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

const fetchVehicle = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
        var sort = {};
        if (post.filterValues != undefined && post.filterValues != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
        const fetchQuery = [
            {
                $lookup: {
                    from: "parameter_lists",
                    localField: "vehicleCategory",
                    foreignField: "_id",
                    as: "vehicleCategory",
                }
            },
            { $unwind: "$vehicleCategory" },

            {
                $project: {
                    vehicleCategory: "$vehicleCategory.parameterListName",
                    registrationNumber: "$registrationNumber",
                    registrationExpiryDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$registrationExpiryDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$registrationExpiryDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$registrationExpiryDate" } },
                        ]
                    },
                    equipmentID: "$equipmentID",
                    location: "$location",
                    businessUserID: "$businessUserID",
                    registrationExpiryDate: "$registrationExpiryDate",
                    vehicleStatus: "$vehicleStatus",
                },
            },
            {
                $match: query
            },

        ]
        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;

            fetchQuery.push({ $sort: sort });
        } else {
            sort = { createdDate: -1 }
        }
        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
        if (post.vehicleStatus !== "All") {
            query.vehicleStatus = post.vehicleStatus;
            fetchQuery.push({ $match: query });
        }
        let myAggregation = Vehicle.aggregate()
        myAggregation._pipeline = fetchQuery
        Vehicle.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "Vehicle fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );
    } catch (error) {
        console.log("error in fetch Vehicle =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});

const fetchVehicleById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        const fetchVehicle = await Vehicle.find(query);
        if (fetchVehicle.length > 0) {
            let successResponse = genericResponse(true, "fetchVehicleById fetched successfully.", fetchVehicle);
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

const updateVehicle = asyncHandler(async (req, res) => {
    try {
        const checkIfRegistrationNumberAlreadyExist = await Vehicle.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, registrationNumber: { '$regex': '^' + req.body.registrationNumber.trim() + '$', '$options': 'i' } });
        const checkIfVinChassisNumberAlreadyExist = await Vehicle.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, vinChassisNumber: { '$regex': '^' + req.body.vinChassisNumber.trim() + '$', '$options': 'i' } });
        const checkIfEngineNumberAlreadyExist = await Vehicle.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, engineNumber: { '$regex': '^' + req.body.engineNumber.trim() + '$', '$options': 'i' } });
        const checkIfEquipmentIDAlreadyExist = await Vehicle.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, equipmentID: { '$regex': '^' + req.body.equipmentID.trim() + '$', '$options': 'i' } });
        if (checkIfRegistrationNumberAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Registration Number Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }

        if (checkIfVinChassisNumberAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Vin/ChassisNumber Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        if (req.body.engineNumber !== "" && req.body.engineNumber !== undefined) {
            if (checkIfEngineNumberAlreadyExist.length > 0) {
                let successResponse = genericResponse(false, "Engine Number Already Exist.", []);
                res.status(201).json(successResponse);
                return;
            }
        }
        if (checkIfEquipmentIDAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Equipment ID Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const post = req.body;
        post.recordType = 'U';
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        var newValues = { $set: post }
        const updateVehicle = await Vehicle.updateOne({ _id: mongoose.Types.ObjectId(req.body._id) }, newValues);
        // if (updateVehicle.modifiedCount > 0) {
        let successResponse = genericResponse(true, "Vehicle  updated successfully.", []);
        res.status(200).json(successResponse);
        // } else {
        //     let errorRespnse = genericResponse(false, "Vehicle not updated successfully.", []);
        //     res.status(200).json(errorRespnse);
        //     return;
        // }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});



const deleteVehicle = asyncHandler(async (req, res) => {
    try {
        if (req.body._id.length > 0) {
            let string = "";
            for (let data of req.body._id) {
                const fetchedVehicle = await Vehicle.find({ _id: data });
                const vehicle = fetchedVehicle[0];
                if (vehicle) {
                    var query = { vehicleID: data };
                    const teamCount = await VehicleDocument.count(query);
                    if (teamCount === 0) {
                        const deleteData = await vehicle.remove();
                    }
                    else {
                        string += `${fetchedVehicle[0].registrationNumber} ${fetchedVehicle[0].vehicleMakeModel} `
                    }
                } else {
                    let errorRespnse = genericResponse(false, "Vehicle not found.", []);
                    res.status(200).json(errorRespnse);
                    return
                }

            }

            if (string) {
                let errorRespnse = genericResponse(false, `Vehicle can't be deleted because ${string}  contains Documents Please First Documents and then Employee can be deleted.. `, []);
                res.status(200).json(errorRespnse);
                return

            } else {
                let successResponse = genericResponse(true, "Vehicle deleted successfully.", []);
                res.status(200).json(successResponse);
                return
            }
        }
        else {
            let errorRespnse = genericResponse(false, "Please Select Atleast One Vehicle", []);
            res.status(200).json(errorRespnse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const addVehicleDocument = asyncHandler(async (req, res) => {
    const post = req.body;
    try {

        if (req.files) {
            let returnedFileName = await uploadImageFile(req, "documentFileName");
            post.documentFileName = returnedFileName;
        }
        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.uploadedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.recordType = "I";
        const addedDocument = await new VehicleDocument(post).save();
        if (addedDocument._id !== null) {
            let successResponse = genericResponse(true, "add Vehicle Document added successfully.", []);
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

const fetchVehicleDocument = asyncHandler(async (req, res) => {
    const post = req.body;


    try {
        var query = { vehicleID: mongoose.Types.ObjectId(post.vehicleID) };
        var sort = {};
        if (post.filterValues != undefined && post.filterValues != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
        const fetchQuery = [
            {
                $project: {
                    documentName: "$documentName",
                    documentType: "$documentType",
                    uploadedDate: "$uploadedDate",
                    uploadedDateString: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$uploadedDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$uploadedDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$uploadedDate" } },
                        ]
                    },
                    docNameAndID: {
                        documentFileName: "$documentFileName",
                        docID: "$_id"

                    },
                    vehicleID: "$vehicleID"

                }
            }
            ,
            { $match: query },

        ];

        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;

            fetchQuery.push({ $sort: sort });
        } else {
            sort = { uploadedDate: -1 }
        }
        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
        let myAggregation = VehicleDocument.aggregate()
        myAggregation._pipeline = fetchQuery
        VehicleDocument.aggregatePaginate(
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
        console.log("error fetchVehicleDocument===>", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchVehicleDocumentById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        const document = await VehicleDocument.find(query);
        if (document.length > 0) {
            let successResponse = genericResponse(true, "Document fetched successfully.", document);
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

const updateVehicleDocument = asyncHandler(async (req, res) => {
    try {

        const post = req.body;
        console.log("post", post)
        var query = { _id: mongoose.Types.ObjectId(post.id) }
        console.log("query", query)
        if (req.files) {
            let returnedFileName = await uploadImageFile(req, "documentFileName");
            post.documentFileName = returnedFileName;
        }
        post.recordType = 'U';
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

        const updatedDocument = await VehicleDocument.updateOne(query, {
            $set: {
                documentName: post.documentName,
                documentType: post.documentType,
                documentFileName: post.documentFileName,
            }
        });

        let successResponse = genericResponse(true, "updateDocument updated successfully.", []);
        res.status(200).json(successResponse);



    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const deleteVehicleDocument = asyncHandler(async (req, res) => {

    try {
        if (req.body._id.length > 0) {
            const deleteDooc = await VehicleDocument.deleteMany({ _id: { $in: req.body._id } })
            if (deleteDooc.deletedCount === 0) {
                let errorResponse = genericResponse(false, "Something Went Wromng", []);
                res.status(200).json(errorResponse);
            } else {
                let successResponse = genericResponse(true, "Document Deleted Succesfully", []);
                res.status(200).json(successResponse);
            }
        } else {
            let errorResponse = genericResponse(false, "Select Atleast One Document", []);
            res.status(200).json(errorResponse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});

const viewFile = asyncHandler(async (req, res) => {
    try {
        let fileName = req.query.fileName;
        var options = {
            root: process.env.LOCATION_PATH,
            dotfiles: 'deny',
            headers: {
                'x-timestamp': Date.now(),
                'x-sent': true
            },
            status: genericResponse(true, "File viewed successfully.", [])
        }
        res.sendFile(fileName, options, function (error) {
            try {
                if (error) {
                    let errorRespnse = genericResponse(false, error.message, []);
                    res.status(200).json(errorRespnse);
                }
            } catch (error) {
                let errorRespnse = genericResponse(false, error.message, []);
                res.status(200).json(errorRespnse);
            }
        })
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchVehicleDocImageById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        const document = await VehicleDocument.find(query);
        if (document.length > 0) {
            let successResponse = genericResponse(true, "Document fetched successfully.", document);
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


export {
    addVehicle,
    fetchVehicle,
    fetchVehicleById,
    updateVehicle,
    deleteVehicle,
    addVehicleDocument,
    viewFile,
    fetchVehicleDocument,
    fetchVehicleDocumentById,
    updateVehicleDocument,
    deleteVehicleDocument,
    fetchVehicleDocImageById


}