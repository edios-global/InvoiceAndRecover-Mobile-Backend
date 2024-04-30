import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import ReviewRequest from '../models/reviewRequestsModel.js';
import sendTwilioMessage, { generateSearchParameterList, sendMail, sendMailBySendGrid, updateToObjectType, uploadCVSFile } from '../routes/genericMethods.js';
import businessLocation from '../models/businessLocationModel.js';
import BusinessUsers from '../models/businessUsersModel.js';
import ReviewRequestsTempdata from '../models/ReviewRequestsTempdataModel.js';
import path from 'path';
import { createRequire } from 'module';
import countryStates from '../models/countryStatesModel.js';
import country from '../models/countryModel.js';
const require = createRequire(import.meta.url);
const csv = require('csvtojson')
const excelToJson = require('convert-excel-to-json');
const XLSX = require('xlsx');
const fs = require('fs');


var mysort = { _id: -1 };

const fetchCommunicationType = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) }
    const fetch = await BusinessUsers.find(query, { defaultSendMethod: 1 });
    const fetchedSelectedLocation = await businessLocation.findById({ _id: mongoose.Types.ObjectId(post.selectedLocationID) });

    let successResponse = genericResponse(true, "Communication Types fetched successfully.", fetch);
    successResponse.fetchedSelectedLocation = fetchedSelectedLocation;
    res.status(200).json(successResponse);
    // res.json(genericResponse(true, '', fetch));
  } catch (error) {
    res.status(200).json(genericResponse(false, error.message, []))
  }
});

// const fetchViewRequestsCount = asyncHandler(async (req, res) => {
//   const post = req.body;
//   try {
//     if (post.duration === "Today") {
//       tommorrowDate.setDate(tommorrowDate.getDate() + 1);
//       var searchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
//     }
//     if (post.duration === "last1Day") {
//       tommorrowDate.setDate(tommorrowDate.getDate() - 1);
//       var searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
//     }
//     if (post.duration === "last7Days") {
//       tommorrowDate.setDate(tommorrowDate.getDate() - 7);
//       var searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
//     }
//     if (post.duration === "last15Days") {
//       tommorrowDate.setDate(tommorrowDate.getDate() - 15);
//       var searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
//     }
//     if (post.duration === "last30Days") {
//       tommorrowDate.setDate(tommorrowDate.getDate() - 30);
//       var searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
//     }
//     if (post.duration === "last6Months") {
//       tommorrowDate.setMonth(tommorrowDate.getMonth() - 6);
//       var searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
//     }
//     if (post.duration === "last1Year") {
//       tommorrowDate.setFullYear(tommorrowDate.getFullYear() - 1);
//       var searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
//     }
//     const query = {};
//     if (post.communicationType !== undefined && post.communicationType !== '') {
//       query.communicationType = post.communicationType;
//     }
//     if (post.businessLocationIDs && post.businessLocationIDs.length > 0) {
//       query.businessLocationID = { $in: await updateToObjectType(post.businessLocationIDs) }
//     }
//     if (post.duration !== undefined && post.duration !== '') {
//       query.sentDateTime = searchDate
//     }
//     if (post.starRatings && post.starRatings.length > 0) {
//       query.responseRating = { $in: post.starRatings }
//     }
//     if (post.action !== undefined && post.action !== '') {
//       if (post.action === "Responded") {
//         query.responseDateTime = { $exists: true }
//       }
//       if (post.action === "NotResponded") {
//         query.responseDateTime = { $exists: false }
//       }
//     }
//     if (post.searchParameter != undefined && post.searchParameter != '') {
//       query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);
//     }
//     const reqCount = await ReviewRequest.countDocuments(query);
//     res.json(genericResponse(true, ' Requests Count successfully', reqCount));
//   } catch (error) {
//     res.status(200).json(genericResponse(false, error.message, []))
//   }
// });

