import expenses from '../models/expensesModel.js';
import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import Contacts from '../models/contactModel.js';



// Mobile API ------------->

const addExpense = asyncHandler(async (req, res) => {
    const post = req.body;
    console.log('addExpense(post)', post)
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    try {
        // const checkIfCategoryNameAlreadyExist = await expenses.find({ categoryName: { '$regex': '^' + post.categoryName.trim() + '$', '$options': 'i' } });
        // if (checkIfCategoryNameAlreadyExist.length > 0) {
        //     let successResponse = genericResponse(false, "Category Name Already Exist.", []);
        //     res.status(201).json(successResponse);
        //     return;
        // }
        // const checkIfCategoryCodeAlreadyExist = await expenses.find({ categoryCode: { '$regex': '^' + post.categoryCode.trim() + '$', '$options': 'i' } });
        // if (checkIfCategoryCodeAlreadyExist.length > 0) {
        //     let successResponse = genericResponse(false, "Category Code Already Exist.", []);
        //     res.status(201).json(successResponse);
        //     return;
        // }
        const addData = await new expenses(post).save();
        const successResponse = genericResponse(true, "add Expense Successfully", addData);
        res.status(200).json(successResponse);

    } catch (error) {
        console.log("error in addCategory=", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchSupplierInExpense = asyncHandler(async (req, res) => {
    const post = req.body;
    try {

        if (!post) return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));
        if (!post.businessUserID) return res.status(204).json(genericResponse(false, "Business UserID is missing.", []));
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), contactType: "Supplier", contactStatus: "Active" };

        const fetchContacts = await Contacts.find(query, { _id: 1, name: 1, });

        if (fetchContacts.length > 0) {
            let successResponse = genericResponse(true, "Supplier Name fetched successfully.", fetchContacts);
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "Supplier Contact : Supplier Name with Active Status is not found.", []);
            res.status(200).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log("error in fetchSupplierForRCTI =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchExpenses = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log('fetchExpenses(post)', post)
        if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
        const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
        let fetchQuery = [
            {
                $lookup: {
                    from: 'contacts',
                    localField: 'contactTypeId',
                    foreignField: '_id',
                    as: 'contacts'
                }
            },
            { $unwind: '$contacts' },
            {
                $lookup: {
                    from: 'itemcatogories',
                    localField: 'categoryNameID',
                    foreignField: '_id',
                    as: 'itemcatogories'
                }
            },
            { $unwind: '$itemcatogories' },
            {
                $project: {
                    _id: 1,
                    contactTypeId: "$contactTypeId",
                    categoryNameID: "$categoryNameID",
                    contactName: "$contacts.name",
                    categoryName: "$itemcatogories.categoryName",
                    expenseDate: { $dateToString: { format: '%Y-%m-%d', date: '$expenseDate' } },
                    // expenseDate: {
                    //     $concat: [
                    //         {
                    //             $let: {
                    //                 vars: {
                    //                     monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                    //                 },
                    //                 in: {
                    //                     $arrayElemAt: ['$$monthsInString', { $month: "$expenseDate" }]
                    //                 }
                    //             }
                    //         },
                    //         { $dateToString: { format: "%d", date: "$expenseDate" } }, ", ",
                    //         { $dateToString: { format: "%Y", date: "$expenseDate" } },
                    //     ]
                    // },
                    notes: "$notes",
                    totalAmount: "$totalAmount",
                    taxAmount: "$taxAmount",
                    tipAmount: "$tipAmount",
                    businessUserID: "$businessUserID",
                }
            },
            { $match: query },
        ];
        const fetchExp = await expenses.aggregate(fetchQuery)

        let successResponse = genericResponse(true, "Expenses fetched successfully.", fetchExp);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("error in fetchExpenses=", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const updateExpense = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
        const query = { _id: mongoose.Types.ObjectId(post._id) }
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.recordType = "U";
        var newValues = { $set: post }
        const updateItemcategories = await expenses.updateOne(query, newValues);
        let successResponse = genericResponse(true, "expenses updated successfully.", []);
        res.status(200).json(successResponse);
    } catch (error) {
        console.log("error in updateExpense=", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const deleteExpense = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
        console.log("deleteExpense ID ==> ", post._id)
        const query = { _id: mongoose.Types.ObjectId(post._id) };
        if (post._id !== undefined && post._id !== '') {
            await expenses.deleteOne(query);
            res.status(201).json(genericResponse(true, "Expense is deleted successfully", []));
        }
        else
            res.status(400).json(genericResponse(false, "Expense is not found", []));
    } catch (error) {
        console.log("Catch in deleteExpense=: ", error);
        res.status(400).json(genericResponse(false, error.message, []));
    }
});



export {

    // Mobile API ------------->
    addExpense,
    fetchExpenses,
    updateExpense,
    deleteExpense,
    fetchSupplierInExpense
}