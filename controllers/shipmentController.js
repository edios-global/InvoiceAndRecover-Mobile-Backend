import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import ConsignmentPickupCharges from '../models/consignmentPickupChargesModel.js';
import ShipmentCharge from '../models/shipmentChargesModel.js';
import CargoWeightCharges from '../models/cargoWeightCharges.js';
import Customer from '../models/customerBfmModel.js';
import { generateSearchParameterList } from '../routes/genericMethods.js';


// ----------shipment

const addshipmentCharges = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.recordType = "I";
        const addedData = await new ShipmentCharge(post).save();

        if (addedData._id !== null) {
            let successResponse = genericResponse(true, "ShipmentCharges added successfully.", addedData);
            res.status(201).json(successResponse);
            return;
        } else {
            let errorRespnse = genericResponse(false, error.message, []);
            res.status(201).json(errorRespnse);
            return;
        }
    }
    catch (error) {
        console.log("error in addshipmentCharges=", error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const updateShipmentCharges = asyncHandler(async (req, res) => {
    try {
        const payload = req.body;

        payload.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        payload.recordType = "U";

        const updatedData = await ShipmentCharge.updateOne({ _id: payload._id }, payload);
   
        if (updatedData.nModified > 0) {
            let successResponse = genericResponse(true, "ShipmentCharges updated successfully.", updatedData);
            res.status(200).json(successResponse);
        } else {
            let errorResponse = genericResponse(false, "ShipmentCharges not found.", []);
            res.status(404).json(errorResponse);
        }
    } catch (error) {
        console.log("error in updateShipmentCharges:", error.message);
        let errorResponse = genericResponse(false, error.message, []);
        res.status(400).json(errorResponse);
    }
});

const fetchShipmentCharges = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        const businessUserID = post.businessUserID;

        if (!businessUserID) {
            const errorResponse = genericResponse(false, "businessUserID can't be empty", []);
            res.status(200).json(errorResponse);
            return;
        }
            var query = { businessUserID:mongoose.Types.ObjectId(businessUserID)}; 
        const fetchCustomer = [
            {
                $match: query
            },
        
        ]
      
        const fetchData = await ShipmentCharge.aggregate(fetchCustomer)
        // console.log("fetchData",fetchData)
        let successResponse = genericResponse(true, "fetchShipmentCharges fetched successfully.",fetchData );
        res.status(200).json(successResponse);
        }
      
     catch (error) {
        console.log("error in fetchShipmentCharges =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});
 


const addWeightCharges = asyncHandler(async (req, res) => {
    const post = req.body;
    console.log("post",post)
    try {

      
            const mydata = parseInt(post.cwcFromDistance)
            console.log("mydata",mydata)
            let sum ;
            const latestDeliveryTime = await CargoWeightCharges.findOne({businessUserID:mongoose.Types.ObjectId(post.businessUserID)}).sort({ createdDate: -1 }).limit(1);
            // If no documents are present, set sum to 0
            console.log("latestDeliveryTime",latestDeliveryTime)
            const latestToDistance = latestDeliveryTime ? latestDeliveryTime.cwcToDistance : 0;
            console.log("latestToDistance",latestToDistance)
            // const latestToDistance = latestDeliveryTime.cwcToDistance;
            if(latestToDistance > 0){
                 sum = parseInt(latestToDistance) + 1;
            }
            
            console.log("sum",sum)
            if (mydata === sum || (mydata === 0 && latestDeliveryTime === null)) {
                post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                post.recordType = "I";
                const addedData = await new CargoWeightCharges(post).save();
                if (addedData._id !== null) {
                    let successResponse = genericResponse(true, "addWeightCharges added successfully.", []);
                    res.status(201).json(successResponse);
                    return;
                } else {
                    let errorRespnse = genericResponse(false, error.message, []);
                    res.status(200).json(errorRespnse);
                    return;
                }
            }else {
                let successResponse = genericResponse(false, "From Distance should be start from the last added To Distance with one increment If no record added then From Distance should be start from 0.", []);
                    res.status(202).json(successResponse);
                    return;
            }
        

       
    }
    catch (error) {
        console.log("error in addWeightCharges=", error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchWeightCharges = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
    var sort = {};
    if (post.filterValues != undefined && post.filterValues != '')
      query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);

        const fetchQuery = [
          
            {
                $project: {
                    cwcZoneName: "$cwcZoneName",
                    cwcFromDistance: "$cwcFromDistance",
                    cwcToDistance: "$cwcToDistance",
                    cwcCargoWeightCharges: "$cwcCargoWeightCharges",
                    businessUserID:"$businessUserID",
                },
            },
            {
                $match:query
            },
        ]

        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;
            fetchQuery.push({ $sort: sort });
          } else {
            sort = { toDistance: 1 }
          }
          let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
          let myAggregation = CargoWeightCharges.aggregate()
          myAggregation._pipeline = fetchQuery
          CargoWeightCharges.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
              if (err) {
                const errorResponse = genericResponse(false, "Unable to fetch", []);
                res.status(400).json(errorResponse);
      
              } else {
                const successResponse = genericResponse(true, "Customer fetched successfully", result);
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

const fetchWeightChargesById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
        const fetchData = await CargoWeightCharges.find(query);
        if (fetchData.length > 0) {
            let successResponse = genericResponse(true, "fetchWeightChargesById fetched successfully.", fetchData);
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

const updatefetchWeightCharges = asyncHandler(async (req, res) => {
    try {

        console.log("updatefetchWeightCharges (post)", req.body)

        const checkToDistanceAlredyExist = await CargoWeightCharges.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, cwcFromDistance: req.body.cwcFromDistance });
      
        if (checkToDistanceAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "From Distance Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkToDistanceAlreadyExist = await CargoWeightCharges.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, cwcToDistance: req.body.cwcToDistance });
     
        if (checkToDistanceAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "To Distance Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkToDistanceAlredyExist1 = await CargoWeightCharges.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, cwcFromDistance: req.body.cwcToDistance });

        if (checkToDistanceAlredyExist1.length > 0) {
            let successResponse = genericResponse(false, "To Distance is same as From Distance.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkToDistanceAlreadyExist1 = await CargoWeightCharges.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, cwcToDistance: req.body.cwcFromDistance });
        if (checkToDistanceAlreadyExist1.length > 0) {
            let successResponse = genericResponse(false, "From Distance is same as To Distance.", []);
            res.status(201).json(successResponse);
            return;
        }
        let fetchWeight = await CargoWeightCharges.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: mongoose.Types.ObjectId(req.body._id) });
        console.log("fetchWeight", fetchWeight, fetchWeight.length);

        if (fetchWeight && fetchWeight[0].cwcFromDistance == '0' && req.body.cwcFromDistance != "0") {
            let successResponse = genericResponse(false, "Cannot Change the From Distance value ", []);
            res.status(201).json(successResponse);
            return;
        } else {
            const post = req.body;
            post.recordType = 'U';
            post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            var newValues = { $set: post }
            const updateParameter = await CargoWeightCharges.updateOne({ _id: mongoose.Types.ObjectId(req.body._id) }, newValues);
            let successResponse = genericResponse(true, "update Cargo Weight Charges  updated successfully.", []);
            res.status(200).json(successResponse);
            return;
        }
    } catch (error) {
        console.log("error", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const deleteCargoWeight = asyncHandler(async (req, res) => {

    try {
        const post = req.body;
        console.log("deleteCargoWeight(post)", post);

        if (post._id !== undefined && post._id !== '') {

            const latestCargoWeight = await CargoWeightCharges.findOne({
                businessUserID: mongoose.Types.ObjectId(post.businessUserID)
            }).sort({ createdDate: -1 });


            if (post._id == latestCargoWeight._id) {
                console.log("latestCargoWeightID === newID",);
                await latestCargoWeight.remove();
                let successResponse = genericResponse(true, "Cargo Weight deleted successfully", []);
                res.status(202).json(successResponse);
                return;
            } else {
                let successResponse = genericResponse(false, "Cargo Weight cannot be deleted as it is not a last Record", []);
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



const addConsignmentPickupCharges = asyncHandler(async (req, res) => {
    const post = req.body;
    console.log("post", post);

    try {
     
            const mydata = parseInt(post.cpcFromDistance);
            console.log("mydata", mydata);
            let sum ;
            // Get the latest document
            const latestDeliveryTime = await ConsignmentPickupCharges.findOne({businessUserID:mongoose.Types.ObjectId(post.businessUserID)}).sort({ createdDate: -1 }).limit(1);
            // console.log("latestDeliveryTime", latestDeliveryTime);
            // If no documents are present, set sum to 0
            const latestToDistance = latestDeliveryTime ? latestDeliveryTime.cpcToDistance : 0;

            if(latestToDistance > 0){
                sum = parseInt(latestToDistance) + 1;
           }
            // console.log("latestToDistance", latestToDistance);
         
            console.log("sum", sum);
            if (mydata === sum || (mydata === 0 && latestDeliveryTime === null)) {
              
                post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                post.recordType = "I";
                const addedData = await new ConsignmentPickupCharges(post).save();
    
                if (addedData._id !== null) {
                    let successResponse = genericResponse(true, "addConsignmentPickupCharges added successfully.", []);
                    res.status(201).json(successResponse);
                } else {
                    let errorRespnse = genericResponse(false, error.message, []);
                    res.status(200).json(errorRespnse);
                }
            } else {
                let successResponse = genericResponse(false, "From Distance should start from the last added To Distance with one increment If no record added then From Distance should be start from 0.", []);
                res.status(202).json(successResponse);
            }

    

        
    } catch (error) {
        console.log("error in addConsignmentPickupCharges=", error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});


const addConsignmentPickupCharges2 = asyncHandler(async (req, res) => {
    const post = req.body;
    console.log("post", post);

    try {
        const mydata = parseInt(post.cpcFromDistance);

        // Get the latest document
        const latestDeliveryTime = await ConsignmentPickupCharges.findOne().sort({ createdDate: -1 }).limit(1);

        // If no documents are present, set sum to 0
        const latestToDistance = latestDeliveryTime ? latestDeliveryTime.cpcToDistance : 0;
        const sum = parseInt(latestToDistance) + 1;

        if (mydata === sum ) {
            post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            post.recordType = "I";
            const addedData = await new ConsignmentPickupCharges(post).save();

            if (addedData._id !== null) {
                let successResponse = genericResponse(true, "addConsignmentPickupCharges added successfully.", []);
                res.status(201).json(successResponse);
                return;
            } else {
                let errorRespnse = genericResponse(false, error.message, []);
                res.status(200).json(errorRespnse);
                return;
            }
        } else {
            let successResponse = genericResponse(false, "From Distance should start from the last added To Distance with one increment", []);
            res.status(202).json(successResponse);
            return;
        }
    } catch (error) {
        console.log("error in addConsignmentPickupCharges=", error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});


const fetchPickupCharges = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
    var sort = {};
    if (post.filterValues != undefined && post.filterValues != '')
      query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
        const fetchQuery = [
            {
                $project: {
                    cpcZoneName: "$cpcZoneName",
                    cpcFromDistance: "$cpcFromDistance",
                    cpcToDistance: "$cpcToDistance",
                    cpcPickupCharges: "$cpcPickupCharges",
                    businessUserID:"$businessUserID"
                },
            },
            {$match: query},
        ]

        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;
            fetchQuery.push({ $sort: sort });
          } else {
            sort = { toDistance: 1 }
          }
          let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
          let myAggregation = ConsignmentPickupCharges.aggregate()
          myAggregation._pipeline = fetchQuery
          ConsignmentPickupCharges.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
              if (err) {
                const errorResponse = genericResponse(false, "Unable to fetch", []);
                res.status(400).json(errorResponse);
      
              } else {
                const successResponse = genericResponse(true, "Customer fetched successfully", result);
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

const fetchPickupChargesById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
        const fetchData = await ConsignmentPickupCharges.find(query);
        if (fetchData.length > 0) {
            let successResponse = genericResponse(true, "fetchPickupChargesById fetched successfully.", fetchData);
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

const updatefetchPickupCharges = asyncHandler(async (req, res) => {
    try {
        console.log("updatefetchPickupCharges(post)", req.body)

        const checkToDistanceAlredyExist = await ConsignmentPickupCharges.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, cpcFromDistance: req.body.cpcFromDistance });
        if (checkToDistanceAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "From Distance Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkToDistanceAlreadyExist = await ConsignmentPickupCharges.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, cpcToDistance: req.body.cpcToDistance });
        if (checkToDistanceAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "To Distance Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkToDistanceAlredyExist1 = await ConsignmentPickupCharges.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, cpcFromDistance: req.body.cpcToDistance });
        if (checkToDistanceAlredyExist1.length > 0) {
            let successResponse = genericResponse(false, "To Distance is same as From Distance.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkToDistanceAlreadyExist1 = await ConsignmentPickupCharges.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: { $ne: mongoose.Types.ObjectId(req.body._id) }, cpcToDistance: req.body.cpcFromDistance });
        if (checkToDistanceAlreadyExist1.length > 0) {
            let successResponse = genericResponse(false, "From Distance is same as To Distance.", []);
            res.status(201).json(successResponse);
            return;
        }
        let fetchPickup = await ConsignmentPickupCharges.find({ businessUserID: mongoose.Types.ObjectId(req.body.businessUserID), _id: mongoose.Types.ObjectId(req.body._id) });
        console.log("fetchPickup", fetchPickup, fetchPickup.length);

        if (fetchPickup && fetchPickup[0].cpcFromDistance == '0' && req.body.cpcFromDistance != "0") {
            let successResponse = genericResponse(false, "Cannot Change the From Distance value ", []);
            res.status(201).json(successResponse);
            return;
        } else {
            const post = req.body;
            post.recordType = 'U';
            post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            var newValues = { $set: post }
            const updateParameter = await ConsignmentPickupCharges.updateOne({ _id: mongoose.Types.ObjectId(req.body._id) }, newValues);
            let successResponse = genericResponse(true, "updatePickupCharges updated successfully.", []);
            res.status(200).json(successResponse);
            return;
        }


    } catch (error) {
        console.log("error", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

// const updatefetchPickupCharges = asyncHandler(async (req, res) => {
//     try {
//         // const checkToDistanceAlredyExist = await CargoWeightCharges.find({ id: { $ne: mongoose.Types.ObjectId(req.body._id) }, cwcFromDistance: req.body.cwcFromDistance });
//         // if (checkToDistanceAlredyExist.length > 0) {
//         //     let successResponse = genericResponse(false, "From Distance Already Exist.", []);
//         //     res.status(201).json(successResponse);
//         //     return;
//         // }
//         // const checkToDistanceAlreadyExist = await CargoWeightCharges.find({ id: { $ne: mongoose.Types.ObjectId(req.body._id) }, cwcToDistance: req.body.cwcToDistance });
//         // if (checkToDistanceAlreadyExist.length > 0) {
//         //     let successResponse = genericResponse(false, "To Distance Already Exist.", []);
//         //     res.status(201).json(successResponse);
//         //     return;
//         // }
//         const post = req.body;
//         post.recordType = 'U';
//         post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//         var newValues = { $set: post }
//         const updateParameter = await ConsignmentPickupCharges.updateOne({ _id: mongoose.Types.ObjectId(req.body._id) }, newValues);
//         let successResponse = genericResponse(true, "updatefetchPickupCharges  updated successfully.", []);
//         res.status(200).json(successResponse);

//     } catch (error) {
//         console.log("error", error.message)
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(400).json(errorRespnse);
//     }
// });

const deleteCargoPickup = asyncHandler(async (req, res) => {

    try {
        const post = req.body;
        console.log("deleteCargoPickup(post)", post);

        if (post._id !== undefined && post._id !== '') {

            const latestCargoPickup = await ConsignmentPickupCharges.findOne({
                businessUserID: mongoose.Types.ObjectId(post.businessUserID)
            }).sort({ createdDate: -1 });
            console.log("latestCargoPickup", latestCargoPickup);
            if (post._id == latestCargoPickup._id) {
                console.log("latestCargoPickup._id === newID",);
                await latestCargoPickup.remove();
                let successResponse = genericResponse(true, "Consignment Pickup deleted successfully", []);
                res.status(202).json(successResponse);
                return;
            } else {
  
                let successResponse = genericResponse(false, "Consignment Pickup  cannot be deleted as it is not a last Record", []);
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


export {
    addConsignmentPickupCharges,
    addshipmentCharges,
    addWeightCharges,
    fetchShipmentCharges,
    updateShipmentCharges,
    fetchWeightCharges,
    fetchPickupCharges,
    deleteCargoWeight,
    fetchWeightChargesById,
    updatefetchWeightCharges,
    fetchPickupChargesById,
    updatefetchPickupCharges,
    deleteCargoPickup

  
}