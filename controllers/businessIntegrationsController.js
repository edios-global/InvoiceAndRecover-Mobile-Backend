import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import businessLocation from '../models/businessLocationModel.js';
import mongoose from 'mongoose';
import BusinessIntegrationsModel from '../models/businessIntegrationsModel.js';
import { createRequire } from 'module';
import ReviewRequest from '../models/reviewRequestsModel.js';
import BatchJobsLogsModel from '../models/batchJobsLogsModel.js';
const require = createRequire(import.meta.url);
var OAuthClient = require('intuit-oauth');
let oauthClient = null;
let oauth2_token_json = null;


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

const addISN = asyncHandler(async (req, res) => {
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

const fetchIntegrationData = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = {
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
      businessLocationID: mongoose.Types.ObjectId(post.businessLocationID),
    };
    if (post.searchParameter != undefined && post.searchParameter != '')
      query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);

    let fetchQuery = [
      {
        $project: {
          integrationType: 1, businessUserID: 1, businessLocationID: 1, sessionStatus: 1,
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

const fetchBusinessIntegrationByID = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post._id) }
    const fetchBusinessIntegrationByID = await BusinessIntegrationsModel.findById(query);
    let successResponse = genericResponse(true, "Business Location fetched successfully.", fetchBusinessIntegrationByID);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchBusinessIntegrationByID  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const updateISN = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post._id) }
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

const getQuickBooksDataByCroneJob = asyncHandler(async (req, res) => {
  const postLog = {};
  let processedCount = 0;
  let invoicesCount = 0;
  try {
    postLog.batchJobStartDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    postLog.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    postLog.batchJobName = "QB Hourly Invoice Fetching Job";
    postLog.numberOfProcessedRecords = processedCount;
    postLog.notes = '';
    postLog.batchJobEndDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    postLog.recordType = "I";
    postLog.batchJobStatus = "Inprogress";
    const addBatchJobsLogsModel = new BatchJobsLogsModel(postLog);
    const addedBatchJobsLogsModel = await addBatchJobsLogsModel.save();
    postLog.batchJobsLogsID = addedBatchJobsLogsModel._id;

    var currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    // currentDate = new Date(currentDate.setDate(currentDate.getDate() -12));
    var dateOnly = currentDate.toISOString().substring(0, 10);

    var integrationsQuery = {
      integrationType: "QuickBooks", sessionStatus: "Connected",
    };

    let fetchQuery = [
      {
        $match: integrationsQuery
      },
      {
        $project: {
          businessUserID: 1, businessLocationID: 1, sessionStartDate: 1, sessionEndDate: 1,
          paraValue1: 1, paraValue2: 1, paraValue3: 1, paraValue4: 1, paraValue5: 1, paraValue6: 1, paraValue7: 1, paraValue8: 1,
          paraValue9: 1,
        }
      },
    ];

    const fetchedIntegrations = await BusinessIntegrationsModel.aggregate(fetchQuery);

    if (fetchedIntegrations.length > 0) {

      for (let integration of fetchedIntegrations) {
        oauthClient = new OAuthClient({
          clientId: integration.paraValue1,   // enter the apps `clientId`
          clientSecret: integration.paraValue2,        // enter the apps `clientSecret`
          environment: process.env.QUICK_BOOKS_ENV, // enter either `sandbox` or `production`
          redirectUri: process.env.QUICK_BOOKS_REDIRECT_URL,
        });

        await refreshQuickBooksToken(integration);

        const companyID = oauthClient.getToken().realmId;
        const url = oauthClient.environment == 'sandbox' ? OAuthClient.environment.sandbox : OAuthClient.environment.production;

        const invoiceQuery = `SELECT Id, CustomerRef, DocNumber, TxnDate FROM Invoice WHERE Balance = '0' and TxnDate='${dateOnly}' ORDERBY TxnDate ASC`;
        console.log("invoiceQuery: ", invoiceQuery);

        await oauthClient.makeApiCall({ url: `${url}v3/company/${companyID}/query?query=${invoiceQuery}` })
          .then(async function (authResponse) {
            // console.log('The response for API call is :', JSON.parse(JSON.stringify(authResponse.text())));

            const invoiceData = JSON.parse(authResponse.text()).QueryResponse.Invoice;

            if (invoiceData) {
              var customerIDs = [];
              invoicesCount = invoicesCount + invoiceData.length;

              await invoiceData.forEach((element, index, array) => {
                customerIDs.push(JSON.stringify(element.CustomerRef.value).replaceAll(/"/g, "'"));
              });


              const customerQuery = `select Id, GivenName, FamilyName, DisplayName, Mobile, PrimaryPhone, PrimaryEmailAddr from Customer where Id in (${customerIDs})`;
              await oauthClient.makeApiCall({ url: `${url}v3/company/${companyID}/query?query=${customerQuery}` })
                .then(async function (customerResponse) {
                  const customerData = JSON.parse(customerResponse.text()).QueryResponse.Customer;

                  var formattedCustomerData = [];

                  for (let invoice of invoiceData) {

                    var count = await ReviewRequest.count({ jobID: invoice.DocNumber.toString(), businessUserID: mongoose.Types.ObjectId(integration.businessUserID), businessLocationID: mongoose.Types.ObjectId(integration.businessLocationID) });
                    if (count > 0) {
                      continue;
                    }

                    await customerData.filter(customer => customer.Id === invoice.CustomerRef.value)
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

                        invoice.businessLocationID = integration.businessLocationID;
                        invoice.businessUserID = integration.businessUserID;
                        invoice.customerID = filteredCustomer.Id;
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
                      });

                  }

                  console.log("formattedCustomerData:", formattedCustomerData.length);
                  processedCount = processedCount + formattedCustomerData.length;
                  await ReviewRequest.insertMany(formattedCustomerData, async function (err, data) {
                    if (err != null) {
                      console.log("err here");
                      return console.log(err);
                    }
                    if (data) {
                      console.log("data here");
                      postLog.numberOfProcessedRecords = processedCount;
                      postLog.notes = `${invoicesCount} Invoice(s) Found.`;
                      postLog.batchJobEndDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                      postLog.recordType = "U";
                      postLog.batchJobStatus = "Success";
                      var newValues = { $set: postLog }
                      await BatchJobsLogsModel.updateOne({ _id: mongoose.Types.ObjectId(postLog.batchJobsLogsID) }, newValues);
                      console.log("hrereje.");
                    }
                  });

                }).catch(function (e) {
                  console.error(e);
                  let errorRespnse = genericResponse(false, error.message, []);
                  res.status(400).json(errorRespnse);
                  return;
                });
            }
          }).catch(function (error) {
            console.error(error);
            let errorRespnse = genericResponse(false, error.message, []);
            res.status(400).json(errorRespnse);
            return;
          });

      }

      console.log("abcd");
      if (processedCount === 0) {
        console.log("No Invoice Found.");
        postLog.numberOfProcessedRecords = processedCount;
        postLog.notes = `${invoicesCount} Invoice(s) Found.`;
        postLog.batchJobEndDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        postLog.recordType = "U";
        postLog.batchJobStatus = "Success";
        var newValues = { $set: postLog }
        await BatchJobsLogsModel.updateOne({ _id: mongoose.Types.ObjectId(postLog.batchJobsLogsID) }, newValues);
        let successResponse = genericResponse(true, postLog.notes = `${invoicesCount} Invoice(s) Found.`, []);
        res.status(200).json(successResponse);
        return;
      }
      else {
        let successResponse = genericResponse(true, "Processed Successfully!", []);
        res.status(200).json(successResponse);
        return;
      }

    }
    else {
      console.log("No Quick Books Integration Found.");
      // postLog.batchJobName = "DS Hourly Reviews Fetching Job";
      postLog.numberOfProcessedRecords = processedCount;
      postLog.notes = "No Quick Books Integration Found.";
      postLog.batchJobEndDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      postLog.recordType = "U";
      postLog.batchJobStatus = "Success";
      var newValues = { $set: postLog }
      await BatchJobsLogsModel.updateOne({ _id: mongoose.Types.ObjectId(addBatchJobsLogsModel._id) }, newValues);
      let successResponse = genericResponse(true, "No Quick Books Integration Found.", []);
      res.status(200).json(successResponse);
      return;
    }
  }
  catch (error) {
    console.error("Catch here: ", error);

    postLog.numberOfProcessedRecords = processedCount;
    postLog.notes = error.message;
    postLog.batchJobEndDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    postLog.recordType = "U";
    postLog.batchJobStatus = "Failed";
    var newValues = { $set: postLog }
    await BatchJobsLogsModel.updateOne({ _id: mongoose.Types.ObjectId(postLog.batchJobsLogsID) }, newValues);

    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse)
  }
});

