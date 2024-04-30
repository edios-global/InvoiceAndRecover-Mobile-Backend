import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose';
import genericResponse from '../routes/genericWebResponses.js';
import { generateSearchParameterList, sendMailBySendGrid, } from '../routes/genericMethods.js';
import BusinessUsers from '../models/businessUsersModel.js';
import businessLocation from '../models/businessLocationModel.js';
import Users from '../models/UsersModel.js';
import RoleRights from '../models/roleRightsModel.js';
import Roles from '../models/rolesModel.js';
import SubscriptionTransactionsModel from '../models/subscriptionTransactionsModel.js';
import BusinessUserPlans from '../models/businessUserPlansModel.js';
import InvoicePaymentsModel from '../models/invoicePaymentsModel.js';
import Templates from '../models/templatesModel.js';
import PlanFeatures from '../models/planFeaturesModel.js';
import BusinessUserPlanFeatureSlabs from '../models/businessUserPlanFeaturesSlabModel.js';
import BusinessUserPlanFeatures from '../models/businessUserPlanFeaturesModel.js';
import Employee from '../models/employeeBfmModel.js';

const fetchClients = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    // var query = { businessUserStatus: post.businessUserStatus };
    var query = {};
    var sort = {};
    if (post.filterValues != undefined && post.filterValues != '')
      query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);

    let fetchQuery = [
      {
        $lookup: {
          from: "business_user_plans",
          localField: "_id",
          foreignField: "businessUserID",
          as: "businessUserPlans",
          pipeline: [
            {
              $sort: { _id: -1 }
            },
            {
              $limit: 1
            }
          ]
        }
      },
      { $unwind: "$businessUserPlans" },
      {
        $lookup: {
          from: "subscription_plans",
          localField: "businessUserPlans.planID",
          foreignField: "_id",
          as: "subscriptionPlans",
        }
      },
      { $unwind: "$subscriptionPlans" },
      {
        $project: {
          companyName: 1, phoneNumber: 1, emailAddress: 1, companyStreetAddress: 1, companyCity: 1, companyZipCode: 1,
          planName: "$subscriptionPlans.planName",
          planActivationDate: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planActivationDate' } },
          planExpiryDate: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planExpiryDate' } },
          companyNameWithID: { companyName: "$companyName", businessUserID: "$_id" }, businessUserStatus: 1, cancellationType: 1,
          planCancellationEffectiveDateString: { $dateToString: { format: '%Y-%m-%d', date: '$planCancellationEffectiveDate' } },
          planCancellationEffectiveDate: 1,
          cancellationTypeWithID: {
            cancellationType: "$cancellationType", businessUserID: "$_id", planName: "$subscriptionPlans.planName",
            trialUser: "$trialUser"
          },

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
    if (post.businessUserStatus !== "All") {
      query.businessUserStatus = post.businessUserStatus;
    }
    let myAggregation = BusinessUsers.aggregate()
    myAggregation._pipeline = fetchQuery
    BusinessUsers.aggregatePaginate(
      myAggregation,
      options,
      (err, result) => {
        if (err) {
          const errorResponse = genericResponse(false, "Unable to fetch", []);
          res.status(400).json(errorResponse);

        } else {
          const successResponse = genericResponse(true, "Business Users fetched successfully", result);
          res.status(200).json(successResponse);

        }
      }
    );


  } catch (error) {
    console.log("Cathc in fetchClients: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }

}
);


const fetchSelectedClients = asyncHandler(async (req, res) => {

  try {
    const post = req.body;
    console.log("bsgdh", post)
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) }
    const fetchBusinessReviewLink = await BusinessUsers.aggregate([
      { $match: query },

      {
        $lookup: {
          from: "country_states",
          localField: "companyStateId",
          foreignField: "_id",
          as: "states",
        }
      },
      { $unwind: "$states" },
      {
        $lookup: {
          from: "countries",
          localField: "companyCountryId",
          foreignField: "_id",
          as: "country"
        }
      },
      { $unwind: "$country" },

      {
        $group: {
          _id: {
            companyName: '$companyName',
            phoneNumber: '$phoneNumber',
            emailAddress: '$emailAddress',
            companyCountry: "$companyCountryId",
            companyWebsite: '$companyWebsite',
            companyStreetAddress: '$companyStreetAddress',
            companyCity: '$companyCity',
            companyZipCode: '$companyZipCode',
            streetWithCity: "$streetWithCity",
            companyState: '$companyStateId',
            // planName: "$subscriptionPlans.planName",
          }
        }
      },
      {
        $project: {
          _id: 0,
          companyName: '$_id.companyName',
          phoneNumber: '$_id.phoneNumber',
          emailAddress: '$_id.emailAddress',
          companyCountry: "$_id.companyCountry",
          companyWebsite: '$_id.companyWebsite',
          companyStreetAddress: '$_id.companyStreetAddress',
          companyCity: '$_id.companyCity',
          companyZipCode: '$_id.companyZipCode',
          streetWithCity: "$_id.streetWithCity",
          companyState: "$_id.companyState"
        }
      },
    ])
    let successResponse = genericResponse(true, "Business Location fetched successfully.", fetchBusinessReviewLink)
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchCountry  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});


const fetchBusinessLocationInfo = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
    const orderBy = { locationCity: 1, locationStreetAddress: 1 };
    const BLList = await businessLocation.aggregate([{ $match: query }]).skip(post.initialValue).limit(post.finalValue).sort(orderBy);
    // let successResponse = genericResponse(true, "Business Location fetched successfully.", BLCount);
    let successResponse = genericResponse(true, "Business Location fetched successfully.", {
      count: BLList.length,
      list: BLList
    });
    res.status(200).json(successResponse);

  } catch (error) {
    console.log("error in fetchCountry  =", error);
    res.status(400).json(genericResponse(false, error.message, []))
  }
});