const fetchViewRequests = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    var Date1 = new Date();
    var currentDate = new Date(Date1.setUTCHours(0, 0, 0, 0));
    var tommorrowDate = new Date(Date1.setUTCHours(0, 0, 0, 0));

    var searchDate;
    if (post.duration === "Today") {
      tommorrowDate.setDate(tommorrowDate.getDate() + 1);
      searchDate = { $gte: new Date(currentDate), $lt: new Date(tommorrowDate) }
    }
    if (post.duration === "last1Day") {
      tommorrowDate.setDate(tommorrowDate.getDate() - 1);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration === "last7Days") {
      tommorrowDate.setDate(tommorrowDate.getDate() - 7);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration === "last15Days") {
      tommorrowDate.setDate(tommorrowDate.getDate() - 15);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration === "last30Days") {
      tommorrowDate.setDate(tommorrowDate.getDate() - 30);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration === "last6Months") {
      tommorrowDate.setMonth(tommorrowDate.getMonth() - 6);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }
    if (post.duration === "last1Year") {
      tommorrowDate.setFullYear(tommorrowDate.getFullYear() - 1);
      searchDate = { $gte: new Date(tommorrowDate), $lt: new Date(currentDate.setDate(currentDate.getDate() + 1)) }
    }

    const query = {
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
      businessLocationID: mongoose.Types.ObjectId(post.businessLocationID)
    };

    if (post.communicationType !== undefined && post.communicationType !== '') {
      query.communicationType = post.communicationType;
    }
    if (post.businessLocationIDs && post.businessLocationIDs.length > 0) {
      query.businessLocationID = { $in: await updateToObjectType(post.businessLocationIDs) }
    }
    if (post.duration !== undefined && post.duration !== '') {
      query.sentDateTime = searchDate
    }
    if (post.starRatings && post.starRatings.length > 0) {
      query.responseRating = { $in: post.starRatings }
    }
    if (post.action !== undefined && post.action !== '') {
      if (post.action === "Responded") {
        query.responseDateTime = { $exists: true }
      }
      if (post.action === "NotResponded") {
        query.responseDateTime = { $exists: false }
      }
    }
    if (post.searchParameter != undefined && post.searchParameter != '') {
      query.$or = await generateSearchParameterList(post.searchParameterList, post.searchParameter);
    }

    var options = { month: 'short', day: 'numeric' };
    // orderDateTime1.toLocaleDateString("en-US", options) + " - " + orderDateTime2.toLocaleDateString("en-US", options);

    var fieldsToBeFetched = {
      customerName: { $concat: ["$firstName", " ", "$lastName"] }, businessUserID: 1,
      emailAddress: "$emailAddress",
      phoneNumber: "$phoneNumber",
      communicationType: "$communicationType",
      source: '$requestSource',
      businessLocation: "$location.zipCode",
      // requestSentDateTimeString: { $dateToString: { format: "%d-%m-%Y %H:%M", date: "$requestDateTime" } },
      requestSentDateTimeString: {
        $concat: [
          {
            $let: {
              vars: {
                monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
              },
              in: {
                $arrayElemAt: ['$$monthsInString', { $month: "$requestDateTime" }]
              }
            }
          },
          { $dateToString: { format: "%d", date: "$requestDateTime" } }, ", ",
          { $dateToString: { format: "%Y", date: "$requestDateTime" } },
        ]
      },
      sentDateTime: "$sentDateTime",
      // responseDateTimeString: { $dateToString: { format: "%d-%m-%Y %H:%M", date: "$responseDateTime" } },
      responseDateTimeString: {
        $concat: [
          {
            $let: {
              vars: {
                monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
              },
              in: {
                $arrayElemAt: ['$$monthsInString', { $month: "$responseDateTime" }]
              }
            }
          },
          { $dateToString: { format: "%d", date: "$responseDateTime" } }, ", ",
          { $dateToString: { format: "%Y", date: "$responseDateTime" } },
        ]
      },
      responseRating: "$responseRating",
      responseRatings: { $toString: "$responseRating" },
      requestStatus: "$requestStatus",
      businessLocationID: "$businessLocationID",
      responseDateTime: "$responseDateTime", jobID: "$jobID", customerID: "$customerID"
    };

    const fetchQuery = [
      {
        $lookup: {
          from: "business_locations",
          localField: "businessLocationID",
          foreignField: "_id",
          as: "location"
        }
      },
      { $unwind: "$location" },
      {
        $project: fieldsToBeFetched
      },
      {
        $match: query
      },
    ];

    const fetchedRequestsCount = (await ReviewRequest.aggregate(fetchQuery)).length;
    const fetchedRequests = await ReviewRequest.aggregate(fetchQuery).sort(mysort).skip(post.initialValue).limit(post.finalValue);

    // Fetching All rquest sent between current bill cycle
    var dateRange = { $gte: new Date(post.planActivationDate), $lte: new Date(post.planExpiryDate) };
    const billingCycleRevReqCountQuery = { requestDateTime: dateRange, businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
    const billingCycleRevReqCount = await ReviewRequest.count(billingCycleRevReqCountQuery);
    // let successResponse = genericResponse(true, "Requests fetched successfully.", fetchedRequests);
    let successResponse = genericResponse(true, "Requests fetched successfully.", {
      count: fetchedRequestsCount,
      list: fetchedRequests,
      billingCycleRevReqCount: billingCycleRevReqCount,
    });
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchViewRequests  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const addSendIndividualRequest = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post.businessUserID) }
    post.requestSource = 'Individual';
    // const locationID = post.businessLocationID;
    const addRequest = new ReviewRequest(post);
    addRequest.phoneNumber = post.countryCode + post.phoneNumber;
    addRequest.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    addRequest.createdBy = 0;
    addRequest.recordType = 'I';
    addRequest.requestDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    addRequest.sentDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    addRequest.requestStatus = post.requestStatus;
    const addReviewRequest = await addRequest.save();
    let successResponse = genericResponse(true, "added SendRequest", addReviewRequest);
    if (successResponse.Result_Status === true) {
      let fetchBusinessUsers = await BusinessUsers.find(query);
      const fetchedBusinessLocation = await businessLocation.findOne(
        { businessUserID: post.businessUserID, _id: post.businessLocationID },
        { stateId: 1, countryId: 1, locationStreetAddress: 1, locationCity: 1, zipCode: 1 });
      const fetchState = await countryStates.findOne({ _id: fetchedBusinessLocation.stateId });
      const fetchCountry = await country.findOne({ _id: fetchedBusinessLocation.countryId });
      if (fetchState)
        fetchBusinessUsers[0].companyStateName = fetchState.stateName;
      if (fetchCountry)
        fetchBusinessUsers[0].companyCountryName = fetchCountry.countryName;

      if (fetchBusinessUsers.length > 0) {
        const companyName = fetchBusinessUsers[0].companyName
        let smsTemplate = fetchBusinessUsers[0].smsTemplate;
        let emailTemplateSubject = fetchBusinessUsers[0].emailTemplateSubject;
        let emailTemplateBody = fetchBusinessUsers[0].emailTemplateBody;
        let reviewLink = post.provideFeedbackPageURL + addReviewRequest._id;

        if (post.sendEmail) {
          if (post.communicationType === "SMS" || post.communicationType === "Both") {
            smsTemplate = smsTemplate.replaceAll('[FirstName]', post.firstName);
            smsTemplate = smsTemplate.replaceAll('[LastName]', post.lastName);
            smsTemplate = smsTemplate.replaceAll('[ReviewLink]', reviewLink);
            smsTemplate = smsTemplate.replaceAll('[CompanyName]', companyName);
            await sendTwilioMessage(post.countryCode + post.phoneNumber, smsTemplate);
            let successResponse = genericResponse(true, "Request sent on SMS", addReviewRequest);
            res.status(200).json(successResponse);
          }
          if (post.communicationType === "Email" || post.communicationType === "Both") {
            fetchBusinessUsers[0].feedbackPageText = fetchBusinessUsers[0].feedbackPageText.replaceAll('[FirstName]', post.firstName);
            fetchBusinessUsers[0].feedbackPageText = fetchBusinessUsers[0].feedbackPageText.replaceAll('[LastName]', post.lastName);
            fetchBusinessUsers[0].feedbackPageText = fetchBusinessUsers[0].feedbackPageText.replaceAll('[CompanyName]', companyName);
            let companyWebsiteLink = (fetchBusinessUsers[0].companyWebsite && fetchBusinessUsers[0].companyWebsite.includes('http')) ? fetchBusinessUsers[0].companyWebsite : 'http://' + fetchBusinessUsers[0].companyWebsite;
            emailTemplateSubject = emailTemplateSubject.replaceAll('[FirstName]', post.firstName);
            emailTemplateSubject = emailTemplateSubject.replaceAll('[LastName]', post.lastName);
            emailTemplateSubject = emailTemplateSubject.replaceAll('[CompanyName]', companyName);
            emailTemplateBody = '<body style="background:' + fetchBusinessUsers[0].bgCurrentColor + ';font-family: arial;">' +
              ((fetchBusinessUsers[0].showCompanyPhoneNumber === 0) ? '' : '<p style="text-align:right; font-size: 20px;">Contact No : ' + ((fetchBusinessUsers[0].showCompanyPhoneNumber === 1) ? fetchBusinessUsers[0].companyPhoneNumber : '') + '</p>') +
              '<center>' +
              ((fetchBusinessUsers[0].showCompanyLogo === 1 && fetchBusinessUsers[0].companyLogoFileName) ? '<img src=' + (post.logoURL).concat(fetchBusinessUsers[0].companyLogoFileName) + ' width="400" /> <br/>' : '') +
              ((fetchBusinessUsers[0].showCompanyName === 0) ? '' : '<p style="font-size: 20px;">' + fetchBusinessUsers[0].companyName + '<br/>') +
              '<p>' +
              '<a href="' + reviewLink + "/1" + '" style="font-size:50px;text-decoration:none;color:rgb(249, 185, 89)">☆</a>' +
              '<a href="' + reviewLink + "/2" + '" style="font-size:50px;text-decoration:none;color:rgb(249, 185, 89);margin-left:5px;">☆</a>' +
              '<a href="' + reviewLink + "/3" + '" style="font-size:50px;text-decoration:none;color:rgb(249, 185, 89);margin-left:5px;">☆</a>' +
              '<a href="' + reviewLink + "/4" + '" style="font-size:50px;text-decoration:none;color:rgb(249, 185, 89);margin-left:5px;">☆</a>' +
              '<a href="' + reviewLink + "/5" + '" style="font-size:50px;text-decoration:none;color:rgb(249, 185, 89);margin-left:5px;">☆</a>' +
              '</p>' +
              '<p  style="font-size: 20px;font-weight:bold;">' +
              fetchBusinessUsers[0].feedbackPageText +
              '<p style="font-size: 20px;"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2c3.196 0 6 2.618 6 5.602 0 3.093-2.493 7.132-6 12.661-3.507-5.529-6-9.568-6-12.661 0-2.984 2.804-5.602 6-5.602m0-2c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z"/></svg><br/>' +
              '</p>' +
              fetchedBusinessLocation.locationStreetAddress + ", " + fetchedBusinessLocation.locationCity + "-" + fetchedBusinessLocation.zipCode + ", " +
              fetchBusinessUsers[0].companyStateName + ", " + fetchBusinessUsers[0].companyCountryName + '<br/>' +
              '<a href="' + companyWebsiteLink + '">' + fetchBusinessUsers[0].companyWebsite + '</a>' + '<br/>' +
              '</p>' +
              '<p style="font-size: 12px;">Powered by ReviewArm</p>' +
              '</center>' +
              '</body>';
            // fetchBusinessUsers[0].feedbackPageText;

            await sendMailBySendGrid(post.emailAddress, emailTemplateSubject, emailTemplateBody);
            let successResponse = genericResponse(true, "Request sent on Email", addReviewRequest);
            res.status(200).json(successResponse);
          }
        }
        else {
          let successResponse = genericResponse(true, "Request saved successfully!", addReviewRequest);
          res.status(200).json(successResponse);
        }
      }
      else {
        log.console("error in  fetchBusinessUsers.length == undefined",);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
      }
    }
    else {
      log.console("error in  successResponse.Result_Status == False",)
      let errorRespnse = genericResponse(false, error.message, []);
      res.status(200).json(errorRespnse);
    }
  } catch (error) {
    console.log("error in addSendIndividualRequest  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const checkEmailPhone = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    const checkExitEmail = await ReviewRequest.find({ emailAddress: post.emailAddress, businessUserID: mongoose.Types.ObjectId(post.businessUserID) });
    const checkAlreadyExitNumber = await ReviewRequest.find({ phoneNumber: post.countryCode + post.phoneNumber, businessUserID: mongoose.Types.ObjectId(post.businessUserID) });
    if (checkExitEmail.length > 0) {
      let successResponse = genericResponse(false, "Email is Already Exist", []);
      res.status(200).json(successResponse);
      return;
    }
    if (checkAlreadyExitNumber.length > 0) {
      let successResponse = genericResponse(false, "Phone Number is Already Exist", []);
      res.status(200).json(successResponse);
      return;
    }
    else {
      let successResponse = genericResponse(true, "Email And Phone Number Not Exist", []);
      res.status(200).json(successResponse);
    }
  }
  catch (error) {
    console.log("error in checkEmailPhone  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const excelUploads = asyncHandler(async (req, res) => {
  const post = req.body;
  var filePath = "";
  try {
    var query = {
      businessLocationID: mongoose.Types.ObjectId(post.businessLocationID),
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
      userID: mongoose.Types.ObjectId(post.userID)
    }
    if (req.files) {
      let returnedFileName = await uploadCVSFile(req, "xlsx");
      filePath = returnedFileName;
    }
    await ReviewRequestsTempdata.deleteMany(query);
    if (filePath) {
      const csvFile = path.normalize(process.env.LOCATION_PATH + filePath);
      const Headers = ["FirstName", "LastName", "PhoneNumber", "EmailAddress", "JobID", "CustomerID"];
      var workbook = XLSX.readFile(csvFile);
      var sheet_name_list = workbook.SheetNames;
      const result = excelToJson({
        sourceFile: csvFile,
        columnToKey: {
          A: '{{A1}}',
          B: '{{B1}}',
          C: '{{C1}}',
          D: '{{D1}}',
          E: '{{E1}}',
          F: '{{F1}}'
        },
        sheets: [sheet_name_list[0]]
      });
      var finalResult = Object.values(result)[0];

      if (finalResult.length <= 1000) {
        if (finalResult.length > 0) {
          var excelKeys = Object.keys(finalResult[0]);
          if (excelKeys.length == Headers.length
            && excelKeys.every(function (a, i) {
              return a === Headers[i];
            })) {
            if (finalResult.length > 0) {
              const indexOfObject = finalResult.findIndex(object => {
                return object.FirstName === "FirstName",
                  object.LastName === "LastName",
                  object.PhoneNumber === "PhoneNumber",
                  object.EmailAddress === "EmailAddress",
                  object.JobID === "JobID",
                  object.CustomerID === "CustomerID";
              });

              finalResult.splice(indexOfObject, 1);
              finalResult = finalResult.map(val => {
                return {
                  firstName: val.FirstName,
                  lastName: val.LastName,
                  phoneNumber: val.PhoneNumber,
                  emailAddress: val.EmailAddress,
                  jobID: val.JobID,
                  customerID: val.CustomerID
                }
              });

              finalResult.forEach(element => {
                element.uploadDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
                element.userID = post.userID;
                element.businessUserID = post.businessUserID;
                element.businessLocationID = post.businessLocationID;
                element.communicationType = post.communicationType;
              });
              if (post.communicationType === "Email") {
                finalResult.forEach(element => {
                  if (element.emailAddress === undefined || element.emailAddress == '') {
                    element.requestStatus = "Invalid";
                    element.notes = "Enter a valid Email!"
                  }
                  else if (element.lastName === undefined || element.lastName == '') {
                    element.requestStatus = "Invalid";
                    element.notes = "Last Name is blank!"
                  }
                  else if (element.emailAddress === undefined || element.emailAddress == '') {
                    element.requestStatus = "Invalid";
                    element.notes = "Enter a valid Email!"
                  }
                  else {
                    element.requestStatus = "Valid";
                    element.notes = "Ready to send."
                  }
                });
              }
              if (post.communicationType === "SMS") {
                finalResult.forEach(element => {
                  if (element.phoneNumber === undefined || element.phoneNumber == '' ||
                    element.phoneNumber.length < 13 || (!element.phoneNumber.startsWith('+') && !element.phoneNumber.startsWith('00'))) {
                    element.requestStatus = "Invalid";
                    element.notes = "Enter a valid Phone Number!"
                  }
                  else if (element.lastName === undefined || element.lastName == '') {
                    element.requestStatus = "Invalid";
                    element.notes = "Last Name is blank!"
                  }
                  else if (element.firstName === undefined || element.firstName == '') {
                    element.requestStatus = "Invalid";
                    element.notes = "First Name is blank!"
                  }
                  else {
                    element.requestStatus = "Valid";
                    element.notes = "Ready to send."
                  }
                });
              }
              if (post.communicationType === "Both") {
                finalResult.forEach(element => {
                  if (element.phoneNumber === undefined || element.phoneNumber == '' ||
                    element.phoneNumber.length < 13 || (!element.phoneNumber.startsWith('+') && !element.phoneNumber.startsWith('00'))) {
                    element.requestStatus = "Invalid";
                    element.notes = "Enter a valid Phone Number!"
                  }
                  else if (element.firstName === undefined || element.firstName == '') {
                    element.requestStatus = "Invalid";
                    element.notes = "First Name is blank!"
                  }
                  else if (element.lastName === undefined || element.lastName == '') {
                    element.requestStatus = "Invalid";
                    element.notes = "Last Name is blank!"
                  }
                  else if (element.emailAddress === undefined || element.emailAddress == '') {
                    element.requestStatus = "Invalid";
                    element.notes = "Enter a valid Email!"
                  }
                  else {
                    element.requestStatus = "Valid";
                    element.notes = "Ready to send."
                  }
                });
              }
              const addRequest = ReviewRequestsTempdata.insertMany(finalResult, function (err, data) {
                if (err != null) {
                  return console.log(err);
                }
                if (data) {
                  let successResponse = genericResponse(true, "Excel file uploaded successfully", data.length);
                  res.status(200).json(successResponse);
                }
              });
            }
          }
          else {
            let errorResponse = genericResponse(false, "Field Header Names are not matching. Please refer sample file.", []);
            console.log("errorResponse===", errorResponse);
            res.status(200).json(errorResponse);
          }
        }
        else {
          let errorResponse = genericResponse(false, "No records found in file", []);
          res.status(200).json(errorResponse);
        }
      }
      else {
        let errorResponse = genericResponse(false, "Records can't be more than 1000", []);
        res.status(200).json(errorResponse);
      }
    }
    else {
      let errorResponse = genericResponse(false, "Excel file not found.", []);
      res.status(200).json(errorResponse);
    }
  }
  catch (error) {
    console.log("error in  csvUploads=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchReviewRequestTempData = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    var mysort = { _id: 1 };
    var query = {
      businessLocationID: mongoose.Types.ObjectId(post.businessLocationID),
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
      userID: mongoose.Types.ObjectId(post.userID)
    }
    const fetchCSVData = await ReviewRequestsTempdata.aggregate([
      {
        $match: query
      },
      {
        $project: {
          firstName: 1, lastName: 1, phoneNumber: 1, requestStatus: 1, notes: 1, emailAddress: 1,
          communicationType: 1, jobID: 1, customerID: 1,
        }
      }
    ]).sort(mysort).skip(post.initialValue).limit(post.finalValue);
    const fetchCSVDataCount = await ReviewRequestsTempdata.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: null,
          validCount:
          {
            $sum: {
              $cond: {
                if: {
                  $eq: ["$requestStatus", "Valid"]
                },
                "then": 1,
                "else": 0
              }
            }
          },
          InvalidCount:
          {
            $sum: {
              $cond: {
                if: {
                  $eq: ["$requestStatus", "Invalid"]
                },
                "then": 1,
                "else": 0
              }
            }
          },
          TotalCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0, InvalidCount: 1, validCount: 1, TotalCount: 1
        }
      }
    ]).sort(mysort).skip(post.initialValue).limit(post.finalValue);
    let successResponse = genericResponse(true, "Data fetched successfully.", fetchCSVData);
    if (fetchCSVDataCount.length > 0) {
      successResponse.ValidCount = fetchCSVDataCount[0].validCount;
      successResponse.InvalidCount = fetchCSVDataCount[0].InvalidCount;
      successResponse.TotalCount = fetchCSVDataCount[0].TotalCount;
    }
    res.status(200).json(successResponse);
  }
  catch (error) {
    console.log("error in  fetchReviewRequestTempData=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchReviewRequestTempDataCount = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    var query = {
      businessLocationID: mongoose.Types.ObjectId(post.businessLocationID),
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
      userID: mongoose.Types.ObjectId(post.userID)
    }
    const reqCount = await ReviewRequestsTempdata.countDocuments(query);
    res.json(genericResponse(true, ' Requests Count successfully', reqCount));
  } catch (error) {
    res.status(200).json(genericResponse(false, error.message, []))
  }
});

