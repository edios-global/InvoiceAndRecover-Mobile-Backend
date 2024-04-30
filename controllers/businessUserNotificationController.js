import asyncHandler from 'express-async-handler'
import Users from '../models/UsersModel.js';
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import businessUserNotification from '../models/businessUserNotificationsModel.js';
import BusinessUsers from '../models/businessUsersModel.js';

const fetchUsersInDropdown = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        // let query = { businessUserID: mongoose.Types.ObjectId(post.id), _id: { $ne: mongoose.Types.ObjectId(post.loginID) },  userStatus: "Active" }
        let query = { businessUserID: mongoose.Types.ObjectId(post.id), userStatus: "Active" }
        const fetchUser = await Users.aggregate([
            {
                $match: query
            },
            {
                $project: {
                    fullName: { $concat: ["$firstName", " ", "$lastName"] }
                }
            }
        ]);
        let successResponse = genericResponse(true, "fetched successfully.", fetchUser);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("error in fetchUsersInDropdown  =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const addUserNotification = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.createdBy = 0;
        post.recordType = 'I';
        const firstPartySelectedUserList = post.firstPartySelectedUserId;
        const thirdPartySelectedUserList = post.thirdPartySelectedUserId;
        let addedNotification = undefined;
        let addNotification = undefined;

        await businessUserNotification.deleteMany({ businessUserID: post.id })
        for (let i = 0; i < firstPartySelectedUserList.length; i++) {
            addNotification = new businessUserNotification({
                businessUserID: post.id,
                userID: firstPartySelectedUserList[i], createdDate: post.createdDate, createdBy: post.createdBy, recordType: post.recordType,
                firstPartyReviewNotificationType: post.firstPartyReviewNotificationType
            });
            addedNotification = await addNotification.save();
        }
        for (let i = 0; i < thirdPartySelectedUserList.length; i++) {
            addNotification = new businessUserNotification({
                businessUserID: post.id,
                userID: thirdPartySelectedUserList[i], createdDate: post.createdDate, createdBy: post.createdBy, recordType: post.recordType,
                thirdPartyReviewNotificationType: post.thirdPartyReviewNotificationType
            });
            addedNotification = await addNotification.save();
        }
        const successResponse = genericResponse(true, "ADDED", addedNotification);
        res.status(201).json(successResponse);
    } catch (error) {
        res.status(200).json(genericResponse(false, error.message, []))
    }
});

const fetchSelectedUserbyId = asyncHandler(async (req, res) => {
    try {
        const query = { businessUserID: mongoose.Types.ObjectId(req.body.id) };
        if (req.body.id !== undefined && req.body.id !== '') {
            const fetchbyId = await businessUserNotification.aggregate([
                {
                    $match: query
                },
                {
                    $lookup:
                    {
                        from: 'users',
                        localField: 'userID',
                        foreignField: '_id',
                        as: 'user',

                    },
                }, {
                    $unwind: "$user"
                }, {
                    $project: {

                        firstPartyReviewNotificationType: "$firstPartyReviewNotificationType",
                        thirdPartyReviewNotificationType: "$thirdPartyReviewNotificationType",
                        UserIdList:
                        {
                            name: { $concat: ["$user.firstName", " ", "$user.lastName"] }, userID: "$userID"
                        }
                    }
                }, {
                    $group: {
                        _id: {
                            firstPartyReviewNotificationType: "$firstPartyReviewNotificationType",
                            thirdPartyReviewNotificationType: "$thirdPartyReviewNotificationType"
                        },
                        UserIdList: { $push: "$UserIdList" },
                    }
                },

            ])
            res.json(genericResponse(true, ' fetched successfully', fetchbyId));
        }
        else
            res.status(201).json(genericResponse(true, 'UserNotification not found', []))
    } catch (error) {
        res.status(200).json(genericResponse(false, error.message, []))
    }

});

const fetchPositiveEmailTemplate = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        const query = { _id: mongoose.Types.ObjectId(post.id) }
        const fetchData = await BusinessUsers.findOne(query);
        let successResponse = genericResponse(true, "Positive Email template fetched successfully.", fetchData);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("error in fetchPositiveEmailTemplate  =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const updatePositiveEmailTemplate = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: post.id };
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.recordType = "U";
        var newValues = { $set: post };
        await BusinessUsers.updateOne(query, newValues);
        let successResponse = genericResponse(true, "Positive Email template updated successfully.", []);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("error in Catch updatePositiveEmailTemplate=", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchNegativeEmailTemplate = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        const query = { _id: mongoose.Types.ObjectId(post.id) }
        const fetchData = await BusinessUsers.findOne(query);
        let successResponse = genericResponse(true, "Positive Email template fetched successfully.", fetchData);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("error in fetchPositiveEmailTemplate  =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const updateNegativeEmailTemplate = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: post.id };
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.recordType = "U";
        var newValues = { $set: post };
        await BusinessUsers.updateOne(query, newValues);
        let successResponse = genericResponse(true, "Positive Email template updated successfully.", []);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("error in Catch updatePositiveEmailTemplate=", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

export {
    fetchUsersInDropdown,
    addUserNotification,
    fetchSelectedUserbyId,
    fetchPositiveEmailTemplate,
    updatePositiveEmailTemplate,
    fetchNegativeEmailTemplate,
    updateNegativeEmailTemplate

}