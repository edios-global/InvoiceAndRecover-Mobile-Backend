import asyncHandler from 'express-async-handler'
import BusinessUsers from '../models/businessUsersModel.js';
import sendTwilioMessage, { uploadImageFile } from '../routes/genericMethods.js';
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import Users from '../models/UsersModel.js';
import businessLocation from '../models/businessLocationModel.js';
import businessReviewLink from '../models/businessReviewLinkModel.js';
import OnlineReview from '../models/onlineReviewsModel.js';
import BusinessIntegrationsModel from '../models/businessIntegrationsModel.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
var OAuthClient = require('intuit-oauth');
let oauthClient = null;
let oauth2_token_json = null;


const addCompanyInfo = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) };
    const newChanges = {};
    newChanges.companyName = post.companyName;
    newChanges.companyPhoneNumber = post.companyPhoneNumber;
    newChanges.companyEmailAddress = post.companyEmailAddress;
    newChanges.companyWebsite = post.companyWebsite;
    newChanges.companyStreetAddress = post.companyStreetAddress;
    newChanges.companyCity = post.companyCity;
    newChanges.companyCountryId = post.companyCountryId;
    newChanges.companyStateId = post.companyStateId;
    newChanges.companyZipCode = post.companyZipCode;
    newChanges.wizardStatusFlag = post.wizardStatusFlag;
    newChanges.recordType = "U";
    newChanges.lastModifiedDate = currentDate;
    let newValues = { $set: newChanges };
    const updatedBusinessUser = await BusinessUsers.updateOne(query, newValues);

    const checkIfBusinessLocationExist = await businessLocation.find({
      businessUserID: mongoose.Types.ObjectId(post.businessUserID), defaultLocation: 'Yes',
    }).sort({ _id: -1 });

    const addBusinessLocation = {};
    addBusinessLocation.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    addBusinessLocation.defaultLocation = "Yes";
    addBusinessLocation.locationStatus = "Active";
    addBusinessLocation.countryId = post.companyCountryId;
    addBusinessLocation.stateId = post.companyStateId;
    addBusinessLocation.zipCode = post.companyZipCode
    addBusinessLocation.locationStreetAddress = post.companyStreetAddress;
    addBusinessLocation.locationCity = post.companyCity;
    addBusinessLocation.businessUserID = post.businessUserID;
    // if (post.companyTimeZone)
    addBusinessLocation.companyTimeZone = post.companyTimeZone;
    // if (post.sendingFromHour)
    addBusinessLocation.sendingFromHour = post.sendingFromHour;
    // if (post.sendingToHour)
    addBusinessLocation.sendingToHour = post.sendingToHour;
    addBusinessLocation.sendingFromHourIndex = post.sendingFromHourIndex;
    addBusinessLocation.sendingToHourIndex = post.sendingToHourIndex;

    let firstBusinessLocation;
    if (checkIfBusinessLocationExist.length > 0) {
      const locationUpdateQuery = { _id: mongoose.Types.ObjectId(checkIfBusinessLocationExist[0]._id) };
      addBusinessLocation.recordType = 'U';
      addBusinessLocation.lastModifiedDate = currentDate;
      let newValues = { $set: addBusinessLocation };
      firstBusinessLocation = await businessLocation.findOneAndUpdate(locationUpdateQuery, newValues);
    }
    else {
      firstBusinessLocation = await new businessLocation(addBusinessLocation).save();
      // await new businessReviewLink(post).save();
    }

    let successResponse = genericResponse(true, "Company Information added successfully.", firstBusinessLocation);
    res.status(200).json(successResponse);

  } catch (error) {
    console.log("Catch in addCompanyInfo: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }

});

