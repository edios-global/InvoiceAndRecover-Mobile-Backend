import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import Parameter from '../models/parameterModel.js';
import ParameterList from '../models/parameterListModel.js';
import { generateSearchParameterList } from '../routes/genericMethods.js';



const addParameter = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        const checkIfParameterNameAlreadyExist = await Parameter.find({ parameterName: { '$regex': '^' + post.parameterName.trim() + '$', '$options': 'i' } });
        if (checkIfParameterNameAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Parameter Name Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkIfParameterCodeAlreadyExist = await Parameter.find({ parameterCode: { '$regex': '^' + post.parameterCode.trim() + '$', '$options': 'i' } });
        if (checkIfParameterCodeAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Parameter Code Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        const addedParameter = await new Parameter(post).save();
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

const fetchParameter = asyncHandler(async (req, res) => {
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
            {
                $project: {
                    parameterName: "$parameterName",
                    parameterCode: "$parameterCode",
                    parameterStatus: "$parameterStatus"
                },
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
        let myAggregation = Parameter.aggregate()
        myAggregation._pipeline = fetchQuery
        Parameter.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "Parameter fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );

    } catch (error) {
        console.log("error in fetch Parameter  =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});

// const fetchParameter1 = asyncHandler(async (req, res) => {
//     try {
//         const post = req.body;
//         var mysort = { _id: 1 };
//         let query = {};
//         if (post.searchParameter != undefined && post.searchParameter != '')
//             query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);

//         const fetchParameter = [
//             {
//                 $match: query
//             },

//             { $sort: { _id: 1 } }
//         ]
//         const fetchCount = (await Parameter.aggregate(fetchParameter)).length;
//         const fetchData = await Parameter.aggregate(fetchParameter).skip(post.initialValue).limit(post.finalValue);
//         let successResponse = genericResponse(true, "Parameter fetched successfully.", {
//             list: fetchData,
//             count: fetchCount
//         });
//         res.status(200).json(successResponse);
//     } catch (error) {
//         console.log("error in fetch Parameter  =", error);
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(400).json(errorRespnse);
//     }

// });

const fetchParameterById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        const parameter = await Parameter.find(query);
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

const updateParameter = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        console.log("dfksdjfs", post)
        const query = { _id: mongoose.Types.ObjectId(post._id) }
        post.recordType = 'U';
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        var newValues = { $set: post }
        await Parameter.updateOne(query, newValues);
        let successResponse = genericResponse(true, "Parameter  updated successfully.", []);
        res.status(200).json(successResponse);

    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const deleteParameter = asyncHandler(async (req, res) => {
    try {
        if (req.body._id != undefined && req.body._id != '') {
            const fetchedParameter = await Parameter.find({ _id: req.body._id });
            const parameters = fetchedParameter[0];
            if (parameters) {
                var query = { parameterId: req.body._id };
                const teamCount = await ParameterList.count(query);
                if (teamCount == 0) {
                    const deleteData = await parameters.remove();
                    // const deleteParameterList = await ParameterList.deleteMany({ parameterId: req.body._id });
                    let successResponse = genericResponse(true, "Parameter deleted successfully.", []);
                    res.status(200).json(successResponse);
                }
                else {
                    let errorRespnse = genericResponse(false, " Parameter can't be deleted because it contains List values Please First Delete List values and then parameter can be deleted..", []);
                    res.status(200).json(errorRespnse);
                }
            } else {
                let errorRespnse = genericResponse(false, "Parameter not found.", []);
                res.status(200).json(errorRespnse);
            }
        }
        else {
            let errorRespnse = genericResponse(false, "Parameter not found.", []);
            res.status(200).json(errorRespnse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

// ------> parameterList Api

const addParameterList = asyncHandler(async (req, res) => {

    try {

        console.log("req", req.body)

        const checkIfParameterListNameAlreadyExist = await ParameterList.find({ parameterId: mongoose.Types.ObjectId(req.body.parameterId), parameterListName: { '$regex': '^' + req.body.parameterListName.trim() + '$', '$options': 'i' } });
        if (checkIfParameterListNameAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Parameter List Name Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkIfParameterListCodeAlreadyExist = await ParameterList.find({ parameterId: mongoose.Types.ObjectId(req.body.parameterId), parameterListCode: { '$regex': '^' + req.body.parameterListCode.trim() + '$', '$options': 'i' } });
        if (checkIfParameterListCodeAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Parameter List Code Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkIfParameterListSequenceAlreadyExist = await ParameterList.find({ parameterId: mongoose.Types.ObjectId(req.body.parameterId), parameterListSequence: req.body.parameterListSequence });
        if (checkIfParameterListSequenceAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Parameter List Sequence Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const post = req.body;
        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        const addedParameter = await new ParameterList(post).save();
        if (addedParameter._id !== null) {
            let successResponse = genericResponse(true, "ParameterList added successfully.", []);
            res.status(201).json(successResponse);
            return;
        } else {
            let errorRespnse = genericResponse(false, error.message, []);
            res.status(200).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log("add parameter list Error ==>", error.messagez)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchParameterList = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        var query = { parameterId: mongoose.Types.ObjectId(post.parameterId) }
        var sort = {};
        if (post.filterValues != undefined && post.filterValues != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);

        const fetchQuery = [
            {
                $match: query
            },
            {
                $project: {
                    parameterListName: "$parameterListName",
                    parameterListCode: "$parameterListCode",
                    parameterListSequence: "$parameterListSequence",
                    parameterListStatus: "$parameterListStatus",
                    parameterId: "$parameterId"
                }
            }

        ];


        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;

            fetchQuery.push({ $sort: sort });
        } else {
            sort = { parameterListName: -1 }
        }
        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
        if (post.parameterListStatus !== "All") {
            query.parameterListStatus = post.parameterListStatus;
            fetchQuery.push({ $match: query });
        }
        let myAggregation = ParameterList.aggregate()
        myAggregation._pipeline = fetchQuery
        ParameterList.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    console.log("Err==>", err)
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "Parameter List fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );
    } catch (error) {
        console.log("error", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchParameterListById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        const parameter = await ParameterList.find(query);
        if (parameter.length > 0) {
            let successResponse = genericResponse(true, "ParameterList fetched successfully.", parameter);
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

const updateParameterList = asyncHandler(async (req, res) => {
    try {
        const checkIfParameterListNameAlreadyExist = await ParameterList.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, parameterId: mongoose.Types.ObjectId(req.body.parameterId), parameterListName: { '$regex': '^' + req.body.parameterListName.trim() + '$', '$options': 'i' } });
        if (checkIfParameterListNameAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Parameter List Name Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkIfParameterListCodeAlreadyExist = await ParameterList.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, parameterId: mongoose.Types.ObjectId(req.body.parameterId), parameterListCode: { '$regex': '^' + req.body.parameterListCode.trim() + '$', '$options': 'i' } });
        if (checkIfParameterListCodeAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Parameter List Code Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkIfParameterListSequenceAlreadyExist = await ParameterList.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, parameterId: mongoose.Types.ObjectId(req.body.parameterId), parameterListSequence: req.body.parameterListSequence });
        if (checkIfParameterListSequenceAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Parameter List Sequence Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const updateList = req.body;
        updateList.recordType = 'U';
        updateList.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        var newValues = { $set: updateList }
        const updatedGame = await ParameterList.updateOne({ _id: mongoose.Types.ObjectId(req.body._id) }, newValues);
        let successResponse = genericResponse(true, "updateParameterList updated successfully.", []);
        res.status(200).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const deleteParameterList = asyncHandler(async (req, res) => {
    try {
        if (req.body._id != undefined && req.body._id != '') {
            const fetchedList = await ParameterList.find({ _id: req.body._id });
            const list = fetchedList[0];
            if (list._id !== null) {
                var query = { parameterId: req.body._id };
                const Count = await ParameterList.count(query);
                if (Count == 0) {
                    const deleteGame = await list.remove();
                    let successResponse = genericResponse(true, "ParameterList deleted successfully.", []);
                    res.status(200).json(successResponse);
                }
                else {
                    let errorRespnse = genericResponse(false, "Assigned ParameterList can't be deleted", []);
                    res.status(200).json(errorRespnse);
                }
            } else {
                let errorRespnse = genericResponse(false, "ParameterList not found.", []);
                res.status(200).json(errorRespnse);
            }
        }
        else {
            let errorRespnse = genericResponse(false, "ParameterList not found.", []);
            res.status(200).json(errorRespnse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchParameterListName = asyncHandler(async (req, res) => {

    const post = req.body;

    try {


        let fetchQuery = [
            {
                $lookup: {
                    from: "parameter_lists",
                    localField: "_id",
                    foreignField: "parameterId",
                    pipeline: [
                        {
                            $match: { parameterListStatus: "Active" }
                        }
                    ],
                    as: "parameterlist"

                }
            },
            {
                $project: {
                    parameterName: "$parameterName",
                    parameterList: "$parameterlist",
                    parameterCode: "$parameterCode",
                    customValue1: "$customValue1"

                }

            }

        ]

        const fetchPlan = await Parameter.aggregate(fetchQuery)

        let successResponse = genericResponse(true, "fetchParameter fetched successfully.", fetchPlan);
        res.status(201).json(successResponse);

    } catch (error) {
        console.log(error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }

});


const fetchParameterListForGST = asyncHandler(async (req, res) => {
    try {
        const post = req.body;

        const fetchPara = await Parameter.aggregate([
            {
                $match: { parameterCode: "GST" }
            },
            {
                $lookup: {
                    from: "parameter_lists",
                    localField: "_id",
                    foreignField: "parameterId",
                    as: "parameterlist"
                }
            },
            {
                $unwind: "$parameterlist"
            },
            {
                $match: { "parameterlist.parameterListStatus": "Active" }
            },
            {
                $project: {
                    parameterListName: "$parameterlist.parameterListName",
                    customValue1: "$parameterlist.customValue1"
                }
            }
        ]);

        if (!fetchPara || fetchPara.length === 0) {
            throw new Error("No parameter found for the given code.");
        }

        let successResponse = genericResponse(true, "fetchParameter fetched successfully.", fetchPara);
        res.status(200).json(successResponse);

    } catch (error) {
        console.log(error);
        let errorResponse = genericResponse(false, error.message, []);
        res.status(500).json(errorResponse);
    }
});

export {
    addParameter,
    fetchParameter,
    fetchParameterById,
    updateParameter,
    deleteParameter,
    addParameterList,
    fetchParameterList,
    fetchParameterListById,
    updateParameterList,
    deleteParameterList,
    fetchParameterListName,
    fetchParameterListForGST
}