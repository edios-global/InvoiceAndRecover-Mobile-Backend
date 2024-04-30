import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import parameterSettings from '../models/ParameterSettingModel.js';
import mongoose from 'mongoose';
import { generateSearchParameterList } from '../routes/genericMethods.js';



const addParameterSettings = asyncHandler(async (req, res) => {
    const post = req.body;

    try {
        const checkIfParameterCodeAlreadyExist = await parameterSettings.find({ parameterCode: { '$regex': '^' + post.parameterCode.trim() + '$', '$options': 'i' } });
        if (checkIfParameterCodeAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Parameter Code Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkIfParameterNameAlreadyExist = await parameterSettings.find({ parameterName: { '$regex': '^' + post.parameterName.trim() + '$', '$options': 'i' } });
        if (checkIfParameterNameAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Parameter Name Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        const addedParameter = await new parameterSettings(post).save();

        if (addedParameter._id !== null) {
            let successResponse = genericResponse(true, "Parameter added successfully.", []);
            res.status(201).json(successResponse);
            return;
        } else {
            let errorRespnse = genericResponse(false, error.message, []);
            res.status(200).json(errorRespnse);
            return;
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const updateParameterSettings = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        const query = { _id: mongoose.Types.ObjectId(post._id) }
        post.recordType = 'U';
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        var newValues = { $set: post }
        const updateParameter = await parameterSettings.updateOne(query, newValues);

        let successResponse = genericResponse(true, "Parameter Settings updated successfully.", []);
        res.status(200).json(successResponse);

    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchParameterById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post.id) };
        const parameter = await parameterSettings.find(query);
        if (parameter.length > 0) {
            let successResponse = genericResponse(true, "Parameter fetched successfully.", parameter);
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


const fetchParameterSettings = asyncHandler(async (req, res) => {
    try {
        const post = req.body;

        var query = {};

        var sort = {};
        if (post.filterValues != undefined && post.filterValues != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
        const fetchQuery = [

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
        if (post.parameterStatus !== "All") {
            query.parameterStatus = post.parameterStatus;
            fetchQuery.push({ $match: query });
        }

        let myAggregation = parameterSettings.aggregate()
        myAggregation._pipeline = fetchQuery
        parameterSettings.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "parameter Settings fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );

    } catch (error) {
        console.log("error in fetchUser  =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});


const deleteParameterSettings = asyncHandler(async (req, res) => {
    try {
        if (req.body._id.length > 0) {
            const parameter = await parameterSettings.deleteMany({ _id: { $in: req.body._id } });
            let successResponse = genericResponse(true, "deleteParameterSettings deleted successfully.", []);
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
    fetchParameterSettings, fetchParameterById, updateParameterSettings, addParameterSettings, deleteParameterSettings

}