const fetchClientUsers = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), userType: { $nin: ["Warehouse"] } }
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
        $match: query
      },
      {
        $project: {
          phoneNumber: 1, role: "$roles.roleName",
          firstName: 1, lastName: 1, emailAddress: 1, userStatus: 1, userType: 1,
        }
      },
    ];
    if (post.sortingType && post.sortingField) {
      var sortField = post.sortingField;
      sort[sortField] = post.sortingType;

      fetchQuery.push({ $sort: sort });
    } else {
      sort = { firstName: -1 }
    }
    let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
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
          const successResponse = genericResponse(true, "User fetched successfully", result);
          res.status(200).json(successResponse);

        }
      }
    );


  } catch (error) {
    console.log("Cathc in fetchClientUsers: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const getSesstionDataByUserID = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: post.userID };
    const users = await Users.find(query).select('-userPassword -createdDate -lastModifiedDate -createdBy -recordType -lastModifiedDate');

    if (users.length > 0) {
      const user = users[0];
      let defaultBusinessLocationID = await businessLocation.findOne({ businessUserID: user.businessUserID, defaultLocation: 'Yes' }, { _id: 1 });
      if (defaultBusinessLocationID)
        defaultBusinessLocationID = defaultBusinessLocationID._id;

      let fetchQuery = [
        {
          $match: { _id: user.businessUserID }
        },
        {
          $lookup: {
            from: "business_user_plans",
            localField: "_id",
            foreignField: "businessUserID",
            as: "businessUserPlans",
            pipeline: [
              {
                $sort: { _id: -1 }
              },
              {
                $limit: 1
              }
            ]
          }
        },
        { $unwind: "$businessUserPlans" },
        {
          $lookup: {
            from: "subscription_plans",
            localField: "businessUserPlans.planID",
            foreignField: "_id",
            as: "subscriptionPlans",
          }
        },
        { $unwind: "$subscriptionPlans" },
        {
          $lookup: {
            from: "business_user_plan_features",
            localField: "businessUserPlans._id",
            foreignField: "businessUserPlanID",
            as: "businessUserPlanFeatures",
          }
        },
        { $unwind: "$businessUserPlanFeatures" },
        {
          $lookup: {
            from: "plan_features",
            localField: "businessUserPlanFeatures.planFeatureID",
            foreignField: "_id",
            as: "planFeatures"
          }
        },
        { $unwind: "$planFeatures" },
        {
          $lookup: {
            from: "standard_features",
            localField: "planFeatures.featureID",
            foreignField: "_id",
            as: "standardFeatures"
          }
        },
        { $unwind: "$standardFeatures" },
        {
          $lookup: {
            from: "business_user_plan_feature_slabs",
            localField: "businessUserPlanFeatures._id",
            foreignField: "businessUserPlanFeatureID",
            as: "businessUserPlanFeatureSlabs"
          }
        },
        {
          $project: {
            companyName: 1, planName: "$subscriptionPlans.planName",
            planActivationDateString: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planActivationDate' } },
            planExpiryDateString: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planExpiryDate' } },
            planActivationDate: '$businessUserPlans.planActivationDate', planExpiryDate: '$businessUserPlans.planExpiryDate',
            featureCount: "$businessUserPlanFeatures.featureCount", featureName: "$standardFeatures.featureName",
            featureCode: "$standardFeatures.featureCode", businessUserEmailID: "$emailAddress",
            selectionBasedValue: "$businessUserPlanFeatures.selectionBasedValue",
            featureType: "$standardFeatures.featureType", featureSequence: "$standardFeatures.featureSequence",
            fromSlabValue: "$businessUserPlanFeatureSlabs.fromSlabValue", toSlabValue: "$businessUserPlanFeatureSlabs.toSlabValue",
            slabRate: "$businessUserPlanFeatureSlabs.slabRate", trialUser: 1, wizardStatusFlag: 1,
          }
        },
      ];
      let employee = []
      console.log("mklkk", users[0].userType)
      if (users[0].userType === "Warehouse") {
        let fetchQueryEmp = [
          { $match: { _id: mongoose.Types.ObjectId(users[0].employeeID) } },
          {
            $lookup: {
              from: "warehouses",
              localField: "employeeWarehouseLocation",
              foreignField: "_id",
              as: "warehouses"
            }
          },
          { $unwind: "$warehouses" },
          {
            $project: {
              contactPersonName: "$warehouses.contactPersonName",
              zipCode: "$warehouses.zipCode",
              city: "$warehouses.city",
              streetAddress: "$warehouses.streetAddress",
              warehouseName: "$warehouses.warehouseName",
              lastName: 1,
              firstName: 1,
              emailAddress: 1,
              employeeWarehouseLocation: 1
            }
          }
        ]
        const employe = await Employee.aggregate(fetchQueryEmp)
        employee.push(employe[0])
      }
      const planDetails = await BusinessUsers.aggregate(fetchQuery).sort({ featureSequence: 1 });
      let successResponse = genericResponse(true, "User logged in successfully.", user);
      const roleRights = await RoleRights.aggregate([
        {
          $match: { roleId: mongoose.Types.ObjectId(user.roleID) }
        },
        {
          $lookup: {
            from: "menu_options",
            localField: "menuOptionId",
            foreignField: "_id",
            as: "menuOption"
          }
        },
        { $unwind: "$menuOption" },
        {
          $project: {
            screenName: "$menuOption.screenName", menuName: "$menuOption.menuName", screenRight: "$screenRight"
          }
        }
      ]);

      const role = await Roles.findById({ _id: mongoose.Types.ObjectId(user.roleID) });

      successResponse.RoleRights = roleRights;
      successResponse.Role = role;
      successResponse.defaultBusinessLocationID = defaultBusinessLocationID;
      successResponse.employee = employee
      // successResponse.wizardStatusFlag = wizardStatusFlag;
      successResponse.wizardStatusFlag = planDetails.length > 0 ? planDetails[0].wizardStatusFlag : 0;
      successResponse.planDetails = planDetails;
      res.status(200).json(successResponse);
    }
    else {
      let successResponse = genericResponse(false, "User Not Found!", []);
      res.status(200).json(successResponse);
    }

  } catch (error) {
    console.log("error in getSesstionDataByUserID=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const fetchClientActDeactDetailsByID = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) };

    let fetchQuery = [
      {
        $match: query
      },
      {
        $lookup: {
          from: "business_user_plans",
          localField: "_id",
          foreignField: "businessUserID",
          as: "businessUserPlans",
          pipeline: [
            {
              $sort: { _id: -1 }
            },
            {
              $limit: 1
            }
          ]
        }
      },
      { $unwind: "$businessUserPlans" },
      {
        $lookup: {
          from: "subscription_plans",
          localField: "businessUserPlans.planID",
          foreignField: "_id",
          as: "subscriptionPlans",
        }
      },
      { $unwind: "$subscriptionPlans" },
      {
        $project: {
          planCancellationReqeustDate: 1, planCancellationEffectiveDate: 1, businessUserStatus: 1,
          planCancellationNotes: '',
          planExpiryDateString: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planExpiryDate' } },
          planExpiryDate: '$businessUserPlans.planExpiryDate', trialUser: 1, businessUserPlanID: '$businessUserPlans._id',
          planName: "$subscriptionPlans.planName", cancellationType: 1,
        }
      },
    ];

    const clientDetails = await BusinessUsers.aggregate(fetchQuery);
    // let successResponse = genericResponse(true, "Business Location fetched successfully.", BLCount);
    if (clientDetails.length > 0) {
      let successResponse = genericResponse(true, "Client Act/Deact Details fetched successfully.", clientDetails[0]);
      res.status(200).json(successResponse);
    }
    else {
      let successResponse = genericResponse(false, "Client Not Found!", []);
      res.status(200).json(successResponse);
    }
  } catch (error) {
    console.log("error in fetchClientActDeactDetailsByID  =", error);
    res.status(400).json(genericResponse(false, error.message, []))
  }
});

