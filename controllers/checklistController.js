import asyncHandler from "express-async-handler";
import Checklist from "../models/checklistmodel.js";
import mongoose from 'mongoose';
import genericResponse from '../routes/genericWebResponses.js';
import BusinessUsers from "../models/businessUsersModel.js";
import BussinessUserChecklist from "../models/businessUserCheckList.js";


const addChecklist = asyncHandler(async (req, res) => {
    try {

        const checkSequence = await Checklist.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, checkListSequence: req.body.checkListSequence });
        const checkSequence1 = await Checklist.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, checkListName: req.body.checkListName });
        if (checkSequence.length && checkSequence1.length > 0) {
            let successResponse = genericResponse(false, "This Checklist Name and Sequence already exist", []);
            res.status(201).json(successResponse);
            return;
        }


        if (checkSequence.length > 0) {
            let successResponse = genericResponse(false, "This Checklist Sequence already exist", []);
            res.status(201).json(successResponse);
            return;

        }
        if (checkSequence1.length > 0) {
            let successResponse = genericResponse(false, "This Checklist Name already exist", []);
            res.status(201).json(successResponse);
            return;

        }


        const post = req.body;
        console.log("post", post)
        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

        post.recordType = "I";
        const newchecklist = await new Checklist(post).save();
        if (newchecklist._id !== null) {
            let successResponse = genericResponse(true, "Driver Checklist added successfully.", []);
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

const fetchChecklist = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log(post);
        const fetchdata = await Checklist.find({});

        const successResponse = genericResponse(true, "Checklist fetched successfully", fetchdata);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("Error in registration: ", error.message);
        const errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const deleteChecklist = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        const query = { _id: mongoose.Types.ObjectId(post._id) }
        if (post._id != undefined && post._id != '') {
            await Checklist.deleteOne(query);
            res.status(201).json(genericResponse(true, 'Checklist deleted sucessfully', []))
        }
        else
            res.status(400).json(genericResponse(false, 'Checklist is  not found', []))
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
})



const fetchChecklistByID = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        const fetchChecklist = await Checklist.find(query);
        if (fetchChecklist.length > 0) {
            let successResponse = genericResponse(true, "CheckList fetched successfully.", fetchChecklist);
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

const ChecklistUpdate = asyncHandler(async (req, res) => {
    try {
        const checkSequence = await Checklist.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, checkListSequence: req.body.checkListSequence });
        const checkSequence1 = await Checklist.find({ _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, checkListName: req.body.checkListName });

        if (checkSequence.length && checkSequence1.length > 0) {
            let successResponse = genericResponse(false, "This Checklist Name and Sequence already exist", []);
            res.status(201).json(successResponse);
            return;
        }


        if (checkSequence.length > 0) {
            let successResponse = genericResponse(false, "This Checklist Sequence already exist", []);
            res.status(201).json(successResponse);
            return;

        }
        if (checkSequence1.length > 0) {
            let successResponse = genericResponse(false, "This Checklist Name already exist", []);
            res.status(201).json(successResponse);
            return;

        }

        const post = req.body;
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

        post.recordType = 'U';
        var newValues = { $set: post }
        const query = { _id: mongoose.Types.ObjectId(post._id) }
        const fetchChecklist = await Checklist.updateOne(query, newValues);
        if (fetchChecklist.nModified > 0) {
            let successResponse = genericResponse(true, "CheckList updated successfully.", []);
            res.status(200).json(successResponse);
        } else {
            let errorResponse = genericResponse(false, "CheckList not updated successfully.", []);
            res.status(200).json(errorResponse);
            return;
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});


const fetchBusinessUserName = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        const fetch = await BusinessUsers.find(
            {},
            { firstName: 1, lastName: 1 }
        );
        let successResponse = genericResponse(true, "fetchBusinessUserName fetched successfully.", fetch);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});





const addBussinessUserCheckList = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log("sdkfaf", post)
        let selectedData = []

        for (let select of post.selectedCheckListID) {
            let data = {
                businessUserID: post.businessUserID,
                checkListID: select,
                createdDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000))

            }
            selectedData.push(data)

        }

        await BussinessUserChecklist.insertMany(selectedData)
        let successResponse = genericResponse(true, "Added successfully.", []);
        res.status(201).json(successResponse);
    } catch (error) {
        console.log("error==>", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});






export { addChecklist, fetchChecklist, deleteChecklist, fetchChecklistByID, ChecklistUpdate, fetchBusinessUserName, addBussinessUserCheckList };