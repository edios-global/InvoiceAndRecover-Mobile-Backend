import expenses from '../models/expensesModel.js';
import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';



const fetchExpenseReportDetails = asyncHandler(async (req, res) => {
    try {
        const post = req.body
        console.log("post", post)
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
        let sort = {}

        let currentDate = new Date(new Date().setUTCHours(0, 0, 0, 0));
        let tomorrowDate = new Date(new Date().setUTCHours(0, 0, 0, 0));

        let activationsearchDate;

        if (post.expenseDuration !== "All") {
            if (post.expenseDuration === "Today") {
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                activationsearchDate = { $gte: new Date(currentDate), $lt: new Date(tomorrowDate) }
            }
            if (post.expenseDuration === "last 7 Days") {
                tomorrowDate.setDate(tomorrowDate.getDate() - 7);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
            if (post.expenseDuration === "last 30 Days") {
                tomorrowDate.setDate(tomorrowDate.getDate() - 30);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
            if (post.expenseDuration === "12 months") {
                tomorrowDate.setFullYear(tomorrowDate.getFullYear() - 1);
                activationsearchDate = { $gte: new Date(tomorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
            }
            if (post.expenseDuration === "custom date") {
                let fromDate = new Date(post.fromDate);
                let toDate = new Date(post.toDate);
                fromDate.setUTCHours(0, 0, 0, 0);
                toDate.setUTCHours(0, 0, 0, 0) + 1;
                toDate.setDate(toDate.getDate() + 1);
                console.log("qwert", fromDate, toDate)
                activationsearchDate = { $gte: fromDate, $lt: toDate }
            }
        }

        if (post.expenseDuration !== "" && post.expenseDuration !== undefined) {
            query.expenseDates = activationsearchDate
            console.log(" query.expenseDates (post)", query.expenseDates);

        }

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
                    expenseDate: { $dateToString: { format: '%Y-%m-%d', date: '$expenseDate' } },
                    expenseDates: "$expenseDate",
                    contactTypeId: "$contactTypeId",
                    categoryNameID: "$categoryNameID",
                    supplierName: "$contacts.name",
                    category: "$itemcatogories.categoryName",
                    totalAmount: "$totalAmount",
                    taxAmount: "$taxAmount",
                    tipAmount: "$tipAmount",
                    notes: "$notes",
                    businessUserID: "$businessUserID",
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

                }
            },
            { $match: query },
        ];

        if (post.sortingType && post.sortingField) {

            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;
            fetchQuery.push({ $sort: sort });
        } else {
            sort = { createdDate: -1 }
        }

        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
        let myAggregation = expenses.aggregate()
        myAggregation._pipeline = fetchQuery
        expenses.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch expenses", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "expenses fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

export {

    fetchExpenseReportDetails
}