const fetchSignUpProgressData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = {
      _id: mongoose.Types.ObjectId(post.businessUserID),
      // businessLocationID: mongoose.Types.ObjectId(post.businessLocationID),
    };
    // if (post.searchParameter != undefined && post.searchParameter != '')
    //   query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);

    let fetchQuery = [
      {
        $match: query
      },
      {
        $lookup: {
          from: "business_locations",
          localField: "_id",
          foreignField: "businessUserID",
          as: "businessLocation",
          pipeline: [
            {
              $match: { defaultLocation: 'Yes' }
            },
            // {
            //   $sort: { _id: -1 }
            // },
            {
              $limit: 1
            }
          ]
        }
      },
      { $unwind: "$businessLocation" },
      {
        $project: {
          companyWebsite: 1, companyName: 1, companyPhoneNumber: 1, companyEmailAddress: 1, companyStreetAddress: 1,
          companyCity: 1, companyCountryId: 1, companyStateId: 1, companyZipCode: 1,
          companyTimeZone: "$businessLocation.companyTimeZone", sendingFromHour: "$businessLocation.sendingFromHour",
          sendingToHour: "$businessLocation.sendingToHour",
          businessUserID: "$_id", wizardStatusFlag: 1, companyLogoFileName: 1,
        }
      },
    ];

    const clientsCount = (await BusinessUsers.aggregate(fetchQuery)).length;
    const signUpProgressData = await BusinessUsers.aggregate(fetchQuery);
    let successResponse = genericResponse(true, "Sign Up Progress Data fetched successfully.", {
      count: clientsCount,
      signUpProgressData: signUpProgressData
    });
    res.status(201).json(successResponse);
  } catch (error) {
    console.log("Cathc in fetchIntegrationData: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }

});

