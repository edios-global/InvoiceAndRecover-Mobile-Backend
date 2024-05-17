import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import BusinessUsers from '../models/businessUsersModel.js';
import { decryptPassword, encryptPassword, getRole, sendEmail, sendMailBySendGrid, updateToObjectType } from '../routes/genericMethods.js';
import SubscriptionPlan from '../models/subscriptionPlansModel.js';
import { createRequire } from 'module';
import Roles from '../models/rolesModel.js';
import Users from '../models/UsersModel.js';
import BusinessUserPlans from '../models/businessUserPlansModel.js';
import PlanFeaturesSlab from '../models/planFeaturesSlabModel.js';
import BusinessUserPlanFeatureSlabs from '../models/businessUserPlanFeaturesSlabModel.js';
import SubscriptionTransactionsModel from '../models/subscriptionTransactionsModel.js';
import BusinessUserPlanFeatures from '../models/businessUserPlanFeaturesModel.js';
import PlanFeatures from '../models/planFeaturesModel.js';
import Templates from '../models/templatesModel.js';
const require = createRequire(import.meta.url);
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const fetchCurrentPlanDetails = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post.businessUserID) };
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
          cancellationType: 1,
          // planActivationDate: "$businessUserPlans.planActivationDate", planExpiryDate: "$businessUserPlans.planExpiryDate",
          planActivationDate: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planActivationDate' } },
          planExpiryDate: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planExpiryDate' } },
          planCancellationEffectiveDate: "$businessUserPlans.planExpiryDate", planCancellationReqeustDate: "$planCancellationReqeustDate",
          planName: "$subscriptionPlans.planName", planPeriod: "$subscriptionPlans.planPeriod", currentPlanID: "$subscriptionPlans._id",
          businessUserPlanID: "$businessUserPlans._id", trialUser: 1,
        }
      },
      {
        $match: query
      },
      {
        $sort: { businessUserPlanID: -1 }
      }
    ];

    const fetchCurrentPlanDetails = await BusinessUsers.aggregate(fetchQuery);


    let fetchCredit = [
      {
        $match: {
          planID: mongoose.Types.ObjectId(fetchCurrentPlanDetails[0].currentPlanID)
        }
      },
      {
        $lookup: {
          from: "standard_features",
          localField: "featureID",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                featureCode: "OCTUC"
              }
            }
          ],
          as: "standardFeatures",
        },
      },
      { $unwind: "$standardFeatures" },

      {
        $project: {
          featureCount: 1

        }
      }

    ]
    const fetchFeatureCredit = await PlanFeatures.aggregate(fetchCredit)
    let successResponse = genericResponse(true, "Current Plan Details fetched successfully.", {
      currentPlanDetails: fetchCurrentPlanDetails,
      credit: fetchFeatureCredit
    })
    res.status(201).json(successResponse);
  } catch (error) {
    console.log("Cathc in fetchCurrentPlanDetails: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }

});

