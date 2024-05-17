import asyncHandler from "express-async-handler";
import InvoicePdfFormat from "../models/invoicePdfFormatModel.js";
import genericResponse from "../routes/genericWebResponses.js";
import mongoose from "mongoose";

const addInvoicePdfFormat = asyncHandler(async (req, res) => {
    try {
        const post = req.body;

        console.log("addInvoicePdfFormat(post)", post);

        const query = { _id: mongoose.Types.ObjectId(post._id) }

        let fetch = await InvoicePdfFormat.findOne(query);
        console.log("fetch", fetch);
        if (fetch !== null) {
            post.recordType = "U";
            post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            const pdfFormat = await InvoicePdfFormat.updateOne(query, { $set: post });
            console.log("pdfFormat", pdfFormat);

            if (pdfFormat.n === 1) {
                let successResponse = genericResponse(true, "Invoice PDF update successfully.", []);
                res.status(200).json(successResponse);
                return
            } else {
                let errorRespnse = genericResponse(false, "Something went wrong, Try again!", []);
                return res.status(200).json(errorRespnse);
            }

        } else {
            console.log("post", post);
            post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            post.recordType = "I";
            // const pdfFormat = await InvoicePdfFormat.create(post);
            const pdfFormat = await new InvoicePdfFormat(post).save();
            console.log("pdfFormat", pdfFormat);
            if (pdfFormat._id) {
                let successResponse = genericResponse(true, "Invoice PDF added Successfully!", pdfFormat);
                return res.status(201).json(successResponse);
            } else {
                let errorRespnse = genericResponse(false, "Something went wrong, Try again!", []);
                return res.status(200).json(errorRespnse);
            }
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchInvoicePdfFormat = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
        console.log("post", post);
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };

        const pdfFormat = await InvoicePdfFormat.find(query);
        console.log("pdfFormat", pdfFormat);
        let successResponse = genericResponse(true, "Invoice PDF data fetched successfully.", pdfFormat);

        return res.status(200).json(successResponse);

    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []))
    }
})

const deleteInvoicePdfFormat = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
        console.log("InvoicePdfFormat ID ==> ", post._id)
        const query = { _id: mongoose.Types.ObjectId(post._id) };
        if (post._id !== undefined && post._id !== '') {
            await InvoicePdfFormat.deleteOne(query);
            res.status(201).json(genericResponse(true, "InvoicePdfFormat is deleted successfully", []));
        }
        else
            res.status(400).json(genericResponse(false, "InvoicePdfFormat is not found", []));
    } catch (error) {
        console.log("Catch in deleteContact:", error);
        res.status(400).json(genericResponse(false, error.message, []));
    }
});

// const addInvoicePdfFormate = asyncHandler(async (req, res) => {
//     try {
//         const post = req.body;
//         console.log("post", post);
//         if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
//         post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//         post.recordType = "I";
//         const pdfFormat = await InvoicePdfFormat.create(post);
//         let successResponse = genericResponse(true, "Invoice PDF data added successfully.", pdfFormat);
//         return res.status(200).json(successResponse);

//     } catch (error) {
//         res.status(400).json(genericResponse(false, error.message, []))
//     }
// });

export { addInvoicePdfFormat, fetchInvoicePdfFormat, deleteInvoicePdfFormat }