const addBulkReviewRequest = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    var query = {
      businessLocationID: mongoose.Types.ObjectId(post.businessLocationID),
      businessUserID: mongoose.Types.ObjectId(post.businessUserID),
      userID: mongoose.Types.ObjectId(post.userID), requestStatus: "Valid"
    };
    const fetchCSVData = await ReviewRequestsTempdata.aggregate([
      {
        $match: query
      },
      {
        $project: {
          _id: 0, __v: 0
        }
      }
    ]);
    if (fetchCSVData.length > 0) {
      fetchCSVData.forEach(element => {
        element.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        element.requestSource = "File";
        element.requestStatus = "Requested";
        element.requestDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      });
      const addBulkRequest = await ReviewRequest.insertMany(fetchCSVData, function (err, data) {
        if (err != null) {
          return console.log(err);
        }
        if (data) {
          let successResponse = genericResponse(true, "Request sent sucessfully. Email and SMS will be sent by engine shortly", []);
          res.status(200).json(successResponse);
        }
      });
    }
    else {
      let errorRespnse = genericResponse(false, "There is no valid records found.", []);
      res.status(200).json(errorRespnse);
    }
  } catch (error) {
    console.log("error in  addBulkReviewRequest=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchBuisnessLocations = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), locationStatus: 'Active' };
    let fetchQuery = [
      {
        $match: query
      },
      {
        $lookup: {
          from: "country_states",
          localField: "stateId",
          foreignField: "_id",
          as: "states",
        }
      },
      { $unwind: "$states" },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country"
        }
      },
      { $unwind: "$country" },
      {
        $project: {
          stateNameWithCountry: { $concat: ["$states.stateName", ", ", "$country.countryName"] },
          streetWithCity: { $concat: ["$locationStreetAddress", ", ", "$locationCity"] }, defaultLocation: "$defaultLocation",
        }
      }
    ];
    const businessLocationIDList = await businessLocation.aggregate(fetchQuery).sort({ streetWithCity: 1 });
    let successResponse = genericResponse(true, "fetchBuisnessLocations fetched successfully.", businessLocationIDList);
    res.status(201).json(successResponse);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }

});

export {
  addSendIndividualRequest,
  fetchViewRequests,
  // fetchViewRequestsCount,
  checkEmailPhone,
  fetchCommunicationType,
  excelUploads,
  fetchReviewRequestTempData,
  addBulkReviewRequest,
  fetchReviewRequestTempDataCount,
  fetchBuisnessLocations
}