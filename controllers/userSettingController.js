import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import Users from '../models/UsersModel.js';
import { encryptPassword, generatePassword, generateSearchParameterList, sendMail, sendMailBySendGrid } from '../routes/genericMethods.js';
import Roles from '../models/rolesModel.js';
import Templates from '../models/templatesModel.js';
import BusinessUserPlans from '../models/businessUserPlansModel.js';


const addUser = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (post.businessUserID != undefined || post.businessUserID != '') {
      var query = { emailAddress: post.emailAddress };
      const checkIfEmailAlredyExist = await Users.find(query);
      if (checkIfEmailAlredyExist.length > 0) {
        let successResponse = genericResponse(false, "Email Already Exist.", []);
        res.status(200).json(successResponse);
        return;
      }
      const password = await generatePassword();
      await encryptPassword(password).then(data => {
        post.userPassword = data;
      }).catch((error) => {
        console.log("Password encryption error:", error);
        return;
      });

      // post.userPassword = password;
      post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      post.recordType = "I";
      const newUser = new Users(post);

      const addUser = await newUser.save();

      let emailSubject = '';
      let emailBody = '';
      const templateQuery = { templateStatus: 'Active', templateName: 'NewBusinessUserEmailNotification' };
      const fetchedTemplates = await Templates.find(templateQuery);
      if (fetchedTemplates.length > 0) {
        let val = fetchedTemplates[0];
        val.templateSubject = val.templateSubject.replaceAll('[FirstName]', post.firstName);
        val.templateSubject = val.templateSubject.replaceAll('[LastName]', post.lastName);
        emailSubject = val.templateSubject;

        val.templateMessage = val.templateMessage.replaceAll('[FirstName]', post.firstName);
        val.templateMessage = val.templateMessage.replaceAll('[LastName]', post.lastName);
        val.templateMessage = val.templateMessage.replaceAll('[URL]', post.loginURL);
        val.templateMessage = val.templateMessage.replaceAll('[EmailAddress]', post.emailAddress);
        val.templateMessage = val.templateMessage.replaceAll('[Password]', password);
        emailBody = val.templateMessage;
        await sendMailBySendGrid(post.emailAddress, emailSubject, emailBody);

        let successResponse = genericResponse(true, "New User added successfully.", addUser);
        res.status(200).json(successResponse);
      }
      else {
        let successResponse = genericResponse(false, "Email Template Error.", []);
        res.status(200).json(successResponse);
      }
    }
    else {
      let errorResponse = genericResponse(false, "You are not Business User.", []);
      res.status(404).json(errorResponse);
    }
  } catch (error) {
    console.log("error in  addUser Controller =", error);
    let errorResponse = genericResponse(false, error.message, []);
    res.status(400).json(errorResponse);
  }
});

const fetchRoles = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    const fetchPlan = await BusinessUserPlans.find({ businessUserID: mongoose.Types.ObjectId(post.businessUserID) }).limit(1).sort({ _id: -1 });
    let bPlanID = fetchPlan[0].planID
    const fetchRoles = await Roles.find({ planID: mongoose.Types.ObjectId(bPlanID) });
    let successResponse = genericResponse(true, "Roles fetched successfully.", fetchRoles);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchRoles =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);

  }
});

const fetchUser = asyncHandler(async (req, res) => {
  try {
    const post = req.body;

    var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), userType: 'Business' };

    var sort = {};
    if (post.filterValues != undefined && post.filterValues != '')
      query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);

    let fetchQuery = [

      {
        $lookup: {
          from: "roles",
          localField: "roleID",
          foreignField: "_id",
          as: "roles"
        }
      },
      { $unwind: "$roles" },
      {
        $project: {
          fullNameString: { fullName: { $concat: ["$firstName", " ", "$lastName"] } },
          emailAddress: "$emailAddress",
          userStatus: "$userStatus",
          userType: "$userType",
          role: "$roles.roleName",
          businessUserID: "$businessUserID",
          userType: "$userType",
          profilePictureFileName: "$profilePictureFileName"
        }
      },
      { $match: query }
    ];

    if (post.sortingType && post.sortingField) {
      var sortField = post.sortingField;
      sort[sortField] = post.sortingType;

      fetchQuery.push({ $sort: sort });
    } else {
      sort = { createdDate: -1 }
    }
    let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
    if (post.userStatus !== "All") {
      query.userStatus = post.userStatus;
      fetchQuery.push({ $match: query });
    }

    let myAggregation = Users.aggregate()
    myAggregation._pipeline = fetchQuery
    Users.aggregatePaginate(
      myAggregation,
      options,
      (err, result) => {
        if (err) {
          const errorResponse = genericResponse(false, "Unable to fetch", []);
          res.status(400).json(errorResponse);

        } else {
          const successResponse = genericResponse(true, "My Users fetched successfully", result);
          res.status(200).json(successResponse);

        }
      }
    );

  } catch (error) {
    console.log("error in fetchUser  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchUserById = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post._id) }
    const fetchUserById = await Users.findById(query).select('-userPassword -mobileOTP -emailOTP');;
    let successResponse = genericResponse(true, "User fetched successfully.", fetchUserById);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchUserById  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateUser = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const emailQuery = {
      _id: { $ne: mongoose.Types.ObjectId(req.body._id) },
      emailAddress: { '$regex': '^' + req.body.emailAddress.trim() + '$', '$options': 'i' }
    };

    var query1 = { _id: mongoose.Types.ObjectId(req.body._id) }
    const fetchEmail = await Users.aggregate([
      { $match: query1 },
      { $unwind: "$businessUserPlans" },
      {
        $lookup: {
          from: "business_users",
          localField: "emailAddress",
          foreignField: "emailAddress",
          as: "businessUser",
        }
      },
      { $unwind: "$businessUser" }
    ])

    console.log("asdasdsad", fetchEmail)

    const checkIfEmailAlredyExist = await Users.find(emailQuery);
    if (checkIfEmailAlredyExist.length > 0) {
      let successResponse = genericResponse(false, "Email Address Already Exist!", []);
      res.status(201).json(successResponse);
      return;
    }

    const query = { _id: mongoose.Types.ObjectId(post._id) }
    post.recordType = "U";
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    let newValue = { $set: post };
    const updateUser = await Users.updateOne(query, newValue);
    let successResponse = genericResponse(true, " User updated successfully.", []);

    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in  updateUser Controller =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  try {
    if (req.body._id.length > 0) {
      const fetchedWarehouse = await Users.deleteMany({ _id: { $in: req.body._id } });
      let successResponse = genericResponse(true, "User deleted successfully.", []);
      res.status(200).json(successResponse);
    } else {
      let successResponse = genericResponse(false, "Please Select Atleast One Record!", []);
      res.status(200).json(successResponse);
    }
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});


export {
  addUser,
  fetchRoles,
  fetchUser,
  fetchUserById,
  updateUser,
  deleteUser
}