import asyncHandler from "express-async-handler";
import genericResponse from "../routes/genericWebResponses.js";
import mongoose from "mongoose";
import Contacts from "../models/contactModel.js";
import { generateSearchParameterList } from "../routes/genericMethods.js";


const fetchContactReportDetails = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log("cf", post);
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
        var sort = {};
        // if (post.filterValues != undefined && post.filterValues != '') {
        //     query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
        // }
        let searchContact;

        if (post.contactType !== "All") {
            if (post.contactType === "Customer") {
                searchContact = "Customer"
            }
            if (post.contactType === "Supplier") {
                searchContact = "Supplier"
            }

        } else {
            delete post.contactType
        }

        if (post.contactType !== "" && post.contactType !== undefined) {
            query.contactType = searchContact
            console.log("query.contactType", query.contactType);
        }

        let fetchQuery = [
            {
                $match: query
            },
            {
                $project: {
                    contactName: "$name",
                    contactType: "$contactType",
                    emailAddress: "$emailAddress",
                    address: "$streetAddress",
                    companyName: "$companyName",
                    accountNumber: "$companyAccountNo",
                    contactNumber: "$phoneNumber",
                    abnNumber: "$abnNumber",
                    contactStatus: "$contactStatus"
                }
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


        let myAggregation = Contacts.aggregate()
        myAggregation._pipeline = fetchQuery
        Contacts.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch Contacts", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "Contacts fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );
    } catch (error) {
        console.log("Error in fetchContactReportDetails:", error.message);
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const fetchExpenseReportDetails = asyncHandler(async (req, res) => {
    try {
        const post = req.body
        console.log("post", post)
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
        let sort = {}


        let fetchQuery = [

            {
                $project: {
                    contactName: "$name",
                    contactType: "$contactType",
                    emailAddress: "$emailAddress",
                    address: "$streetAddress",
                    companyName: "$companyName",
                    accountNumber: "$companyAccountNo",
                    contactNumber: "$phoneNumber",
                    abnNumber: "$abnNumber",
                    contactStatus: "$contactStatus"
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
        let myAggregation = Contacts.aggregate()
        myAggregation._pipeline = fetchQuery
        Contacts.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch Contacts", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "Contacts fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

export default fetchContactReportDetails;