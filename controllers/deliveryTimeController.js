import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import { generateSearchParameterList } from '../routes/genericMethods.js';
import DeliveryTime from '../models/deliveryTimeModel.js';



const addDeliveryTime = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        console.log("post",post)
        let sum ;
        const mydata = parseInt(post.fromDistance)
        const latestDeliveryTime = await DeliveryTime.findOne({businessUserID:mongoose.Types.ObjectId(post.businessUserID)}).sort({ createdDate: -1 }).limit(1);
        // const latestToDistance = latestDeliveryTime.toDistance;
        const latestToDistance = latestDeliveryTime ? latestDeliveryTime.toDistance : 0;
        if(latestToDistance > 0){
            sum = parseInt(latestToDistance) + 1;
        }
        if (mydata === sum || (mydata === 0 && latestDeliveryTime === null)) {
            post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            post.recordType = "I";
            const addedDelivery = await new DeliveryTime(post).save();
            if (addedDelivery._id !== null) {
                let successResponse = genericResponse(true, "DeliveryTime added successfully.", []);
                res.status(201).json(successResponse);
                return;
            } else {
                let errorRespnse = genericResponse(false, error.message, []);
                res.status(200).json(errorRespnse);
                return;
            }
        } else {
            let successResponse = genericResponse(false, "From Distance should be start from the last added To Distance with one increment If no record added then From Distance should be start from 0.", []);
            res.status(202).json(successResponse);
            return;
        }


        
    } catch (error) {
        console.log(error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchDeliveryTime = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var mysort = { toDistance: 1 };
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
        if (post.filterValues != undefined && post.filterValues != '')
          query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
    
        const fetchQuery = [
          
            {
                $project: {
                    toDistance: "$toDistance",
                    fromDistance: "$fromDistance",
                    deliveryTime: "$deliveryTime",
                    businessUserID:"$businessUserID"
                },
            },
            {
                $match: query
            },
        ]
        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: mysort };
        let myAggregation = DeliveryTime.aggregate()
    myAggregation._pipeline = fetchQuery
    DeliveryTime.aggregatePaginate(
      myAggregation,
      options,
      (err, result) => {
        if (err) {
          const errorResponse = genericResponse(false, "Unable to fetch", []);
          res.status(400).json(errorResponse);

        } else {
            console.log("yyyg", result)
          const successResponse = genericResponse(true, "Delivery Time fetched successfully", result);
          res.status(200).json(successResponse);

        }
      }
    );

    
    } catch (error) {
        console.log("error in fetch DeliveryTime=", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});

const fetchDeliveryTimeById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID)  };
        const fetchData = await DeliveryTime.find(query).sort({createdDate:1});
        console.log("adasdsa" , fetchData)
        if (fetchData.length > 0) {
            let successResponse = genericResponse(true, "fetchDeliveryTimeById fetched successfully.", fetchData);
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

const updateDeliveryTime = asyncHandler(async (req, res) => {
    try {

        console.log("updateDeliveryTime(post)", req.body);


        const checkToDistanceAlredyExist = await DeliveryTime.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, fromDistance: req.body.fromDistance });
        console.log("checkToDistanceAlredyExist", checkToDistanceAlredyExist);
        if (checkToDistanceAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "From Distance Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }

        const checkToDistanceAlreadyExist = await DeliveryTime.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, toDistance: req.body.toDistance });
        if (checkToDistanceAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "To Distance Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }

        const checkToDistanceAlredyExist1 = await DeliveryTime.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, fromDistance: req.body.toDistance });
        console.log("checkToDistanceAlredyExist1", checkToDistanceAlredyExist1);
        if (checkToDistanceAlredyExist1.length > 0) {
            let successResponse = genericResponse(false, "To Distance is same as From Distance.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkToDistanceAlreadyExist1 = await DeliveryTime.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, toDistance: req.body.fromDistance });
        if (checkToDistanceAlreadyExist1.length > 0) {
            let successResponse = genericResponse(false, "From Distance is same as To Distance.", []);
            res.status(201).json(successResponse);
            return;
        }

        let fetchDelivery = await DeliveryTime.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: mongoose.Types.ObjectId(req.body._id) });
        console.log("fetchDelivery", fetchDelivery, fetchDelivery.length);

        if (fetchDelivery && fetchDelivery[0].fromDistance == '0' && req.body.fromDistance != "0") {
            let successResponse = genericResponse(false, "Cannot Change the From Distance value", []);
            res.status(201).json(successResponse);
            return;
        } else {
            const post = req.body;
            post.recordType = 'U';
            post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            var newValues = { $set: post }
            const updateParameter = await DeliveryTime.updateOne({ _id: mongoose.Types.ObjectId(req.body._id) }, newValues);
            let successResponse = genericResponse(true, "updateDeliveryTime  updated successfully.", []);
            res.status(200).json(successResponse);
        }


    } catch (error) {
        console.log("error", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const deleteDeliveryTime = asyncHandler(async (req, res) => {

    try {
        const post = req.body;
        console.log("deleteCargoPickup(post)", post);

        if (post._id !== undefined && post._id !== '') {

            const latestDeliveryTime = await DeliveryTime.findOne({
                businessUserID: mongoose.Types.ObjectId(post.businessUserID)
            }).sort({ createdDate: -1 });

            if (post._id == latestDeliveryTime._id) {
                await latestDeliveryTime.remove();
                let successResponse = genericResponse(true, "Delivery Time deleted successfully", []);
                res.status(202).json(successResponse);
                return;
            } else {
                let successResponse = genericResponse(false, "Delivery Time cannot be deleted as it is not a last Record.", []);
                res.status(202).json(successResponse);
                return;
            }
        } else {
            res.status(400).json(genericResponse(false, 'Invalid _id', []));
        }
    } catch (error) {
        res.status(400).json(genericResponse(false, error.message, []));
    }
});

// const deleteDeliveryTime = asyncHandler(async (req, res) => {
//     const post = req.body;
//     try {
//         const query = { _id: mongoose.Types.ObjectId(post._id) }
//         if (post._id != undefined && post._id != '') {
//             await DeliveryTime.deleteOne(query);
//             res.status(201).json(genericResponse(true, 'deleteDeliveryTime deleted sucessfully', []))
//         }
//         else
//             res.status(400).json(genericResponse(false, 'deleteDeliveryTime is  not found', []))
//     } catch (error) {
//         res.status(400).json(genericResponse(false, error.message, []))
//     }
// });







export {
    addDeliveryTime,
    fetchDeliveryTime,
    fetchDeliveryTimeById,
    updateDeliveryTime,
    deleteDeliveryTime,

}