const uploadCompanyLogo = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: post.id };
    const newChanges = {};
    if (req.files) {
      let returnedFileName = await uploadImageFile(req, "logoPictureFileName");
      newChanges.companyLogoFileName = returnedFileName;
    }
    newChanges.wizardStatusFlag = post.wizardStatusFlag;
    newChanges.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    newChanges.recordType = "U";
    let newValues = { $set: newChanges };
    await BusinessUsers.updateOne(query, newValues);
    let successResponse = genericResponse(true, "Company Logo uploaded successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch uploadCompanyLogo =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateWizardStatusFlag = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: post.businessUserID };
    const newChanges = {};
    newChanges.wizardStatusFlag = post.wizardStatusFlag;
    newChanges.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    newChanges.recordType = "U";
    let newValues = { $set: newChanges };
    await BusinessUsers.updateOne(query, newValues);
    let successResponse = genericResponse(true, "Wizard Status Flag updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch updateWizardStatusFlag =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const addBusinessReviewLink = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const reviewSiteSequenceQuery = { businessLocationID: mongoose.Types.ObjectId(post.businessLocationID) };
    const lastReviewSiteSequence = await businessReviewLink.find(reviewSiteSequenceQuery, { reviewSiteSequence: 1 }).sort({ reviewSiteSequence: -1 });
    if (lastReviewSiteSequence.length > 0) {
      post.reviewSiteSequence = lastReviewSiteSequence[0].reviewSiteSequence + 1;
    }
    else post.reviewSiteSequence = 1;

    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

    let successResponse;
    if (post.businessReviewLinkID) {
      successResponse = genericResponse(true, "Updated Successfully!", []);
      await businessReviewLink.updateOne({ _id: mongoose.Types.ObjectId(post.businessReviewLinkID) }, post);
    }
    else {
      successResponse = genericResponse(true, "Added Successfully!", []);
      await new businessReviewLink(post).save();
    }

    const updateQuery = { _id: post.businessUserID };
    const newChanges = {};
    newChanges.wizardStatusFlag = post.wizardStatusFlag;
    newChanges.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    newChanges.recordType = "U";
    let newValues = { $set: newChanges };
    await BusinessUsers.updateOne(updateQuery, newValues);

    res.status(201).json(successResponse);
  } catch (error) {
    console.log("Catch in addBusinessReviewLink:", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const fetchBusinessReviewLink = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    // var query = {};
    // if (post.searchParameter != undefined && post.searchParameter != '')
    //   query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);

    let fetchQuery = [
      {
        $lookup: {
          from: "business_locations",
          localField: "businessLocationID",
          foreignField: "_id",
          as: "businessLocations"
        }
      },
      {
        $unwind: "$businessLocations"
      },
      {
        $lookup: {
          from: "countries",
          localField: "businessLocations.countryId",
          foreignField: "_id",
          as: "countries"
        }
      },
      {
        $unwind: "$countries"
      },
      {
        $lookup: {
          from: "country_states",
          localField: "businessLocations.stateId",
          foreignField: "_id",
          as: "countryStates"
        }
      },
      {
        $unwind: "$countryStates"
      },
      {
        $project: {
          reviewSiteName: "$reviewSiteName", reviewSiteLink: "$reviewSiteLink", askForReviews: "$askForReviews",
          monitorOnlineReviews: "$monitorOnlineReviews", reviewSiteSequence: 1, reviewBusinessName: 1, reviewBusinessAddress: 1,
          stateNameWithCountry: { $concat: ["$countryStates.stateName", ", ", "$countries.countryName"] },
          streetWithCity: { $concat: ["$businessLocations.locationStreetAddress", ", ", "$businessLocations.locationCity"] },
          createdDate: '$createdDate', businessLocationID: "$businessLocationID", businessUserID: "$businessUserID"
        }
      },
      {
        $match: {
          businessLocationID: mongoose.Types.ObjectId(post.businessLocationID),
          businessUserID: mongoose.Types.ObjectId(post.businessUserID)
        }
      },
      {
        $sort: { reviewSiteSequence: 1 }
      }
    ];

    const businessReviewLinksCount = (await businessReviewLink.aggregate(fetchQuery)).length;
    const businessReviewLinksList = await businessReviewLink.aggregate(fetchQuery).sort({ companyName: 1 }).skip(post.initialValue).limit(post.finalValue);
    let successResponse = genericResponse(true, "Clients fetched successfully.", {
      count: businessReviewLinksCount,
      list: businessReviewLinksList
    });
    res.status(201).json(successResponse);
  } catch (error) {
    console.log("Cathc in fetchBusinessReviewLink: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }

});

const deleteBusinessReviewLink = asyncHandler(async (req, res) => {
  try {
    const post = req.body;

    const query = { _id: mongoose.Types.ObjectId(post._id) }
    if (post._id != undefined && post._id != '') {
      await OnlineReview.deleteMany({ reviewWebsite: post.reviewSiteName, businessLocationID: mongoose.Types.ObjectId(post.businessLocationID) })
      await businessReviewLink.deleteOne(query);

      const updateQuery = { _id: post.businessUserID };
      const newChanges = {};
      newChanges.wizardStatusFlag = post.wizardStatusFlag;
      newChanges.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      newChanges.recordType = "U";
      let newValues = { $set: newChanges };
      await BusinessUsers.updateOne(updateQuery, newValues);

      res.status(200).json(genericResponse(true, 'Business Review Link deleted sucessfully', []))
    }
    else
      res.status(400).json(genericResponse(false, "ID can't be blank!", []));
  } catch (error) {
    console.log("Cath in deleteBusinessReviewLink: ", error);
    res.status(400).json(genericResponse(false, error.message, []))
  }
});

const checkIntegrationTypeExistOrNot = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = {
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
      businessLocationID: mongoose.Types.ObjectId(post.businessLocationID),
      integrationType: post.integrationType
    }
    const checkIntegrationTypeExistOrNot = await BusinessIntegrationsModel.find(query);
    if (checkIntegrationTypeExistOrNot.length > 0) {
      let successResponse = genericResponse(false, post.integrationType + " is already added.", []);
      res.status(201).json(successResponse);
      return;
    }
    else {
      let successResponse = genericResponse(true, post.integrationType + " is not added.", []);
      res.status(200).json(successResponse);
    }

  } catch (error) {
    console.log("error in checkIntegrationTypeExistOrNot  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const addBusinessIntegration = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    post.recordType = "I";
    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    const addBusinessIntegration = new BusinessIntegrationsModel(post);
    const addedBusinessIntegration = await addBusinessIntegration.save();
    let successResponse = genericResponse(true, "Business Integration added successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in addBusinessLocation  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateBusinessIntegration = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.businessIntegrationID) }
    post.recordType = "U";
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var newValues = { $set: post };
    await BusinessIntegrationsModel.updateOne(query, newValues);
    let successResponse = genericResponse(true, "Business Integration updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in updateBusinessIntegration  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchIntegrationData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = {
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
      businessLocationID: mongoose.Types.ObjectId(post.businessLocationID),
    };
    // if (post.searchParameter != undefined && post.searchParameter != '')
    //   query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);

    let fetchQuery = [
      {
        $project: {
          integrationType: 1, businessUserID: 1, businessLocationID: 1, _id: 1, paraValue1: 1, paraValue2: 1, paraValue3: 1,
          paraValue4: 1, paraValue5: 1, paraValue9: 1
        }
      },
      {
        $match: query
      },
    ];

    const clientsCount = (await BusinessIntegrationsModel.aggregate(fetchQuery)).length;
    const clientsList = await BusinessIntegrationsModel.aggregate(fetchQuery).sort({ integrationType: 1 }).skip(post.initialValue).limit(post.finalValue);
    let successResponse = genericResponse(true, "BusinessIntegrations fetched successfully.", {
      count: clientsCount,
      list: clientsList
    });
    res.status(201).json(successResponse);
  } catch (error) {
    console.log("Cathc in fetchIntegrationData: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const deleteBusinessIntegration = asyncHandler(async (req, res) => {
  try {
    let post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post._id) };
    if (post._id !== undefined && post._id !== '') {
      await BusinessIntegrationsModel.deleteOne(query);
      res.status(201).json(genericResponse(true, "Business Integration is deleted successfully", []));
    }
    else
      res.status(400).json(genericResponse(false, "Business Integration is not found", []));
  } catch (error) {
    console.log("Catch in deleteBusinessIntegration: ", error);
    res.status(400).json(genericResponse(false, error.message, []));
  }
});

const addRoleRights = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

    // var roleQuery = { defaultBusinessRole: "Yes" }
    // const fetchRoles = await Roles.find(roleQuery);

    // Providing Premium Plan Role to User
    // const platinumPlan = await SubscriptionPlan.findOne({ planName: 'Premium' });
    let fetchQuery = [
      {
        $match: { _id: mongoose.Types.ObjectId(post.businessUserID) }
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
      // {
      //   $lookup: {
      //     from: "business_user_plan_features",
      //     localField: "businessUserPlans._id",
      //     foreignField: "businessUserPlanID",
      //     as: "businessUserPlanFeatures",
      //   }
      // },
      // { $unwind: "$businessUserPlanFeatures" },
      // {
      //   $lookup: {
      //     from: "plan_features",
      //     localField: "businessUserPlanFeatures.planFeatureID",
      //     foreignField: "_id",
      //     as: "planFeatures"
      //   }
      // },
      // { $unwind: "$planFeatures" },
      // {
      //   $lookup: {
      //     from: "standard_features",
      //     localField: "planFeatures.featureID",
      //     foreignField: "_id",
      //     as: "standardFeatures"
      //   }
      // },
      // { $unwind: "$standardFeatures" },
      // {
      //   $lookup: {
      //     from: "business_user_plan_feature_slabs",
      //     localField: "businessUserPlanFeatures._id",
      //     foreignField: "businessUserPlanFeatureID",
      //     as: "businessUserPlanFeatureSlabs"
      //   }
      // },
      {
        $project: {
          associatedRoleID: "$subscriptionPlans.associatedRoleID",
          // companyName: 1, planName: "$subscriptionPlans.planName",
          // planActivationDateString: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planActivationDate' } },
          // planExpiryDateString: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planExpiryDate' } },
          // planActivationDate: '$businessUserPlans.planActivationDate', planExpiryDate: '$businessUserPlans.planExpiryDate',
          // featureCount: "$businessUserPlanFeatures.featureCount", featureName: "$standardFeatures.featureName",
          // featureCode: "$standardFeatures.featureCode",
          // selectionBasedValue: "$businessUserPlanFeatures.selectionBasedValue",
          // featureType: "$standardFeatures.featureType", featureSequence: "$standardFeatures.featureSequence",
          // fromSlabValue: "$businessUserPlanFeatureSlabs.fromSlabValue", toSlabValue: "$businessUserPlanFeatureSlabs.toSlabValue",
          // slabRate: "$businessUserPlanFeatureSlabs.slabRate", trialUser: 1, wizardStatusFlag: 1,
        }
      },
    ];

    // const fetchAssociatedRoleID = await BusinessUsers.aggregate(fetchQuery).sort({ featureSequence: 1 });
    const planDetails = await BusinessUsers.aggregate(fetchQuery).sort({ featureSequence: 1 });


    if (planDetails.length > 0) { }
    else {
      console.log("AssociatedRoleID not found.");
      let errorRespnse = genericResponse(false, "AssociatedRoleID not found.", []);
      res.status(200).json(errorRespnse);
      return;
    }

    const newChanges = {};
    newChanges.lastModifiedDate = currentDate;
    newChanges.recordType = "U";
    newChanges.roleID = planDetails[0].associatedRoleID;

    var usersQuery = { businessUserID: post.businessUserID };
    let newValues = { $set: newChanges };
    const user = await Users.findOneAndUpdate(usersQuery, newValues);
    user.roleID = planDetails[0].associatedRoleID;

    // let defaultBusinessLocationID = await businessLocation.findOne({ businessUserID: user.businessUserID, defaultLocation: 'Yes' }, { _id: 1 });
    // if (defaultBusinessLocationID)
    //   defaultBusinessLocationID = defaultBusinessLocationID._id;

    var businessUsersQuery = { _id: post.businessUserID };
    newChanges.wizardStatusFlag = post.wizardStatusFlag;
    newValues = { $set: newChanges };
    await BusinessUsers.updateOne(businessUsersQuery, newValues);

    // const roleRights = await RoleRights.aggregate([
    //   {
    //     $match: { roleId: mongoose.Types.ObjectId(user.roleID) }
    //   },
    //   {
    //     $lookup: {
    //       from: "menu_options",
    //       localField: "menuOptionId",
    //       foreignField: "_id",
    //       as: "menuOption"
    //     }
    //   },
    //   { $unwind: "$menuOption" },
    //   {
    //     $project: {
    //       screenName: "$menuOption.screenName", menuName: "$menuOption.menuName", screenRight: "$screenRight"
    //     }
    //   }
    // ]);

    // const role = await Roles.findById({ _id: mongoose.Types.ObjectId(user.roleID) });

    let successResponse = genericResponse(true, "User logged in successfully.", user);
    // successResponse.RoleRights = roleRights;
    // successResponse.Role = role;
    // successResponse.defaultBusinessLocationID = defaultBusinessLocationID;
    // successResponse.wizardStatusFlag = post.wizardStatusFlag;
    // successResponse.planDetails = planDetails;
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in Catch updateWizardStatusFlag =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const checkIfSiteNameAlredyExist = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const query = { reviewSiteName: post.reviewSiteName, businessLocationID: mongoose.Types.ObjectId(post.businessLocationID) }
    const checkIfSiteNameAlredyExist = await businessReviewLink.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: "business_locations",
          localField: "businessLocationID",
          foreignField: "_id",
          as: "businessLocations"
        }
      },
      {
        $unwind: "$businessLocations"
      },
      {
        $lookup: {
          from: "countries",
          localField: "businessLocations.countryId",
          foreignField: "_id",
          as: "countries"
        }
      },
      {
        $unwind: "$countries"
      },
      {
        $lookup: {
          from: "country_states",
          localField: "businessLocations.stateId",
          foreignField: "_id",
          as: "countryStates"
        }
      },
      {
        $unwind: "$countryStates"
      },
      {
        $project: {
          reviewSiteName: "$reviewSiteName",
          stateNameWithCountry: { $concat: ["$countryStates.stateName", ", ", "$countries.countryName"] },
          streetWithCity: { $concat: ["$businessLocations.locationStreetAddress", ", ", "$businessLocations.locationCity"] },
        }
      }
    ]);
    let successResponse = {}
    if (checkIfSiteNameAlredyExist.length > 0) {
      successResponse = genericResponse(
        false,
        `Review Site (${checkIfSiteNameAlredyExist[0].reviewSiteName}) is already configured for this Business Location (${checkIfSiteNameAlredyExist[0].streetWithCity})`,
        []
      );
    }
    else
      successResponse = genericResponse(true, "Business Review Link added successfully.", []);
    res.status(201).json(successResponse);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const authUri = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    // return;
    oauthClient = new OAuthClient({
      clientId: post.paraValue1,   // enter the apps `clientId`
      clientSecret: post.paraValue2,        // enter the apps `clientSecret`
      environment: process.env.QUICK_BOOKS_ENV, // enter either `sandbox` or `production`
      redirectUri: post.currentWindowURL,
      // redirectUri: 'http://localhost:3000/app/settings/integrations/new',
    });

    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: 'intuit-test',
    });
    // console.log("authUri: ", authUri);
    res.send(authUri);
  }
  catch (error) {
    console.log("catch in authUri:", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const generateToken = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var sessionEndDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    await oauthClient
      .createToken(req.url)
      .then(async function (authResponse) {
        oauth2_token_json = JSON.parse(JSON.stringify(authResponse.getJson(), null, 2));
        // console.log("oauth2_token_json: ", oauth2_token_json);
        if (oauthClient.getToken().realmId !== post.paraValue9) {
          console.log("Not matched");
          let errorRespnse = genericResponse(false, "Company ID doesn't match! Please check logged in QuickBooks account.", []);
          res.status(200).json(errorRespnse);
          return;
        }

        post.recordType = "I";
        post.createdDate = currentDate
        post.paraValue3 = oauth2_token_json.access_token;
        post.paraValue4 = oauth2_token_json.refresh_token;
        post.paraValue5 = oauth2_token_json.x_refresh_token_expires_in;
        post.paraValue6 = oauth2_token_json.id_token;
        post.paraValue7 = oauth2_token_json.token_type;
        post.paraValue8 = oauth2_token_json.expires_in;
        // post.paraValue9 = oauthClient.getToken().realmId;
        post.sessionStartDate = currentDate;
        post.sessionEndDate = new Date(sessionEndDate.setDate(sessionEndDate.getDate() + 100));
        const addBusinessIntegration = new BusinessIntegrationsModel(post);
        const addedBusinessIntegration = await addBusinessIntegration.save();
        let successResponse = genericResponse(true, "Business Integration added successfully.", []);
        res.status(200).json(successResponse);
        // res.send(successResponse);
        // res.send(oauth2_token_json);
      })
      .catch(function (error) {
        console.error(error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse)
      });
  }
  catch (error) {
    console.log("catch in authUri:", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const getQuickBooksData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    // currentDate = new Date(currentDate.setDate(currentDate.getDate() - 12));
    var dateOnly = currentDate.toISOString().substring(0, 10);

    const companyID = oauthClient.getToken().realmId;
    const url =
      oauthClient.environment == 'sandbox'
        ? OAuthClient.environment.sandbox
        : OAuthClient.environment.production;

    const invoiceQuery = `SELECT Id, CustomerRef, DocNumber, TxnDate FROM Invoice WHERE Balance = '0' and TxnDate='${dateOnly}' ORDERBY TxnDate ASC`;
    console.log("invoiceQuery: ", invoiceQuery);

    await oauthClient.makeApiCall({ url: `${url}v3/company/${companyID}/query?query=${invoiceQuery}` })
      .then(async function (authResponse) {
        // console.log('The response for API call is :', JSON.parse(JSON.stringify(authResponse.text())));
        const invoiceData = JSON.parse(authResponse.text()).QueryResponse.Invoice;
        if (invoiceData) {
          var customerIDs = [];

          await invoiceData.forEach(async (element, index, array) => {
            customerIDs.push(JSON.stringify(element.CustomerRef.value).replaceAll(/"/g, "'"));
          });

          const customerQuery = `select Id, GivenName, FamilyName, DisplayName, Mobile, PrimaryPhone, PrimaryEmailAddr from Customer where Id in (${customerIDs})`;
          console.log("customerQuery: ", customerQuery);
          await oauthClient.makeApiCall({ url: `${url}v3/company/${companyID}/query?query=${customerQuery}` })
            .then(async function (customerResponse) {
              const customerData = JSON.parse(customerResponse.text()).QueryResponse.Customer;

              var formattedCustomerData = [];

              for (let invoice of invoiceData) {
                var count = await ReviewRequest.count({ jobID: invoice.DocNumber.toString(), businessUserID: mongoose.Types.ObjectId(post.businessUserID), businessLocationID: mongoose.Types.ObjectId(post.businessLocationID) });

                if (count > 0) {
                  continue;
                }

                customerData.filter(customer => customer.Id === invoice.CustomerRef.value)
                  .map(filteredCustomer => {
                    if (filteredCustomer.GivenName && filteredCustomer.FamilyName) {
                      invoice.firstName = filteredCustomer.GivenName;
                      invoice.lastName = filteredCustomer.FamilyName;
                    }
                    else if (!filteredCustomer.GivenName && !filteredCustomer.FamilyName) {
                      invoice.firstName = filteredCustomer.DisplayName;
                      invoice.lastName = ".";
                    }
                    else if (filteredCustomer.GivenName) {
                      invoice.firstName = filteredCustomer.GivenName;
                      invoice.lastName = filteredCustomer.DisplayName;
                    }
                    else if (filteredCustomer.FamilyName) {
                      invoice.firstName = filteredCustomer.DisplayName;
                      invoice.lastName = filteredCustomer.FamilyName;
                    }

                    if (filteredCustomer.PrimaryEmailAddr)
                      invoice.emailAddress = filteredCustomer.PrimaryEmailAddr.Address;
                    if (filteredCustomer.Mobile)
                      invoice.phoneNumber = '+1' + filteredCustomer.Mobile.FreeFormNumber.replace(/\D/g, '');
                    else if (filteredCustomer.PrimaryPhone)
                      invoice.phoneNumber = '+1' + filteredCustomer.PrimaryPhone.FreeFormNumber.replace(/\D/g, '');

                    invoice.businessLocationID = post.businessLocationID;
                    invoice.businessUserID = post.businessUserID;
                    invoice.customerID = filteredCustomer.Id;
                    // invoice.jobID = invoice.Id;
                    invoice.jobID = invoice.DocNumber;
                    invoice.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                    invoice.requestSource = "QuickBooks";
                    invoice.requestStatus = "Requested";
                    invoice.requestDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

                    if (invoice.emailAddress && invoice.phoneNumber)
                      invoice.communicationType = 'Both';
                    else if (!invoice.emailAddress && !invoice.phoneNumber)
                      invoice.communicationType = 'None';
                    else if (invoice.emailAddress)
                      invoice.communicationType = 'Email';
                    else if (invoice.phoneNumber)
                      invoice.communicationType = 'SMS';

                    if (invoice.communicationType !== 'None')
                      formattedCustomerData.push(invoice);
                  })
              }

              await ReviewRequest.insertMany(formattedCustomerData, function (err, data) {
                if (err != null) {
                  console.log("err here");
                  return console.log(err);
                }
                if (data) {
                  console.log("data here");
                  let successResponse = genericResponse(true, "Business Integration added successfully.", []);
                  res.status(200).json(successResponse);
                }
              });
            }).catch(function (e) {
              console.error(e);
              let errorRespnse = genericResponse(false, error.message, []);
              res.status(400).json(errorRespnse);
            });
        }
        else {
          console.log("No Invoice found");
          let successResponse = genericResponse(true, "Business Integration added successfully.", []);
          res.status(200).json(successResponse);
        }

        // res.send(JSON.parse(authResponse.text()));
      }).catch(function (error) {
        console.error(error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
      });
  }
  catch (error) {
    console.log("Catch in getQuickBooksData:", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});


export {
  addCompanyInfo, fetchSignUpProgressData, uploadCompanyLogo,
  addBusinessReviewLink, fetchBusinessReviewLink, deleteBusinessReviewLink, checkIfSiteNameAlredyExist,
  updateWizardStatusFlag, addRoleRights,
  fetchIntegrationData, addBusinessIntegration, updateBusinessIntegration, deleteBusinessIntegration, checkIntegrationTypeExistOrNot,
  authUri, generateToken, getQuickBooksData,
}