const fetchSubscriptionPlans = asyncHandler(async (req, res) => {
  const post = req.body;
  try {

    console.log("gfhfughuif", post)
    const query = { planStatus: "Active" }
    const fetchPlan = await SubscriptionPlan.find(
      query, { planName: 1, planPeriod: 1, planMonthlyCost: 1, planStatus: 1, planSequence: 1 }
    ).sort({ planSequence: 1 });
    let successResponse = genericResponse(true, "Data fetched successfully.", fetchPlan);
    res.status(200).json(successResponse);
  }
  catch (error) {
    console.log("Catch in fetchPlans: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const fetchcards = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) }
    const fetchUser = await BusinessUsers.find(query)

    const customer = await stripe.customers.retrieve(fetchUser[0].gatewayUserID);


    const paymentMethods = await stripe.paymentMethods.list({
      customer: fetchUser[0].gatewayUserID,
      type: 'card',
    });
    // console.log("paymentMethods" ,paymentMethods.data)
    // return
    let filterData = []
    for (let card of paymentMethods.data) {
      let defultCard;
      if (customer.invoice_settings.default_payment_method === card.id) {
        defultCard = "Yes"

      } else {
        defultCard = "No"
      }

      let data = {
        paymentMethodID: card.id,
        cardNumber: card.card.last4,
        expiryMonth: card.card.exp_month,
        expiryYear: card.card.exp_year,
        defaultCard: defultCard,
        brand: card.card.brand

      }
      filterData.push(data)

    }

    let successResponse = genericResponse(true, "Data fetched successfully.", filterData);
    res.status(200).json(successResponse);
  }
  catch (error) {
    console.log("Catch in fetchPlans: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const fetchPaymentIntent = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) }
    const fetchUser = await BusinessUsers.find(query)
    if (post.noOfCredits === "" || post.noOfCredits === undefined) {
      post.noOfCredits = "NULL"
    }
    const paymentIntent = await stripe.paymentIntents.create({
      customer: fetchUser[0].gatewayUserID,
      setup_future_usage: 'off_session',
      amount: Math.round(post.planMonthlyCost * 100),
      currency: 'aud',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        businessUserID: post.businessUserID,
        paymentType: post.paymentType,
        gatewayUserID: fetchUser[0].gatewayUserID,
        amount: post.planMonthlyCost,
        creditBuy: post.noOfCredits


      }
    });
    console.log("sadbhjasd", paymentIntent)


    let data = {
      paymentId: paymentIntent.id,
      paymentClientSlient: paymentIntent.client_secret,
    }

    console.log("sdhasd", data)

    let successResponse = genericResponse(true, "Data fetched successfully.", data);
    res.status(200).json(successResponse);
  }
  catch (error) {
    console.log("Catch in fetchPlans: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const cardDelete = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) }
    const fetchUser = await BusinessUsers.find(query)




    const paymentMethod = await stripe.paymentMethods.detach(post.paymentMethodID);

    let successResponse = genericResponse(true, "Data fetched successfully.", []);
    res.status(200).json(successResponse);
  }
  catch (error) {
    console.log("Catch in fetchPlans: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const setDefaultCard = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) }
    const fetchUser = await BusinessUsers.find(query)
    await stripe.customers.update(fetchUser[0].gatewayUserID, {
      invoice_settings: {
        default_payment_method: post.paymentMethodID,
      },
    });


    let successResponse = genericResponse(true, "Data fetched successfully.", []);
    res.status(200).json(successResponse);
  }
  catch (error) {
    console.log("Catch in fetchPlans: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const changeSubscriptionPlan = asyncHandler(async (req, res) => {
  try {

    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.id) };
    const fetchUser = await BusinessUsers.find(query)
    const paymentIntent = await stripe.paymentIntents.retrieve(post.paymentIntentMethodID);
    if (post.paymentType === "Add Credit") {
      await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(post.businessUserID) }, { $set: { availableCredits: fetchUser[0].availableCredits + parseInt(paymentIntent.metadata.creditBuy) } })
      let successResponse = genericResponse(true, "Add Credit successfully.", []);
      res.status(200).json(successResponse);
      return
    }


    const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var planExpiryDate = new Date(new Date(new Date() - (new Date().getTimezoneOffset() * 60000)).setUTCHours(23, 59, 59, 999));
    post.lastModifiedDate = currentDate;
    let newValue = { $set: { trialUser: 0, lastModifiedDate: post.lastModifiedDate } };
    const updateBusinessUser = await BusinessUsers.findOneAndUpdate(query, newValue);
    const fetchedRole = await Roles.find({ planID: mongoose.Types.ObjectId(post.planID), applicableForBusinessUser: "Yes", defaultPlanRole: "Yes" });
    const fetchAllUsers = await Users.aggregate([

      { $match: { businessUserID: mongoose.Types.ObjectId(post.businessUserID), userType: { $nin: ["Warehouse"] } } },
      {
        $lookup: {
          from: "roles",
          localField: "roleID",
          foreignField: "_id",
          as: "roles",
        },
      },
      { $unwind: "$roles" },
      {
        $project: {
          roleName: "$roles.roleName"
        }
      }


    ]);
    await stripe.customers.update(fetchUser[0].gatewayUserID, {
      invoice_settings: {
        default_payment_method: paymentIntent.payment_method,
      },
    });

    if (fetchedRole.length > 0) { }
    else {
      console.log("Plan Default Role not found.");
      let errorRespnse = genericResponse(false, "Plan Default Role is not found", []);
      res.status(200).json(errorRespnse);
      return;
    }

    for (let data of fetchAllUsers) {
      newValue = { $set: { roleID: mongoose.Types.ObjectId(await getRole(post.planID, data.roleName)), lastModifiedDate: post.lastModifiedDate } }
      const updateUser = await Users.updateOne({ _id: data._id }, newValue);
    }


    const addBusinessUserPlan = new BusinessUserPlans();
    addBusinessUserPlan.businessUserID = post.id;
    addBusinessUserPlan.planID = post.planID;
    addBusinessUserPlan.planActivationDate = currentDate;
    addBusinessUserPlan.planExpiryDate = new Date(planExpiryDate.setDate(planExpiryDate.getDate() + 30));
    addBusinessUserPlan.createdDate = currentDate;

    const addedBusinessUserPlan = await addBusinessUserPlan.save();
    const fetchplanName = await SubscriptionPlan.find({ _id: post.planID })
    if (fetchplanName[0].planName !== "Free Trial") {
      let fetchCredit = [
        {
          $match: {
            planID: mongoose.Types.ObjectId(addedBusinessUserPlan.planID)
          }
        },
        {
          $lookup: {
            from: "standard_features",
            localField: "featureID",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  featureCode: "FMC"
                }
              }
            ],
            as: "standardFeatures",
          },
        },
        { $unwind: "$standardFeatures" },

        {
          $project: {
            featureCount: 1

          }
        }

      ]
      const fetchFeature = await PlanFeatures.aggregate(fetchCredit)
      await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(addedBusinessUserPlan.businessUserID) }, { $set: { availableCredits: fetchUser[0].availableCredits + fetchFeature[0].featureCount } })




    }

    const planFeatures = await PlanFeatures.aggregate([
      {
        $match: {
          planID: mongoose.Types.ObjectId(addedBusinessUserPlan.planID)
        }
      },
      {
        $addFields: {
          businessUserPlanID: mongoose.Types.ObjectId(),
          planFeatureID: mongoose.Types.ObjectId()
        }
      },
    ]);


    const planFeaturesIDArray = [];
    const formattedPlanFeatures = new Promise((resolve, reject) => {
      planFeatures.forEach(async (element, index, array) => {
        planFeaturesIDArray.push(element._id);
        element.businessUserPlanID = addedBusinessUserPlan._id;
        element.planFeatureID = element._id;
        element.createdDate = addedBusinessUserPlan.createdDate;
        element._id = undefined;
        resolve(planFeatures);
      });
    });

    await formattedPlanFeatures.then(data => {
      const addedBusinessUserPlanFeatures = BusinessUserPlanFeatures.insertMany(data, async function (err, data) {
        if (err != null) {
          return console.log(err);
        }
        if (data) {

          const planFeaturesSlabs = await PlanFeaturesSlab.aggregate([
            {
              $match: {
                planFeatureID: { $in: await updateToObjectType(planFeaturesIDArray) }
              }
            },
            {
              $addFields: {
                businessUserPlanFeatureID: mongoose.Types.ObjectId()
              }
            },
          ]);

          if (planFeaturesSlabs.length > 0) {
            const formattedPlanFeaturesSlabs = new Promise((resolve, reject) => {
              planFeaturesSlabs.forEach(async (element, index, array) => {
                const businessUserPlanFeature = await (data.find((feature) =>
                  feature.planFeatureID.toString() === element.planFeatureID.toString()));
                if (businessUserPlanFeature && businessUserPlanFeature._id) {
                  element.businessUserPlanFeatureID = businessUserPlanFeature._id
                }
                element.createdDate = addedBusinessUserPlan.createdDate;
                element._id = undefined;
                resolve(planFeaturesSlabs);
              })
            });

            await formattedPlanFeaturesSlabs.then(data => {
              const addedBusinessUserPlanFeatureSlabs = BusinessUserPlanFeatureSlabs.insertMany(data, async function (err, data) {
                if (err != null) {
                  return console.log(err);
                }
                if (data) {
                  console.log("BusinessUserPlanFeatureSlabs added successfully.");
                }
              });
            }).catch((error) => {
              console.log("BusinessUserPlanFeatureSlabs added error:", error);
              return;
            });
          }

        }
      });
    }).catch((error) => {
      console.log("BusinessUserPlanFeatures added error:", error);
      return;
    });

    if (addedBusinessUserPlan) {
      const addSubscriptionTransactions = new SubscriptionTransactionsModel();
      addSubscriptionTransactions.transactionDateTime = currentDate;
      addSubscriptionTransactions.businessUserID = post.id;
      addSubscriptionTransactions.oldBusinessUserPlanID = post.businessUserPlanID;
      addSubscriptionTransactions.newBusinessUserPlanID = addedBusinessUserPlan._id;
      addSubscriptionTransactions.transactionType = 'Subscription Plan Changed';
      addSubscriptionTransactions.transactionStatus = 'Processed';
      addSubscriptionTransactions.createdDate = currentDate;
      const addedSubscriptionTransactions = await addSubscriptionTransactions.save();


      const fetchBusinessUser = await BusinessUsers.find({ _id: mongoose.Types.ObjectId(post.businessUserID) })
      const templateQuery = { templateStatus: 'Active', templateName: 'SubscriptionPlanChangeEmailNotification' };
      const fetchedTemplates = await Templates.find(templateQuery);

      if (fetchedTemplates.length > 0) {
        let emailSubject = '';
        let emailBody = '';
        let val = fetchedTemplates[0];
        val.templateSubject = val.templateSubject.replaceAll('[FirstName]', fetchBusinessUser[0].firstName);
        val.templateSubject = val.templateSubject.replaceAll('[LastName]', fetchBusinessUser[0].lastName);
        emailSubject = val.templateSubject;

        val.templateMessage = val.templateMessage.replaceAll('[FirstName]', fetchBusinessUser[0].firstName);
        val.templateMessage = val.templateMessage.replaceAll('[LastName]', fetchBusinessUser[0].lastName);
        val.templateMessage = val.templateMessage.replaceAll('[OldSubscriptionPlan]', post.planName);
        val.templateMessage = val.templateMessage.replaceAll('[NewSubscriptionPlan]', post.newSubscriptionPlan);
        emailBody = val.templateMessage;
        await sendEmail(post.emailAddress, emailSubject, emailBody, "BossFM");
      }

      let successResponse = genericResponse(true, "Subcription Changed Sucessfully!", []);
      res.status(200).json(successResponse);
    }
    else {
      let successResponse = genericResponse(false, "Found Error", []);
      res.status(200).json(successResponse);
    }

  } catch (error) {
    console.log("Catch in  changeSubscriptionPlan=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const payWithSavedCard = asyncHandler(async (req, res) => {
  const post = req.body;
  console.log("sadfasdfa", post)
  try {
    const fetchUser = await BusinessUsers.find({ _id: mongoose.Types.ObjectId(post.businessUserID) })
    if (post.noOfCredits === "" || post.noOfCredits === undefined) {
      post.noOfCredits = "NULL"
    }
    const paymentIntent = await stripe.paymentIntents.create({
      customer: fetchUser[0].gatewayUserID,
      amount: Math.round(post.planMonthlyCost * 100),
      currency: 'aud',
      payment_method: post.paymentMethodID,
      confirm: true,
      off_session: true,
      metadata: {
        businessUserID: post.businessUserID,
        paymentType: post.paymentType,
        gatewayUserID: fetchUser[0].gatewayUserID,
        amount: post.planMonthlyCost,
        creditBuy: post.noOfCredits
      }
    });

    if (post.paymentType === "Add Credit") {
      await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(post.businessUserID) }, { $set: { availableCredits: fetchUser[0].availableCredits + parseInt(post.noOfCredits) } })
      let successResponse = genericResponse(true, "Add Credit successfully.", []);
      res.status(200).json(successResponse);
      return

    }
    const fetchplanName = await SubscriptionPlan.find({ _id: post.planID })
    if (fetchplanName[0].planName !== "Free Trial" && post.paymentType === "Subcription") {
      let fetchCredit = [
        {
          $match: {
            planID: mongoose.Types.ObjectId(post.planID)
          }
        },
        {
          $lookup: {
            from: "standard_features",
            localField: "featureID",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  featureCode: "FMC"
                }
              }
            ],
            as: "standardFeatures",
          },
        },
        { $unwind: "$standardFeatures" },

        {
          $project: {
            featureCount: 1

          }
        }

      ]

      const fetchFeature = await PlanFeatures.aggregate(fetchCredit)
      await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(post.businessUserID) }, { $set: { availableCredits: fetchUser[0].availableCredits + fetchFeature[0].featureCount } })

    }

    const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var planExpiryDate = new Date(new Date(new Date() - (new Date().getTimezoneOffset() * 60000)).setUTCHours(23, 59, 59, 999));
    const query = { _id: mongoose.Types.ObjectId(post.id) };
    post.lastModifiedDate = currentDate;
    let newValue = { $set: { trialUser: 0, lastModifiedDate: post.lastModifiedDate } };
    const updateBusinessUser = await BusinessUsers.findOneAndUpdate(query, newValue);
    const fetchedRole = await Roles.find({ planID: mongoose.Types.ObjectId(post.planID), applicableForBusinessUser: "Yes", defaultPlanRole: "Yes" });
    const fetchAllUsers = await Users.aggregate([

      { $match: { businessUserID: mongoose.Types.ObjectId(post.businessUserID), userType: { $nin: ["Warehouse"] } } },
      {
        $lookup: {
          from: "roles",
          localField: "roleID",
          foreignField: "_id",
          as: "roles",
        },
      },
      { $unwind: "$roles" },
      {
        $project: {
          roleName: "$roles.roleName"
        }
      }


    ]);
    await stripe.customers.update(fetchUser[0].gatewayUserID, {
      invoice_settings: {
        default_payment_method: paymentIntent.payment_method,
      },
    });

    if (fetchedRole.length > 0) { }
    else {
      console.log("Plan Default Role not found.");
      let errorRespnse = genericResponse(false, "Plan Default Role is not found", []);
      res.status(200).json(errorRespnse);
      return;
    }

    for (let data of fetchAllUsers) {
      newValue = { $set: { roleID: mongoose.Types.ObjectId(await getRole(post.planID, data.roleName)), lastModifiedDate: post.lastModifiedDate } }
      const updateUser = await Users.updateOne({ _id: data._id }, newValue);
    }

    // Reterieving current subscription for Act & Exp Date


    const addBusinessUserPlan = new BusinessUserPlans();
    addBusinessUserPlan.businessUserID = post.id;
    addBusinessUserPlan.planID = post.planID;
    addBusinessUserPlan.planActivationDate = currentDate;
    addBusinessUserPlan.planExpiryDate = new Date(planExpiryDate.setDate(planExpiryDate.getDate() + 30));
    addBusinessUserPlan.createdDate = currentDate;

    const addedBusinessUserPlan = await addBusinessUserPlan.save();


    const planFeatures = await PlanFeatures.aggregate([
      {
        $match: {
          planID: mongoose.Types.ObjectId(addedBusinessUserPlan.planID)
        }
      },
      {
        $addFields: {
          businessUserPlanID: mongoose.Types.ObjectId(),
          planFeatureID: mongoose.Types.ObjectId()
        }
      },
    ]);

    const planFeaturesIDArray = [];
    const formattedPlanFeatures = new Promise((resolve, reject) => {
      planFeatures.forEach(async (element, index, array) => {
        planFeaturesIDArray.push(element._id);
        element.businessUserPlanID = addedBusinessUserPlan._id;
        element.planFeatureID = element._id;
        element.createdDate = addedBusinessUserPlan.createdDate;
        element._id = undefined;
        resolve(planFeatures);
      });
    });

    await formattedPlanFeatures.then(data => {
      const addedBusinessUserPlanFeatures = BusinessUserPlanFeatures.insertMany(data, async function (err, data) {
        if (err != null) {
          return console.log(err);
        }
        if (data) {

          const planFeaturesSlabs = await PlanFeaturesSlab.aggregate([
            {
              $match: {
                planFeatureID: { $in: await updateToObjectType(planFeaturesIDArray) }
              }
            },
            {
              $addFields: {
                businessUserPlanFeatureID: mongoose.Types.ObjectId()
              }
            },
          ]);

          if (planFeaturesSlabs.length > 0) {
            const formattedPlanFeaturesSlabs = new Promise((resolve, reject) => {
              planFeaturesSlabs.forEach(async (element, index, array) => {
                const businessUserPlanFeature = await (data.find((feature) =>
                  feature.planFeatureID.toString() === element.planFeatureID.toString()));
                if (businessUserPlanFeature && businessUserPlanFeature._id) {
                  element.businessUserPlanFeatureID = businessUserPlanFeature._id
                }
                element.createdDate = addedBusinessUserPlan.createdDate;
                element._id = undefined;
                resolve(planFeaturesSlabs);
              })
            });

            await formattedPlanFeaturesSlabs.then(data => {
              const addedBusinessUserPlanFeatureSlabs = BusinessUserPlanFeatureSlabs.insertMany(data, async function (err, data) {
                if (err != null) {
                  return console.log(err);
                }
                if (data) {
                  console.log("BusinessUserPlanFeatureSlabs added successfully.");
                }
              });
            }).catch((error) => {
              console.log("BusinessUserPlanFeatureSlabs added error:", error);
              return;
            });
          }

        }
      });
    }).catch((error) => {
      console.log("BusinessUserPlanFeatures added error:", error);
      return;
    });

    if (addedBusinessUserPlan) {
      const addSubscriptionTransactions = new SubscriptionTransactionsModel();
      addSubscriptionTransactions.transactionDateTime = currentDate;
      addSubscriptionTransactions.businessUserID = post.id;
      addSubscriptionTransactions.oldBusinessUserPlanID = post.businessUserPlanID;
      addSubscriptionTransactions.newBusinessUserPlanID = addedBusinessUserPlan._id;
      addSubscriptionTransactions.transactionType = 'Subscription Plan Changed';
      addSubscriptionTransactions.transactionStatus = 'Processed';
      addSubscriptionTransactions.createdDate = currentDate;
      const addedSubscriptionTransactions = await addSubscriptionTransactions.save();


      const fetchBusinessUser = await BusinessUsers.find({ _id: mongoose.Types.ObjectId(post.businessUserID) })
      const templateQuery = { templateStatus: 'Active', templateName: 'SubscriptionPlanChangeEmailNotification' };
      const fetchedTemplates = await Templates.find(templateQuery);

      if (fetchedTemplates.length > 0) {
        let emailSubject = '';
        let emailBody = '';
        let val = fetchedTemplates[0];
        val.templateSubject = val.templateSubject.replaceAll('[FirstName]', fetchBusinessUser[0].firstName);
        val.templateSubject = val.templateSubject.replaceAll('[LastName]', fetchBusinessUser[0].lastName);
        emailSubject = val.templateSubject;

        val.templateMessage = val.templateMessage.replaceAll('[FirstName]', fetchBusinessUser[0].firstName);
        val.templateMessage = val.templateMessage.replaceAll('[LastName]', fetchBusinessUser[0].lastName);
        val.templateMessage = val.templateMessage.replaceAll('[OldSubscriptionPlan]', post.planName);
        val.templateMessage = val.templateMessage.replaceAll('[NewSubscriptionPlan]', post.newSubscriptionPlan);
        emailBody = val.templateMessage;
        await sendEmail(fetchUser[0].emailAddress, emailSubject, emailBody, "BossFM");
      }

      let successResponse = genericResponse(true, "Plan changed successfully.", []);
      res.status(200).json(successResponse);
    }
    else {
      let successResponse = genericResponse(false, "Found Error", []);
      res.status(200).json(successResponse);
    }

  }
  catch (error) {
    console.log("Catch in fetchPlans: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

const changeToBasic = asyncHandler(async (req, res) => {
  try {

    const post = req.body;


    const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    var planExpiryDate = new Date(new Date(new Date() - (new Date().getTimezoneOffset() * 60000)).setUTCHours(23, 59, 59, 999));
    const query = { _id: mongoose.Types.ObjectId(post.id) };
    post.lastModifiedDate = currentDate;
    let newValue = { $set: { trialUser: 0, lastModifiedDate: post.lastModifiedDate } };
    const updateBusinessUser = await BusinessUsers.findOneAndUpdate(query, newValue);
    const fetchedRole = await Roles.find({ planID: mongoose.Types.ObjectId(post.planID), applicableForBusinessUser: "Yes", defaultPlanRole: "Yes" });
    const fetchAllUsers = await Users.aggregate([

      { $match: { businessUserID: mongoose.Types.ObjectId(post.businessUserID), userType: { $nin: ["Warehouse"] } } },
      {
        $lookup: {
          from: "roles",
          localField: "roleID",
          foreignField: "_id",
          as: "roles",
        },
      },
      { $unwind: "$roles" },
      {
        $project: {
          roleName: "$roles.roleName"
        }
      }


    ]);
    const fetchUser = await BusinessUsers.find(query)


    if (fetchedRole.length > 0) { }
    else {
      console.log("Plan Default Role not found.");
      let errorRespnse = genericResponse(false, "Plan Default Role is not found", []);
      res.status(200).json(errorRespnse);
      return;
    }

    for (let data of fetchAllUsers) {
      newValue = { $set: { roleID: mongoose.Types.ObjectId(await getRole(post.planID, data.roleName)), lastModifiedDate: post.lastModifiedDate } }
      const updateUser = await Users.updateOne({ _id: data._id }, newValue);
    }

    // Reterieving current subscription for Act & Exp Date


    const addBusinessUserPlan = new BusinessUserPlans();
    addBusinessUserPlan.businessUserID = post.id;
    addBusinessUserPlan.planID = post.planID;
    addBusinessUserPlan.planActivationDate = currentDate;
    // addBusinessUserPlan.planExpiryDate = new Date(planExpiryDate.setDate(planExpiryDate.getDate() + 30));
    addBusinessUserPlan.createdDate = currentDate;

    const addedBusinessUserPlan = await addBusinessUserPlan.save();

    const planFeatures = await PlanFeatures.aggregate([
      {
        $match: {
          planID: mongoose.Types.ObjectId(addedBusinessUserPlan.planID)
        }
      },
      {
        $addFields: {
          businessUserPlanID: mongoose.Types.ObjectId(),
          planFeatureID: mongoose.Types.ObjectId()
        }
      },
    ]);


    const planFeaturesIDArray = [];
    const formattedPlanFeatures = new Promise((resolve, reject) => {
      planFeatures.forEach(async (element, index, array) => {
        planFeaturesIDArray.push(element._id);
        element.businessUserPlanID = addedBusinessUserPlan._id;
        element.planFeatureID = element._id;
        element.createdDate = addedBusinessUserPlan.createdDate;
        element._id = undefined;
        resolve(planFeatures);
      });
    });

    await formattedPlanFeatures.then(data => {
      const addedBusinessUserPlanFeatures = BusinessUserPlanFeatures.insertMany(data, async function (err, data) {
        if (err != null) {
          return console.log(err);
        }
        if (data) {

          const planFeaturesSlabs = await PlanFeaturesSlab.aggregate([
            {
              $match: {
                planFeatureID: { $in: await updateToObjectType(planFeaturesIDArray) }
              }
            },
            {
              $addFields: {
                businessUserPlanFeatureID: mongoose.Types.ObjectId()
              }
            },
          ]);

          if (planFeaturesSlabs.length > 0) {
            const formattedPlanFeaturesSlabs = new Promise((resolve, reject) => {
              planFeaturesSlabs.forEach(async (element, index, array) => {
                const businessUserPlanFeature = await (data.find((feature) =>
                  feature.planFeatureID.toString() === element.planFeatureID.toString()));
                if (businessUserPlanFeature && businessUserPlanFeature._id) {
                  element.businessUserPlanFeatureID = businessUserPlanFeature._id
                }
                element.createdDate = addedBusinessUserPlan.createdDate;
                element._id = undefined;
                resolve(planFeaturesSlabs);
              })
            });

            await formattedPlanFeaturesSlabs.then(data => {
              const addedBusinessUserPlanFeatureSlabs = BusinessUserPlanFeatureSlabs.insertMany(data, async function (err, data) {
                if (err != null) {
                  return console.log(err);
                }
                if (data) {
                  console.log("BusinessUserPlanFeatureSlabs added successfully.");
                }
              });
            }).catch((error) => {
              console.log("BusinessUserPlanFeatureSlabs added error:", error);
              return;
            });
          }

        }
      });
    }).catch((error) => {
      console.log("BusinessUserPlanFeatures added error:", error);
      return;
    });

    if (addedBusinessUserPlan) {
      const addSubscriptionTransactions = new SubscriptionTransactionsModel();
      addSubscriptionTransactions.transactionDateTime = currentDate;
      addSubscriptionTransactions.businessUserID = post.id;
      addSubscriptionTransactions.oldBusinessUserPlanID = post.businessUserPlanID;
      addSubscriptionTransactions.newBusinessUserPlanID = addedBusinessUserPlan._id;
      addSubscriptionTransactions.transactionType = 'Subscription Plan Changed';
      addSubscriptionTransactions.transactionStatus = 'Processed';
      addSubscriptionTransactions.createdDate = currentDate;
      const addedSubscriptionTransactions = await addSubscriptionTransactions.save();


      const fetchBusinessUser = await BusinessUsers.find({ _id: mongoose.Types.ObjectId(post.businessUserID) })
      const templateQuery = { templateStatus: 'Active', templateName: 'SubscriptionPlanChangeEmailNotification' };
      const fetchedTemplates = await Templates.find(templateQuery);

      if (fetchedTemplates.length > 0) {
        let emailSubject = '';
        let emailBody = '';
        let val = fetchedTemplates[0];
        val.templateSubject = val.templateSubject.replaceAll('[FirstName]', fetchBusinessUser[0].firstName);
        val.templateSubject = val.templateSubject.replaceAll('[LastName]', fetchBusinessUser[0].lastName);
        emailSubject = val.templateSubject;

        val.templateMessage = val.templateMessage.replaceAll('[FirstName]', fetchBusinessUser[0].firstName);
        val.templateMessage = val.templateMessage.replaceAll('[LastName]', fetchBusinessUser[0].lastName);
        val.templateMessage = val.templateMessage.replaceAll('[OldSubscriptionPlan]', post.planName);
        val.templateMessage = val.templateMessage.replaceAll('[NewSubscriptionPlan]', post.newSubscriptionPlan);
        emailBody = val.templateMessage;
        await sendEmail(post.emailAddress, emailSubject, emailBody, "BossFM");
      }

      let successResponse = genericResponse(true, "Plan changed successfully.", []);
      res.status(200).json(successResponse);
    }
    else {
      let successResponse = genericResponse(false, "Found Error", []);
      res.status(200).json(successResponse);
    }

  } catch (error) {
    console.log("Catch in  changeSubscriptionPlan=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const cancelSubscription = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) };
    const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    // var planExpiryDate = new Date(new Date(new Date() - (new Date().getTimezoneOffset() * 60000)).setUTCHours(23, 59, 59, 999));
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
          cancellationType: 1,
          // planActivationDate: "$businessUserPlans.planActivationDate", planExpiryDate: "$businessUserPlans.planExpiryDate",
          planActivationDate: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planActivationDate' } },
          planExpiryDate: { $dateToString: { format: '%Y-%m-%d', date: '$businessUserPlans.planExpiryDate' } },
          planCancellationEffectiveDate: "$businessUserPlans.planExpiryDate",
          planName: "$subscriptionPlans.planName", planPeriod: "$subscriptionPlans.planPeriod", currentPlanID: "$subscriptionPlans._id",
          businessUserPlanID: "$businessUserPlans._id", trialUser: 1, firstName: 1, lastName: 1, emailAddress: 1
        }
      },
      {
        $match: query
      },
      {
        $sort: { businessUserPlanID: -1 }
      }
    ];


    const userData = await BusinessUsers.aggregate(fetchQuery)
    const newChanges = {};
    newChanges.planCancellationReqeustDate = currentDate;
    // newChanges.planCancellationEffectiveDate = new Date(post.planCancellationEffectiveDate);
    newChanges.planCancellationEffectiveDate = userData[0].planCancellationEffectiveDate;
    newChanges.planCancellationNotes = post.planCancellationNotes;
    newChanges.cancellationType = "Self";
    newChanges.recordType = "U";
    newChanges.lastModifiedDate = currentDate;
    let newValue = { $set: newChanges };
    const updateUser = await BusinessUsers.updateOne(query, newValue);

    if (updateUser.nModified === 1) {
      const addSubscriptionTransactions = new SubscriptionTransactionsModel();
      addSubscriptionTransactions.transactionDateTime = currentDate;
      addSubscriptionTransactions.businessUserID = post.businessUserID;
      addSubscriptionTransactions.transactionType = 'Subscription Plan Cancelled';
      addSubscriptionTransactions.transactionStatus = 'Pending';
      addSubscriptionTransactions.transactionNotes = post.planCancellationNotes;
      addSubscriptionTransactions.createdDate = currentDate;
      const addedSubscriptionTransactions = await addSubscriptionTransactions.save();


      const templateQuery = { templateStatus: 'Active', templateName: 'CancellationOfSubscriptionPlanEmailNotification' };
      const fetchedTemplates = await Templates.find(templateQuery);
      if (fetchedTemplates.length > 0) {
        let emailSubject = '';
        let emailBody = '';
        let val = fetchedTemplates[0];
        val.templateSubject = val.templateSubject.replaceAll('[FirstName]', userData[0].firstName);
        val.templateSubject = val.templateSubject.replaceAll('[LastName]', userData[0].lastName);
        emailSubject = val.templateSubject;

        val.templateMessage = val.templateMessage.replaceAll('[FirstName]', userData[0].firstName);
        val.templateMessage = val.templateMessage.replaceAll('[LastName]', userData[0].lastName);
        val.templateMessage = val.templateMessage.replaceAll('[PlanName]', userData[0].planName);
        val.templateMessage = val.templateMessage.replaceAll('[PlanExpiryDate]', userData[0].planExpiryDate);
        emailBody = val.templateMessage;
        await sendEmail(userData[0].emailAddress, emailSubject, emailBody, "BossFM");
      }

      let successResponse = genericResponse(true, "Subscription cancelled successfully.", []);
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
})

const addCard = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) }
    const fetchUser = await BusinessUsers.find(query)

    const card_Token = await stripe.tokens.create({
      card: {
        number: post.cardNumber, // Card number
        exp_month: parseInt(post.expiryMonth), // Expiry month (1-12)
        exp_year: parseInt(post.expiryYear), // Expiry year
        name: post.cardHolderName, // Cardholder's name
        cvc: post.cardCvc // Card verification code (CVV)
      },
    });
    console.log("asdsadsa", card_Token)
    return
    let data = stripe.tokens.create(
      {
        card: {
          number: '4242424242424242',
          exp_month: 12,
          exp_year: 2023,
          cvc: '123'
        }
      },)


    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: post.cardNumber,
        exp_month: parseInt(post.expiryMonth), // Expiry month (1-12)
        exp_year: parseInt(post.expiryYear),
        cvc: post.cardCvc // Card verification code (CVV)
      },
    });





    const cardDetails = {
      source: {
        object: 'card',
        number: post.cardNumber, // Card number
        exp_month: parseInt(post.expiryMonth), // Expiry month (1-12)
        exp_year: parseInt(post.expiryYear), // Expiry year
        name: post.cardHolderName, // Cardholder's name
        cvc: post.cardCvc // Card verification code (CVV)
      }
    };


    const card = await stripe.customers.createSource(
      fetchUser[0].gatewayUserID, cardDetails

    );



    await stripe.customers.update(fetchUser[0].gatewayUserID, {
      invoice_settings: {
        default_payment_method: post.paymentMethodID,
      },
    });


    let successResponse = genericResponse(true, "Data fetched successfully.", []);
    res.status(200).json(successResponse);
  }
  catch (error) {
    console.log("Catch in fetchPlans: ", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});





export {
  addCard, fetchCurrentPlanDetails, fetchSubscriptionPlans, fetchcards, fetchPaymentIntent, cardDelete, setDefaultCard, changeSubscriptionPlan, payWithSavedCard, changeToBasic, cancelSubscription
}