const deactivateClient = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) };
    const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var planExpiryDate = new Date(new Date(new Date() - (new Date().getTimezoneOffset() * 60000)).setUTCHours(23, 59, 59, 999));

    const newChanges = {};
    newChanges.planCancellationReqeustDate = currentDate;
    newChanges.planCancellationNotes = post.planCancellationNotes;
    newChanges.cancellationType = post.cancellationType;
    newChanges.planCancellationEffectiveDate = new Date(post.planCancellationEffectiveDate);
    if (post.cancellationType === "Immediate") {
      newChanges.businessUserStatus = "Inactive";
      newChanges.planCancellationEffectiveDate = currentDate;
    }
    newChanges.recordType = "U";
    newChanges.lastModifiedDate = currentDate;
    let newValue = { $set: newChanges };
    const updatedBusinessUser = await BusinessUsers.findOneAndUpdate(query, newValue);

    if (updatedBusinessUser) {
      const addSubscriptionTransactions = new SubscriptionTransactionsModel();
      addSubscriptionTransactions.transactionDateTime = currentDate;
      addSubscriptionTransactions.businessUserID = post.businessUserID;

      if (post.cancellationType === "Immediate") {
        addSubscriptionTransactions.transactionType = 'Client Deactivated Immediately';
        addSubscriptionTransactions.transactionStatus = 'Processed';
      }
      else if (post.cancellationType === "Expiry Date") {
        addSubscriptionTransactions.transactionType = 'Client Deactivated On Plan Expiry Date';
        addSubscriptionTransactions.transactionStatus = 'Pending';
      }

      addSubscriptionTransactions.transactionNotes = post.planCancellationNotes;
      addSubscriptionTransactions.createdDate = currentDate;
      const addedSubscriptionTransactions = await addSubscriptionTransactions.save();

      if (post.cancellationType === "Immediate") {
        const updateAllQuery = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
        let newValue = { $set: { userStatus: 'Inactive' } };
        const updatedUsers = await Users.updateMany(updateAllQuery, newValue);

        const templateQuery = { templateStatus: 'Active', templateName: 'BusinessUserImmediateDeactivationEmailNotification' };
        const fetchedTemplates = await Templates.find(templateQuery);
        if (fetchedTemplates.length > 0) {
          let emailSubject = '';
          let emailBody = '';
          let val = fetchedTemplates[0];
          val.templateSubject = val.templateSubject.replaceAll('[FirstName]', updatedBusinessUser.firstName);
          val.templateSubject = val.templateSubject.replaceAll('[LastName]', updatedBusinessUser.lastName);
          emailSubject = val.templateSubject;

          val.templateMessage = val.templateMessage.replaceAll('[FirstName]', updatedBusinessUser.firstName);
          val.templateMessage = val.templateMessage.replaceAll('[LastName]', updatedBusinessUser.lastName);
          emailBody = val.templateMessage;
          await sendMailBySendGrid(updatedBusinessUser.emailAddress, emailSubject, emailBody);
        }
      }
      else if (post.cancellationType === "Expiry Date") {
        const templateQuery = { templateStatus: 'Active', templateName: 'BusinessUserDeactivationOnExpiryDateEmailNotification' };
        const fetchedTemplates = await Templates.find(templateQuery);
        if (fetchedTemplates.length > 0) {
          let emailSubject = '';
          let emailBody = '';
          let val = fetchedTemplates[0];
          val.templateSubject = val.templateSubject.replaceAll('[FirstName]', updatedBusinessUser.firstName);
          val.templateSubject = val.templateSubject.replaceAll('[LastName]', updatedBusinessUser.lastName);
          emailSubject = val.templateSubject;

          val.templateMessage = val.templateMessage.replaceAll('[FirstName]', updatedBusinessUser.firstName);
          val.templateMessage = val.templateMessage.replaceAll('[LastName]', updatedBusinessUser.lastName);
          val.templateMessage = val.templateMessage.replaceAll('[PlanExpiryDate]', post.planCancellationEffectiveDateString);
          emailBody = val.templateMessage;
          await sendMailBySendGrid(updatedBusinessUser.emailAddress, emailSubject, emailBody);
        }
      }

      let successResponse = genericResponse(true, "Client Status Changed Successfully.", []);
      res.status(200).json(successResponse);
    }
    else {
      console.log("error in cancelSubscription=", error);
      let errorRespnse = genericResponse(false, error.message, []);
      res.status(400).json(errorRespnse);
    }

  } catch (error) {
    console.log("Catch in cancelSubscription=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const activateClient = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    // console.log(post);
    // return;
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) };
    const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var planExpiryDate = new Date(new Date(new Date() - (new Date().getTimezoneOffset() * 60000)).setUTCHours(23, 59, 59, 999));

    const newChanges = {};
    newChanges.planCancellationReqeustDate = undefined;
    newChanges.planCancellationNotes = undefined;
    newChanges.cancellationType = undefined;
    newChanges.planCancellationEffectiveDate = undefined;
    newChanges.businessUserStatus = "Active";
    newChanges.recordType = "U";
    newChanges.lastModifiedDate = currentDate;
    let newValue = { $set: newChanges };
    const updatedBusinessUser = await BusinessUsers.findOneAndUpdate(query, newValue);

    const userQuery = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), emailAddress: updatedBusinessUser.emailAddress };
    const userNewChanges = {};
    userNewChanges.userStatus = "Active";
    userNewChanges.recordType = "U";
    userNewChanges.lastModifiedDate = currentDate;
    let userNewValue = { $set: userNewChanges };
    const updatedUser = await Users.findOneAndUpdate(userQuery, userNewValue);

    if (updatedBusinessUser) {
      if (post.trialUser) {
        const planQuery = { _id: mongoose.Types.ObjectId(post.businessUserPlanID) };
        const plantNewChanges = {};
        plantNewChanges.planActivationDate = currentDate;
        plantNewChanges.planExpiryDate = new Date(planExpiryDate.setDate(planExpiryDate.getDate() + 14));
        plantNewChanges.cancellationType = undefined;
        plantNewChanges.recordType = "U";
        plantNewChanges.lastModifiedDate = currentDate;
        let planNewValue = { $set: plantNewChanges };
        const updatedBusinessUserPlan = await BusinessUserPlans.findOneAndUpdate(planQuery, planNewValue);
      }

      const addSubscriptionTransactions = new SubscriptionTransactionsModel();
      addSubscriptionTransactions.transactionDateTime = currentDate;
      addSubscriptionTransactions.businessUserID = post.businessUserID;
      addSubscriptionTransactions.transactionType = 'Client Activated Immediately';
      addSubscriptionTransactions.transactionStatus = 'Processed';
      addSubscriptionTransactions.transactionNotes = post.planCancellationNotes;
      addSubscriptionTransactions.createdDate = currentDate;
      const addedSubscriptionTransactions = await addSubscriptionTransactions.save();

      if (post.cancellationType === "Immediate") {
        const templateQuery = { templateStatus: 'Active', templateName: 'BusinessUserImmediateActivationEmailNotification' };
        const fetchedTemplates = await Templates.find(templateQuery);
        if (fetchedTemplates.length > 0) {
          let emailSubject = '';
          let emailBody = '';
          let val = fetchedTemplates[0];
          val.templateSubject = val.templateSubject.replaceAll('[FirstName]', updatedBusinessUser.firstName);
          val.templateSubject = val.templateSubject.replaceAll('[LastName]', updatedBusinessUser.lastName);
          emailSubject = val.templateSubject;

          val.templateMessage = val.templateMessage.replaceAll('[FirstName]', updatedBusinessUser.firstName);
          val.templateMessage = val.templateMessage.replaceAll('[LastName]', updatedBusinessUser.lastName);
          emailBody = val.templateMessage;
          await sendMailBySendGrid(updatedBusinessUser.emailAddress, emailSubject, emailBody);
        }
      }
      // else if (post.cancellationType === "Expiry Date") {
      //   const emailTemplate =
      //     '<p>Hi ' + updatedBusinessUser.firstName + ' ' + updatedBusinessUser.lastName + ',' +
      //     '<br/><br/>We have received your account deactivation request. Your account will be deactivated on ' + post.planCancellationEffectiveDate + '.' +
      //     '<br/><br/> Please contact to ReviewArm administrator if your have not requested to deactivate the account.' +
      //     '<br/><br/>Sincerely,' +
      //     '<br/><br/>Team ReviewArm' +
      //     '</p>';

      // }

      let successResponse = genericResponse(true, "Client Status Changed Successfully.", []);
      res.status(200).json(successResponse);
    }
    else {
      console.log("error in cancelSubscription=", error);
      let errorRespnse = genericResponse(false, error.message, []);
      res.status(400).json(errorRespnse);
    }

  } catch (error) {
    console.log("Catch in cancelSubscription=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchClientPlanFeatures = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    let sort = {}
    var query = { _id: mongoose.Types.ObjectId(post.businessUserID) };
    if (post.filterValues != undefined && post.filterValues != '')
      query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
    let fetchQuery = [
      {
        $lookup: {
          from: "business_user_plans",
          localField: "_id",
          foreignField: "businessUserID",
          as: "businessUserPlans",
          pipeline: [
            {
              $sort: { _id: -1 }
            },
            {
              $limit: 1
            }
          ]
        }
      },
      { $unwind: "$businessUserPlans" },
      {
        $lookup: {
          from: "subscription_plans",
          localField: "businessUserPlans.planID",
          foreignField: "_id",
          as: "subscriptionPlans",
        }
      },
      { $unwind: "$subscriptionPlans" },
      {
        $lookup: {
          from: "business_user_plan_features",
          localField: "businessUserPlans._id",
          foreignField: "businessUserPlanID",
          as: "businessUserPlanFeatures",
        }
      },
      { $unwind: "$businessUserPlanFeatures" },
      {
        $lookup: {
          from: "plan_features",
          localField: "businessUserPlanFeatures.planFeatureID",
          foreignField: "_id",
          as: "planFeatures"
        }
      },
      { $unwind: "$planFeatures" },
      {
        $lookup: {
          from: "standard_features",
          localField: "planFeatures.featureID",
          foreignField: "_id",
          as: "standardFeatures"
        }
      },
      { $unwind: "$standardFeatures" },
      {
        $lookup: {
          from: "business_user_plan_feature_slabs",
          localField: "businessUserPlanFeatures._id",
          foreignField: "businessUserPlanFeatureID",
          as: "businessUserPlanFeatureSlabs"
        }
      },
      {
        $project: {
          companyName: 1, planName: "$subscriptionPlans.planName",
          planActivationDate: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planActivationDate' } },
          planExpiryDate: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planExpiryDate' } },
          featureCount: "$businessUserPlanFeatures.featureCount", featureName: "$standardFeatures.featureName",
          featureType: "$standardFeatures.featureType", featureSequence: "$standardFeatures.featureSequence",
          fromSlabValue: "$businessUserPlanFeatureSlabs.fromSlabValue", toSlabValue: "$businessUserPlanFeatureSlabs.toSlabValue",
          slabRate: "$businessUserPlanFeatureSlabs.slabRate", trialUser: 1,
          type: "$standardFeatures.featureType",
          requesAndSlab: {
            featureCount: "$businessUserPlanFeatures.featureCount",
            fromSlabValue: "$businessUserPlanFeatureSlabs.fromSlabValue",
            planFeatureID: "$businessUserPlanFeatures.businessUserPlanID",
            featureCode: "$standardFeatures.featureCode"
          }
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
      sort = { featureName: -1 }
    }
    console.log("sdfsdfsd", query)
    let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
    let myAggregation = BusinessUsers.aggregate()
    myAggregation._pipeline = fetchQuery
    BusinessUsers.aggregatePaginate(
      myAggregation,
      options,
      (err, result) => {
        if (err) {
          const errorResponse = genericResponse(false, "Unable to fetch", []);
          res.status(400).json(errorResponse);

        } else {
          const successResponse = genericResponse(true, "Plan Features fetched successfully", result);
          res.status(200).json(successResponse);

        }
      }
    );
  } catch (error) {
    console.log("Cathc in fetchClientPlanFeatures: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const fetchPlanFeatureNameById = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log(post)
    var query = { businessUserPlanID: mongoose.Types.ObjectId(post.planFeatureID) }
    const fetch = await BusinessUserPlanFeatures.aggregate([

      { $match: query },
      {
        $lookup: {
          from: "plan_features",
          localField: "planFeatureID",
          foreignField: "_id",
          as: "planFeatures"
        }
      },
      { $unwind: "$planFeatures" },
      {
        $lookup: {
          from: "standard_features",
          localField: "planFeatures.featureID",
          foreignField: "_id",
          pipeline: [
            {
              // $match: { $or: [{ featureCode: "CAFR" }, { featureCode: "FMR" }] }
              $match: { featureCode: "CAFR" }
            }
          ],

          as: "standardFeatures"
        }
      },
      { $unwind: "$standardFeatures" },
      {
        $lookup: {
          from: "subscription_plans",
          localField: "planFeatures.planID",
          foreignField: "_id",

          as: "subscriptionplans"
        }
      },
      { $unwind: "$subscriptionplans" },
      {
        $lookup: {
          from: "business_user_plans",
          localField: "businessUserPlanID",
          foreignField: "_id",
          as: "businessuserplans"
        }
      },
      { $unwind: "$businessuserplans" },
      {
        $lookup: {
          from: "business_users",
          localField: "businessuserplans.businessUserID",
          foreignField: "_id",
          as: "businessusers"
        }
      },
      { $unwind: "$businessusers" },
      // { $unwind: "$businessusers" },
      {
        $lookup: {
          from: "business_user_plan_feature_slabs",
          localField: "_id",
          foreignField: "businessUserPlanFeatureID",
          as: "businessUserPlanFeatureSlabs"
        }
      },
      {
        $project: {
          _id: 0, businessUserPlanID: "$businessUserPlanID", planFeatureID: "$_id", planActivationDate: { $dateToString: { format: '%Y-%m-%d', date: '$businessuserplans.planActivationDate' } },
          companyName: "$businessusers.companyName", businessUserID: "$businessusers._id",
          featureCount: "$featureCount", featureName: "$standardFeatures.featureName", planName: "$subscriptionplans.planName", businessUserID: "$businessusers._id",
          selectionBasedValue: "$selectionBasedValue",
          featureType: "$standardFeatures.featureType", featureSequence: "$standardFeatures.featureSequence",
          slabWiseList: "$businessUserPlanFeatureSlabs",
          fromSlabValue: "$businessUserPlanFeatureSlabs.fromSlabValue", toSlabValue: "$businessUserPlanFeatureSlabs.toSlabValue",
          slabRate: "$businessUserPlanFeatureSlabs.slabRate", trialUser: 1,
          featureType: "$standardFeatures.featureType",
          planID: "$planFeatures.planID",
          featureID: "$planFeatures.featureID"

        }
      },

    ])

    let successResponse = genericResponse(true, "Success ", fetch);
    res.status(200).json(successResponse);
    console.log("sadhsjkfhs", fetch)

  } catch (error) {
    console.log("Cathc in fetchClientUsers: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const updateUserPlanFeature = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    const slabWiseList = post.slabWiseList
    post.oldBusinessUserPlanID = post.businessUserPlanID
    post.newBusinessUserPlanID = post.businessUserPlanID
    post.transactionType = "Custom Pricing"
    post.transactionStatus = "Processed"
    post.transactionDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    let transactionNotes = ""
    let editnote = ""
    if (post.featureCode != "", post.featureCode == undefined) {
      var query = { _id: (post.freeRequestID) }
      const fetcholdvalue = await BusinessUserPlanFeatures.findById(query)

      transactionNotes = "Free Monthly Requests: Changed from " + " " + fetcholdvalue.featureCount + " " + "to" + " " + post.featureCount + " " + "Cost After Free Requests Slab changed from "
      const newValues = { featureCount: post.featureCount }
      const updatevalues = await BusinessUserPlanFeatures.updateOne(query, newValues)

    }

    if (slabWiseList.length > 0) {
      console.log("sdbsjgfdj")
      for (let i = 0; i < slabWiseList.length; i++) {
        if (slabWiseList[i]._id) {
          if (slabWiseList.length > 1) {
            console.log("sadgjhygdgjafuija", i)
            const fetcholdslab = await BusinessUserPlanFeatureSlabs.findOne({ _id: (slabWiseList[i]._id) })
            if (i !== 0) {
              editnote = " " + "and" + " "

            }
            transactionNotes = transactionNotes + " " + editnote + " " + +fetcholdslab.fromSlabValue + "–" + fetcholdslab.toSlabValue + " " + "@" + fetcholdslab.slabRate + " " + "to" + " " + slabWiseList[i].fromSlabValue + "-" + slabWiseList[i].toSlabValue + " " + "@" + slabWiseList[i].slabRate + " "
            console.log("value:", transactionNotes)
          } else {
            const fetcholdslab = await BusinessUserPlanFeatureSlabs.findOne({ _id: (slabWiseList[0]._id) })
            console.log("fjkhfsk", fetcholdslab)

            transactionNotes = transactionNotes + fetcholdslab.fromSlabValue + "–" + fetcholdslab.toSlabValue + " " + "@" + fetcholdslab.slabRate + " " + "to" + " " + slabWiseList[i].fromSlabValue + "-" + slabWiseList[i].toSlabValue + " " + "@" + slabWiseList[i].slabRate
          }

          const updatedPlanFeature = await BusinessUserPlanFeatureSlabs.updateOne(
            { _id: mongoose.Types.ObjectId(slabWiseList[i]._id) }, { $set: slabWiseList[i] });

        }

      }

      post.transactionNotes = transactionNotes
      let addData = new SubscriptionTransactionsModel(post)
      const saved = addData.save()

      // }
    }
    let successResponse = genericResponse(true, "PlanFeature updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log(error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});


const fetchFeautreCount = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    var query = { businessUserPlanID: mongoose.Types.ObjectId(post.planFeatureID) }
    const fetch = await BusinessUserPlanFeatures.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "plan_features",
          localField: "planFeatureID",
          foreignField: "_id",
          as: "planFeatures"
        }
      },
      { $unwind: "$planFeatures" },

      {
        $lookup: {
          from: "business_user_plans",
          localField: "businessUserPlanID",
          foreignField: "_id",
          as: "businessuserplans"
        }
      },
      { $unwind: "$businessuserplans" },

      {
        $lookup: {
          from: "business_users",
          localField: "businessuserplans.businessUserID",
          foreignField: "_id",
          as: "businessusers"
        }
      },
      { $unwind: "$businessusers" },

      {
        $lookup: {
          from: "standard_features",
          localField: "planFeatures.featureID",
          foreignField: "_id",
          as: "standardFeatures",
          pipeline: [
            {
              $match: {
                featureCode: "FMR"
              }
            }
          ],
        }
      },
      { $unwind: "$standardFeatures" },

      {
        $project: {
          _id: 0,
          featureCount: "$featureCount",
          featureName: "$standardFeatures.featureName",
          planFeatureID: "$_id",
          businessUserID: "$businessusers._id"
        }
      }
    ])
    let successResponse = genericResponse(true, "PlanFeature updated successfully.", fetch);
    res.status(200).json(successResponse);

  } catch (error) {
    console.log(error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const fetchSubsciptionTransactions = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    var sort = {};
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) };

    if (post.filterValues != undefined && post.filterValues != '')
      query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);


    if (post.userStatus != "" && post.userStatus != undefined) {

      query.status = post.userStatus
    }

    if (post.transactionType && post.transactionType.length > 0) {
      query.transactionType = { $in: post.transactionType }
    }


    const fetchQuery = [
      {
        $lookup: {
          from: "subscription_transactions",
          localField: "_id",
          foreignField: "businessUserID",

          as: "subscriptiontransactions"
        }
      },
      { $unwind: "$subscriptiontransactions" },
      {
        $lookup: {
          from: "business_user_plans",
          localField: "subscriptiontransactions.oldBusinessUserPlanID",
          foreignField: "_id",

          as: "oldBusinessUserPlanID"
        }
      },
      { $unwind: "$oldBusinessUserPlanID" },
      {
        $lookup: {
          from: "business_user_plans",
          localField: "subscriptiontransactions.newBusinessUserPlanID",
          foreignField: "_id",

          as: "newBusinessUserPlanId"
        }
      },
      { $unwind: "$newBusinessUserPlanId" },


      {
        $lookup: {
          from: "subscription_plans",
          localField: "oldBusinessUserPlanID.planID",
          foreignField: "_id",

          as: "oldsubscriptionplans"
        }
      },
      { $unwind: "$oldsubscriptionplans" },
      {
        $lookup: {
          from: "subscription_plans",
          localField: "newBusinessUserPlanId.planID",
          foreignField: "_id",

          as: "newsubscriptionplans"
        }
      },
      { $unwind: "$newsubscriptionplans" },

      {
        $project: {
          _id: "$_id",
          transactionDateTime: "$subscriptiontransactions.transactionDateTime",
          transactionDateString: {
            $concat: [
              {
                $let: {
                  vars: {
                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    date: "$subscriptiontransactions.transactionDateTime" // Assuming this is your date field
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
          transactionType: "$subscriptiontransactions.transactionType",
          status: "$subscriptiontransactions.transactionStatus",
          oldPlanName: "$oldsubscriptionplans.planName",
          newPlanName: "$newsubscriptionplans.planName",
          notes: "$subscriptiontransactions.transactionNotes"

        }
      },
      { $match: query },

    ]

    if (post.sortingType && post.sortingField) {
      var sortField = post.sortingField;
      sort[sortField] = post.sortingType;

      fetchQuery.push({ $sort: sort });
    } else {
      sort = { transactionDate: -1 }
    }
    let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };

    let myAggregation = BusinessUsers.aggregate()
    myAggregation._pipeline = fetchQuery
    BusinessUsers.aggregatePaginate(
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
    )

  } catch (error) {
    console.log(error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchSubsciptionTransactionType = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    console.log("post", post)
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) };

    const fetch = [
      { $match: query },

      {
        $lookup: {
          from: "subscription_transactions",
          localField: "_id",
          foreignField: "businessUserID",

          as: "subscriptiontransactions"
        }
      },
      { $unwind: "$subscriptiontransactions" },

      {
        $project: {
          _id: "$_id",
          subscriptionTransactionsId: "$subscriptiontransactions._id",
          transactionType: "$subscriptiontransactions.transactionType",
        }
      },

    ]

    const fetchTransaction = await BusinessUsers.aggregate(fetch)
    let successResponse = genericResponse(true, "Subsciption Transactions fetched successfully.", fetchTransaction);
    res.status(201).json(successResponse);

  } catch (error) {
    console.log(error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});
const fetchInvoicesAndPayments = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var sort = {}
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
    if (post.filterValues != undefined && post.filterValues != '')
      query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
    let fetchQuery = [
      {
        $match: query
      },
      {
        $project: {
          businessUserID: 1, invoiceNumber: 1, invoiceStatus: 1, transactionType: 1, invoiceAmount: 1, paymentAmount: 1,
          invoiceDate: '$invoiceDate',
          invoiceDateString: {
            $concat: [
              {
                $let: {
                  vars: {
                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    date: "$invoiceDate" // Assuming this is your date field
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
          paymentDate: '$paymentDate',
          paymentDateString: {
            $concat: [
              {
                $let: {
                  vars: {
                    monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    date: "$paymentDate" // Assuming this is your date field
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
          }

        }
      },
    ];

    if (post.sortingType && post.sortingField) {
      var sortField = post.sortingField;
      sort[sortField] = post.sortingType;

      fetchQuery.push({ $sort: sort });
    } else {
      sort = { transactionDate: -1 }
    }
    let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };

    let myAggregation = InvoicePaymentsModel.aggregate()
    myAggregation._pipeline = fetchQuery
    InvoicePaymentsModel.aggregatePaginate(
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
    )

  } catch (error) {
    console.log("Cathc in fetchClientUsers: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});
export {
  fetchClients, fetchClientPlanFeatures, fetchClientUsers, fetchSelectedClients, fetchBusinessLocationInfo, getSesstionDataByUserID, fetchSubsciptionTransactionType,
  fetchClientActDeactDetailsByID, deactivateClient, activateClient, fetchPlanFeatureNameById, updateUserPlanFeature, fetchFeautreCount, fetchSubsciptionTransactions,
  fetchInvoicesAndPayments
}