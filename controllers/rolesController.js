import asyncHandler from 'express-async-handler'
import Roles from '../models/rolesModel.js';
import Users from '../models/UsersModel.js';
import MenuOptions from '../models/menuOptionsModel.js';
import RoleRights from '../models/roleRightsModel.js';
import genericResponse from '../routes/genericWebResponses.js';
import { generateSearchParameterList } from '../routes/genericMethods.js';
import mongoose from 'mongoose';


const addRole = asyncHandler(async (req, res) => {
    try {
        const post = req.body;


        if (post.applicableForBusinessUser === "No") {
            post.planID = undefined;
            const checkIfRoleAlredyExist = await Roles.find({ roleName: post.roleName });
            if (checkIfRoleAlredyExist.length > 0) {
                let successResponse = genericResponse(false, "Role Already Exist.", []);
                res.status(201).json(successResponse);
                return;
            }
        }
        else if (post.applicableForBusinessUser === "Yes") {
            const checkIfRoleAlredyExist = await Roles.find({ roleName: post.roleName, planID: mongoose.Types.ObjectId(post.planID) });
            if (checkIfRoleAlredyExist.length > 0) {
                let successResponse = genericResponse(false, "Role Already Exist.", []);
                res.status(201).json(successResponse);
                return;
            }
        }

        if (post.applicableForBusinessUser === "Yes" && post.defaultPlanRole === "Yes") {

            const updateRoles = await Roles.updateMany(
                { planID: post.planID },
                {
                    $set: {
                        defaultPlanRole: "No", lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
                        recordType: 'U'
                    }
                });
        }
        else if (post.applicableForBusinessUser === "Yes" && post.defaultPlanRole === "No") {
            const checkIfAnyDefaultPlanRoleExist = await Roles.find({ defaultPlanRole: "Yes", planID: post.planID });

            if (!(checkIfAnyDefaultPlanRoleExist.length > 0)) {
                let successResponse = genericResponse(false, "At least one default Role should be set for selected plan.", []);
                res.status(201).json(successResponse);
                return;
            }
        }


        const addedRole = await new Roles(post).save();
        if (addedRole) {
            const query = { screenStatus: "Active" }
            let fetchAllSubMenus = await MenuOptions.find(query).select('menuName screenName _id');
            for (let i = 0; i < fetchAllSubMenus.length; i++) {
                let addroleRights = new RoleRights();
                addroleRights.roleId = addedRole._id;
                addroleRights.createdBy = addedRole.createdBy;
                addroleRights.menuOptionId = fetchAllSubMenus[i]._id
                // addroleRights.screenRight = 0;
                addroleRights.screenRight = "None";
                await addroleRights.save();
            }
        }
        let successResponse = genericResponse(true, "Role added successfully.", []);
        res.status(201).json(successResponse);
    } catch (error) {
        console.log("Catch in addRole:", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchRolesCount = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = {};
        if (post.searchParameter != undefined && post.searchParameter != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);
        const roles = await Roles.count();
        let successResponse = genericResponse(true, "Roles Count fetched successfully.", []);
        successResponse.RolesCount = roles;
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

// const fetchRoles = asyncHandler(async (req, res) => {
//     try {
//         const post = req.body;

//         var query = {};

//         var sort = {};
//         if (post.filterValues != undefined && post.filterValues != '')
//             query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);

//         let fetchQuery = [
//             {
//                 $lookup: {
//                     from: "subscription_plans",
//                     localField: "planID",
//                     foreignField: "_id",
//                     as: "businessUserPlans",
//                 }
//             },
//             {
//                 $project: {
//                     roleName: "$roleName",
//                     roleDescription: "$roleDescription",
//                     roleNameID: "$roleName",
//                     applicableForBusinessUser: "$applicableForBusinessUser",
//                     defaultPlanRole: "$defaultPlanRole",
//                     planName: "$businessUserPlans.planName"
//                 }
//             },
//             {
//                 $match: query
//             },
//         ];

//         if (post.sortingType && post.sortingField) {
//             var sortField = post.sortingField;
//             sort[sortField] = post.sortingType;

//             fetchQuery.push({ $sort: sort });
//         } else {
//             sort = { createdDate: -1 }
//         }
//         let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };


//         let myAggregation = Roles.aggregate()
//         myAggregation._pipeline = fetchQuery
//         Roles.aggregatePaginate(
//             myAggregation,
//             options,
//             (err, result) => {
//                 if (err) {
//                     const errorResponse = genericResponse(false, "Unable to fetch", []);
//                     res.status(400).json(errorResponse);

//                 } else {
//                     const successResponse = genericResponse(true, "Roles fetched successfully", result);
//                     res.status(200).json(successResponse);

//                 }
//             }
//         );

//     } catch (error) {
//         console.log("error in Roles  =", error);
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(400).json(errorRespnse);
//     }
// });

const updateRole = asyncHandler(async (req, res) => {
    try {
        const post = req.body;

        if (post.applicableForBusinessUser === "No") {
            post.planID = undefined;
            const checkIfRoleAlredyExist = await Roles.find({ roleName: post.roleName, _id: { $ne: mongoose.Types.ObjectId(post._id) } });
            if (checkIfRoleAlredyExist.length > 0) {
                let successResponse = genericResponse(false, "Role Already Exist.", []);
                res.status(201).json(successResponse);
                return;
            }
        }
        else if (post.applicableForBusinessUser === "Yes") {
            const checkIfRoleAlredyExist = await Roles.find({ roleName: post.roleName, planID: post.planID, _id: { $ne: mongoose.Types.ObjectId(post._id) } });
            if (checkIfRoleAlredyExist.length > 0) {
                let successResponse = genericResponse(false, "Role Already Exist.", []);
                res.status(201).json(successResponse);
                return;
            }
        }

        if (post.applicableForBusinessUser === "Yes" && post.defaultPlanRole === "No") {
            const checkIfAnyDefaultPlanRoleExist = await Roles.find({ defaultPlanRole: "Yes", planID: post.planID });
            if (!(checkIfAnyDefaultPlanRoleExist.length > 0)) {
                let successResponse = genericResponse(false, "At least one default Role should be set for selected plan.", []);
                res.status(201).json(successResponse);
                return;
            }
        }

        if (post.applicableForBusinessUser === "Yes" && post.defaultPlanRole === "Yes") {
            const updateRoles = await Roles.updateMany(
                { planID: post.planID },
                {
                    $set: {
                        defaultPlanRole: "No", lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
                        recordType: 'U'
                    }
                });
        }
        else if (post.applicableForBusinessUser === "Yes" && post.defaultPlanRole === "No") {
            const checkIfAnyDefaultPlanRoleExist = await Roles.find({ defaultPlanRole: "Yes", planID: post.planID });
            if (!(checkIfAnyDefaultPlanRoleExist.length > 0)) {
                let successResponse = genericResponse(false, "At least one default Role should be set for selected plan.", []);
                res.status(201).json(successResponse);
                return;
            }
        }

        const fetchRole = await Roles.find({ _id: post._id });
        const updateRole = fetchRole[0];
        if (updateRole) {
            updateRole.roleName = req.body.roleName || updateRole.name
            if (req.body.roleDescription)
                updateRole.roleDescription = req.body.roleDescription
            updateRole.recordType = 'U';
            updateRole.lastModifiedBy = req.body.lastModifiedBy;
            updateRole.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
            updateRole.applicableForBusinessUser = req.body.applicableForBusinessUser;
            updateRole.defaultPlanRole = req.body.defaultPlanRole;
            updateRole.planID = req.body.planID;
            // if (req.body.applicableForBusinessUser === "Yes") {
            //     var query = { _id: req.body._id };
            //     const updateRoles = await Roles.updateMany(query, {
            //         $set: {
            //             applicableForBusinessUser: "No", lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
            //             recordType: 'U'
            //         }
            //     });
            // }
            const updatedRole = await updateRole.save();
            let successResponse = genericResponse(true, "Role updated successfully.", []);
            res.status(200).json(successResponse);
        } else {
            let errorRespnse = genericResponse(false, "Role not found.", []);
            res.status(200).json(errorRespnse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const deleteRole = asyncHandler(async (req, res) => {
    try {
        if (req.body._id != undefined && req.body._id != '') {
            const fetchedRole = await Roles.find({ _id: req.body._id });
            const role = fetchedRole[0];
            if (role) {

                var query = { roleID: mongoose.Types.ObjectId(role._id) };
                console.log("query", query)
                const usersCount = await Users.find(query);

                console.log("usersCount", usersCount.length)

                if (usersCount.length === 0) {
                    const deleteRole = await role.remove();
                    if (deleteRole) {
                        await RoleRights.deleteMany({ _id: role._id });
                    }
                    let successResponse = genericResponse(true, "Role deleted successfully.", []);
                    res.status(200).json(successResponse);
                }
                else {
                    let errorRespnse = genericResponse(false, "Assigned Role can't be deleted", []);
                    res.status(200).json(errorRespnse);
                }
            } else {
                let errorRespnse = genericResponse(false, "Role not found.", []);
                res.status(200).json(errorRespnse);
            }
        }
        else {
            let errorRespnse = genericResponse(false, "Role not found.", []);
            res.status(200).json(errorRespnse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchRoleRights = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        const query = { roleId: mongoose.Types.ObjectId(post.roleId) }
        const roleRights = await RoleRights.aggregate([
            {
                $match: query
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roles"
                }
            },
            { $unwind: "$roles" },
            {
                $lookup: {
                    from: "menu_options",
                    localField: "menuOptionId",
                    foreignField: "_id",
                    as: "menus"
                }
            },
            { $unwind: "$menus" },
            {
                $project: {
                    roleName: "$roles.roleName", menuName: "$menus.menuName", screenRight: 1, screenName: "$menus.screenName",
                    menuSequence: "$menus.menuSequence", screenSequence: "$menus.screenSequence", userType: "$menus.userType",
                    applicableForBusinessUser: "$roles.applicableForBusinessUser",
                }
            }
        ]).sort({ menuSequence: 1, screenSequence: 1 });
        let successResponse = genericResponse(true, "Role Rights fetched successfully.", roleRights);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
})

const updateRoleRights = asyncHandler(async (req, res) => {
    try {

        console.log("bjkbdfsdf", req.body)

        let updateData = []
        updateData = req.body
        console.log("dsdnbjksda", updateData.length)

        // const data = await RoleRights.find()
        // for(let i = 0 ;i<data.length;i++){
        //     if(data[i].screenRight !== )
        // } 

        for (let i = 0; i < updateData.length; i++) {
            var query = { _id: updateData[i]._id }
            let newValues = { $set: { screenRight: updateData[i].screenRight } }
            await RoleRights.updateOne(query, newValues)
        }
        let successResponse = genericResponse(true, "RoleRight updated successfully.", []);
        res.status(200).json(successResponse);

        // const updateRoleRight = await RoleRights.findById(req.body._id);
        // if (updateRoleRight) {
        //     updateRoleRight.screenRight = req.body.screenRight;
        //     updateRoleRight.recordType = 'U';
        //     updateRoleRight.lastModifiedBy = req.body.lastModifiedBy;
        //     updateRoleRight.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        //     const updatedRoleRights = await updateRoleRight.save();
        //     let successResponse = genericResponse(true, "RoleRight updated successfully.", []);
        //     res.status(200).json(successResponse);
        // } else {
        //     let errorRespnse = genericResponse(false, "RoleRight not found.", []);
        //     res.status(200).json(errorRespnse);
        // }
    } catch (error) {
        console.log("Catch in updateRoleRights::", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchRoleById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        var role = await Roles.findById(query);
        role = role.toObject();
        role.inUse = false;

        // Checking weather Subscription Plan is in use or not
        const checkIfRoleIsUsed = await Users.find(
            { roleID: mongoose.Types.ObjectId(post._id) }
        );
        if (checkIfRoleIsUsed.length > 0)
            role.inUse = true;

        let successResponse = genericResponse(true, "Role fetched successfully.", role);
        res.status(201).json(successResponse);
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

// Mobile API ------------->


const fetchRoles = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        if (post.signatureKey !== process.env.SIGNATURE_KEY) {
            return res.status(401).json(genericResponse(false, 'Invalid Signature Key!', []));
        }
        const fetchPlan = await Roles.aggregate([

            {
                $project: {
                    roleName: 1,
                }
            }
        ]);

        let successResponse = genericResponse(true, "Data fetched successfully.", fetchPlan);
        res.status(200).json(successResponse);
    }
    catch (error) {
        let errorResponse = genericResponse(false, error.message, []);
        res.status(500).json(errorResponse);
    }
});


export {
    addRole,
    fetchRolesCount,

    updateRole,
    deleteRole,
    fetchRoleRights,
    updateRoleRights,
    fetchRoleById,

    // Mobile API ------------->
    fetchRoles,
}