
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import invoiceReminderLog from '../models/invoiceReminderLogModel.js';


const fetchInvoiceReminderLogs = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        console.log('(post)', post);
        if (post.signatureKey !== process.env.SIGNATURE_KEY) {
            return res.status(202).json(genericResponse(false, 'Invalid Signature Key!', []));
        }
        if (!post.businessUserID) {
            return res.status(202).json(genericResponse(false, 'Invalid businessUserID issue !', []));
        }

        const fetchUser = await invoiceReminderLog.aggregate([
            {
                $lookup: {
                    from: "invoices",
                    localField: "invoiceID",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $match: { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
                        }
                    ],
                    as: "invoices",
                }
            },
            {
                $unwind: {
                    path: "$invoices",
                    // preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "invoiceremindertemplates",
                    localField: "invoiceReminderID",
                    foreignField: "_id",
                    as: "invoiceremindertemplates",
                }
            },
            {
                $unwind: {
                    path: "$invoiceremindertemplates",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "contacts",
                    localField: "invoices.contactID",
                    foreignField: "_id",
                    as: "contacts",
                }
            },
            {
                $unwind: {
                    path: "$contacts",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    invoiceNumber: "$invoices.invoiceNumber",
                    invoiceDate0: "$invoices.invoiceDate",
                    invoiceDate: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                        date: "$invoices.invoiceDate" // Assuming this is your date field
                                    },
                                    in: {
                                        $concat: [
                                            {
                                                $arrayElemAt: ['$$monthsInString', { $subtract: [{ $month: "$$date" }, 1] }]
                                            },
                                            " ",
                                            {
                                                $concat: [
                                                    {
                                                        $substr: [{ $dayOfMonth: "$$date" }, 0, -1]
                                                    },
                                                    ", ",
                                                    {
                                                        $dateToString: {
                                                            format: "%Y",
                                                            date: "$$date"
                                                        }
                                                    },
                                                    " ",
                                                    // {
                                                    //     $cond: {
                                                    //         if: { $gte: [{ $hour: "$$date" }, 12] },
                                                    //         then: "PM",
                                                    //         else: "AM"
                                                    //     }
                                                    // }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    },
                    invoiceDate1: { $dateToString: { format: '%Y-%m-%d', date: '$invoices.invoiceDate' } },
                    finalAmount: "$invoices.finalAmount",
                    reminderTemplateName: "$invoiceremindertemplates.reminderTemplateName",
                    reminderType: "$invoiceremindertemplates.reminderType",
                    reminderDateTime: {
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                        date: "$reminderDateTime" // Assuming this is your date field
                                    },
                                    in: {
                                        $concat: [
                                            {
                                                $arrayElemAt: ['$$monthsInString', { $subtract: [{ $month: "$$date" }, 1] }]
                                            },
                                            " ",
                                            {
                                                $concat: [
                                                    {
                                                        $substr: [{ $dayOfMonth: "$$date" }, 0, -1]
                                                    },
                                                    ", ",
                                                    {
                                                        $dateToString: {
                                                            format: "%Y %H:%M:%S",
                                                            date: "$$date"
                                                        }
                                                    },
                                                    " ",
                                                    {
                                                        $cond: {
                                                            if: { $gte: [{ $hour: "$$date" }, 12] },
                                                            then: "PM",
                                                            else: "AM"
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    },
                    reminderDate: { $dateToString: { format: '%Y-%m-%d', date: '$reminderDateTime' } },
                    contactName: "$contacts.name",
                }
            },
        ]);

        if (fetchUser === null || fetchUser.length === 0) {
            // Log and return an error response
            console.log("No documents found matching the criteria.");
            let errorResponse = genericResponse(false, "No documents found matching the criteria.", []);
            return res.status(404).json(errorResponse);
        } else {
            console.log("fetchUser", fetchUser);
            let successResponse = genericResponse(true, "InvoiceReminderLogs fetched successfully.", fetchUser);
            res.status(200).json(successResponse);
        }

    } catch (error) {
        console.log("Error in fetchInvoiceReminderLogs:", error);
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});






export {
    fetchInvoiceReminderLogs
}