async function refreshQuickBooksToken(integration) {
  try {
    // console.log("integration: ", integration);
    return new Promise(resolve => {
      oauthClient = new OAuthClient({
        clientId: integration.paraValue1,   // enter the apps `clientId`
        clientSecret: integration.paraValue2,        // enter the apps `clientSecret`
        environment: process.env.QUICK_BOOKS_ENV, // enter either `sandbox` or `production`
        redirectUri: process.env.QUICK_BOOKS_REDIRECT_URL,
      });

      let tokenData = {
        access_token: integration.paraValue3,
        refresh_token: integration.paraValue4,
        token_type: integration.paraValue7,
        expires_in: Number.parseInt(integration.paraValue8),
        x_refresh_token_expires_in: Number.parseInt(integration.paraValue5),
        id_token: integration.paraValue6,
        realmId: integration.paraValue9,
      }

      oauthClient.setToken(tokenData);
      oauthClient.refresh().then(async function (authResponse) {
        // console.log(`The Refresh Token is  ${JSON.stringify(authResponse.getJson())}`);
        // let oauth2_token_json = JSON.stringify(authResponse.getJson(), null, 2);
        let oauth2_token_json = JSON.parse(JSON.stringify(authResponse.getJson(), null, 2));
        // console.log("oauth2_token_json: ", oauth2_token_json.access_token);

        integration.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        integration.recordType = 'U';
        integration.paraValue3 = oauth2_token_json.access_token;
        var newValues = { $set: integration }
        await BusinessIntegrationsModel.updateOne({ _id: mongoose.Types.ObjectId(integration._id) }, newValues);
        // res.send(oauth2_token_json);
      }).catch(function (e) {
        console.error("Catch in oauthClient.refresh(): ", e);
      });
      resolve("");
    });
  } catch (error) {
    console.log("Catch in generateSearchParameterList==", error);
  }
};



export {
  addISN, checkIntegrationTypeExistOrNot, fetchIntegrationData, fetchBusinessIntegrationByID, updateISN,
  deleteBusinessIntegration, authUri, generateToken, getQuickBooksData, getQuickBooksDataByCroneJob,
}