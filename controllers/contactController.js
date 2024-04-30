import asyncHandler from 'express-async-handler'

import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import { createRequire } from 'module';
import Contacts from '../models/contactModel.js';
import ContactOtherEmails from '../models/contactOtherEmailsModel.js';
import { generateSearchParameterList, uploadImageFile } from '../routes/genericMethods.js';
const require = createRequire(import.meta.url);
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const addContactss = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    if (post.otherEmailAddress) post.otherEmailAddress = post.otherEmailAddress.split(',');
    post.phoneNumber = post.phoneNumber.replace(/[ -]/g, "");
    if (!post)
      return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));
    if (!post.name)
      return res.status(204).json(genericResponse(false, "Contact Person Details: Name can't be blank.", []));
    if (!post.emailAddress)
      return res.status(204).json(genericResponse(false, "Contact Person Details: Email Address can't be blank.", []));
    if (!post.businessUserID)
      return res.status(204).json(genericResponse(false, "Contact Person Details: Business User ID can't be blank.", []));

    const checkIfBusinessNameAlreadyExist = await Contacts.findOne({ name: { '$regex': '^' + post.name.trim() + '$', '$options': 'i' } });
    if (checkIfBusinessNameAlreadyExist) {
      let successResponse = genericResponse(false, "Contact Person Details: Name Already Exist.", []);
      res.status(200).json(successResponse);
      return;
    }
    const checkIfEmailAlredyExist = await Contacts.findOne({ emailAddress: post.emailAddress });
    if (checkIfEmailAlredyExist) {
      let successResponse = genericResponse(false, "Contact Person Details: Email Address Already Exist.", []);
      res.status(200).json(successResponse);
      return;
    }
    if (req.files) {
      let returnedFileName = await uploadImageFile(req, "contactLogoFileName", "contactLogo");
      post.contactLogoFileName = returnedFileName;
      // console.log(post.contactLogoFileName);
    }
    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "I";

    const addedCustomer = await new Contacts(post).save();
    if (addedCustomer._id !== null) {
      // console.log("addedCustomer", addedCustomer._id);
      // if (post.otherEmailAddress.length > 0) {
      //   let otherEmails = {
      //     contactUserID: addedCustomer._id,
      //     createdDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
      //     recordType: "I"
      //   }
      //   console.log("otherEmails", otherEmails);
      //   post.otherEmailAddress.forEach(element => {
      //     if (element !== "") {
      //       console.log("element", element);
      //       otherEmails.otherEmailAddress = element;
      //       new ContactOtherEmails(otherEmails).save();
      //     }
      //   });
      // }
      let successResponse = genericResponse(true, "New Customer added successfully.", []);
      res.status(201).json(successResponse);
      return;
    } else {
      let errorRespnse = genericResponse(false, error.message, []);
      res.status(200).json(errorRespnse);
      return;
    }
  } catch (error) {
    console.log('Error in addContact API: ', error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchContactDetailsByIdss = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (!post) return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));
    if (!post._id) return res.status(204).json(genericResponse(false, "selected contact id is missing.", []));

    const fetchContacts = await Contacts.find({ _id: mongoose.Types.ObjectId(post._id) });
    if (fetchContacts.length > 0) {
      let successResponse = genericResponse(true, "fetchContactsById fetched successfully.", fetchContacts);
      res.status(200).json(successResponse);
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

const updateContactss = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("updateContact post:", post);

    if (!post)
      return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));

    // if (post.otherEmailAddress) post.otherEmailAddress = post.otherEmailAddress.split(',');
    if (req.files) {
      let returnedFileName = await uploadImageFile(req, "contactLogoFileName", "contactLogo");
      post.contactLogoFileName = returnedFileName;
    }
    post.recordType = 'U';
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

    const updateParameter = await Contacts.updateOne({ _id: mongoose.Types.ObjectId(req.body._id) }, { $set: post });

    if (updateParameter.n === 1 || updateParameter.nModified > 0) {
      let responseObject = genericResponse(true, `Contacts Details updated successfully.`, []);
      return res.status(200).json(responseObject);
    } else {
      return res.status(200).json(genericResponse(false, `Contacts Details not updated.`, []));
    }
  } catch (error) {
    console.log("Catch in updateContact:", error)
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchContactss = asyncHandler(async (req, res) => {
  const post = req.body;
  try {
    console.log("fetchContacts post:", post);
    var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
    // const fetched = await Contacts.find(query);

    var sort = {};
    if (post.filterValues != undefined && post.filterValues != '') {
      query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
    }

    let fetchQuery = [
      {
        $project: {
          actions: { _id: "$_id", name: "$name" },
          contactType: "$contactType",
          companyName: "$companyName",
          businessUserID: "$businessUserID",
          name: "$name",
          streetAddress: "$streetAddress",
          phoneNumber: "$phoneNumber",
          emailAddress: "$emailAddress",
          contactStatus: "$contactStatus",
          createdDate: "$createdDate",
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

    if (post.contactStatus !== "All") {
      query.contactStatus = post.contactStatus;
    }
    if (post.contactType !== "All") {
      query.contactType = post.contactType;
    }
    let myAggregation = Contacts.aggregate()
    myAggregation._pipeline = fetchQuery
    Contacts.aggregatePaginate(
      myAggregation,
      options,
      (err, result) => {
        if (err) {
          const errorResponse = genericResponse(false, "Unable to fetch Contacts", []);
          res.status(400).json(errorResponse);

        } else {
          const successResponse = genericResponse(true, "Contacts fetched successfully", result);
          res.status(200).json(successResponse);

        }
      }
    );
  } catch (error) {
    console.log("error in fetch Contacts =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const deleteContacts = asyncHandler(async (req, res) => {
  try {
    // console.log("post", req.body);
    if (req.body._id.length > 0) {
      const fetchedContacts = await Contacts.deleteMany({ _id: { $in: req.body._id } });
      let successResponse = genericResponse(true, "Contact deleted successfully.", []);
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

const fetchContactForMergess = asyncHandler(async (req, res) => {
  try {
    console.log("post", req.body);
    let post = req.body;
    if (!post)
      return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));

    if (!post.businessUserID)
      return res.status(204).json(genericResponse(false, "Business User ID is missing.", []));

    if (!post._id)
      return res.status(204).json(genericResponse(false, "Selected contact user ID is missing.", []));
    let query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), _id: { $ne: mongoose.Types.ObjectId(post._id) } }
    let fetchContactsExceptSelectedID = await Contacts.find(query, { _id: 1, name: 1 });
    console.log("fetchContactsExceptSelectedID", fetchContactsExceptSelectedID);
    if (fetchContactsExceptSelectedID.length > 0) {
      let successResponse = genericResponse(true, "All Contact fetched for merge successfully.", fetchContactsExceptSelectedID);
      return res.status(200).json(successResponse);
    } else {
      let successResponse = genericResponse(false, "Please Select Atleast One Record!", []);
      return res.status(200).json(successResponse);
    }


  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

// Mobile API ------------->

const addContact = asyncHandler(async (req, res) => {
  const post = req.body;

  console.log("files(post)", req.files)
  console.log("addContact(post)", post)

  try {
    if (post.otherEmailAddress !== 'undefined') {
      post.otherEmailAddress = post.otherEmailAddress.split(',');
    }
    // if (post.phoneNumber) {
    //   post.phoneNumber = post.phoneNumber.replace(/[ -]/g, "");
    // }
    if (!post)
      return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));
    if (!post.name)
      return res.status(204).json(genericResponse(false, "Contact Person Details: Name can't be blank.", []));
    if (!post.emailAddress)
      return res.status(204).json(genericResponse(false, "Contact Person Details: Email Address can't be blank.", []));
    if (!post.businessUserID || post.businessUserID === 'undefined') {
      let errorMessage = "Contact Person Details: Business User ID can't be ";
      errorMessage += post.businessUserID ? "blank." : "undefined.";
      let errorResponse = genericResponse(false, errorMessage, []);
      return res.status(204).json(errorResponse);
    }

    const checkIfBusinessNameAlreadyExist = await Contacts.findOne({ businessUserID: mongoose.Types.ObjectId(post.businessUserID), name: { '$regex': '^' + post.name.trim() + '$', '$options': 'i' } });
    if (checkIfBusinessNameAlreadyExist) {
      let successResponse = genericResponse(false, "Contact Person Details: Name Already Exist.", []);
      res.status(200).json(successResponse);
      return;
    }
    const checkIfEmailAlredyExist = await Contacts.findOne({ businessUserID: mongoose.Types.ObjectId(post.businessUserID), emailAddress: post.emailAddress });
    if (checkIfEmailAlredyExist) {
      let successResponse = genericResponse(false, "Contact Person Details: Email Address Already Exist.", []);
      res.status(200).json(successResponse);
      return;
    }

    if (post.file !== "undefined") {
      if (req.files) {
        let returnedFileName = await uploadImageFile(req, "contactLogoFileName", "contactLogo");
        post.contactLogoFileName = returnedFileName;
        console.log(post.contactLogoFileName);
      }
    }

    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "I";
    post.contactStatus = "Active";
    console.log("post1", post);
    const addedCustomer = await new Contacts(post).save();

    if (addedCustomer._id !== null) {
      console.log("addedCustomer", addedCustomer._id);
      if (post.otherEmailAddress !== "undefined") {
        if (post.otherEmailAddress.length > 0) {

          let otherEmails = {
            contactUserID: addedCustomer._id,
            createdDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
            recordType: "I"
          }
          console.log("otherEmails", otherEmails);
          post.otherEmailAddress.forEach(element => {
            if (element !== "") {
              console.log("element", element);
              otherEmails.otherEmailAddress = element;
              new ContactOtherEmails(otherEmails).save();
            }
          });
        }
      }
      let successResponse = genericResponse(true, "New Contact added successfully.", []);
      res.status(201).json(successResponse);

    } else {
      let errorRespnse = genericResponse(false, error.message, []);
      res.status(200).json(errorRespnse);
      return;
    }
  } catch (error) {
    console.log('Error in addContact API: ', error.message);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchContacts = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log('fetchContacts(post)', post)
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    if (!post.businessUserID || post.businessUserID === 'undefined') {
      console.log('Business User ID ISSUE')
      let errorMessage = " Business User ID can't be ";
      errorMessage += post.businessUserID ? "blank." : "undefined.";
      let errorResponse = genericResponse(false, errorMessage, []);
      return res.status(204).json(errorResponse);
    }
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }

    const fetchUser = await Contacts.find(query)
    // const fetchUser = await Contacts.aggregate([
    //   {
    //     $match: query
    //   },
    //   {
    //     $project: {
    //       categoryName: "$categoryName",
    //       categoryCode: "$categoryCode",
    //       categoryStatus: "$categoryStatus",
    //     }
    //   },

    // ])

    let successResponse = genericResponse(true, "fetchContacts fetched successfully.", fetchUser);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchContacts=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchContactDetailsById = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (!post) return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));
    if (!post._id) return res.status(204).json(genericResponse(false, "selected contact id is missing.", []));

    const fetchContacts = await Contacts.find({ _id: mongoose.Types.ObjectId(post._id) });
    if (fetchContacts.length > 0) {
      let successResponse = genericResponse(true, "fetchContactsById fetched successfully.", fetchContacts);
      res.status(200).json(successResponse);
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

const updateContact = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("updateContact post:", post);

    if (!post)
      return res.status(204).json(genericResponse(false, "Request Payload Data is null", []));

    if (post.otherEmailAddress) post.otherEmailAddress = post.otherEmailAddress.split(',');


    const checkIfBusinessNameAlreadyExist = await Contacts.findOne({ _id: { $ne: mongoose.Types.ObjectId(post.ContactsID) }, name: { '$regex': '^' + post.name.trim() + '$', '$options': 'i' } });
    console.log("checkIfBusinessNameAlreadyExist:", checkIfBusinessNameAlreadyExist);
    if (checkIfBusinessNameAlreadyExist !== null) {
      let successResponse = genericResponse(false, "Contact Person Details: Name Already Exist.", []);
      res.status(200).json(successResponse);
      return;
    }
    const checkIfEmailAlredyExist = await Contacts.findOne({ _id: { $ne: mongoose.Types.ObjectId(post.ContactsID) }, emailAddress: post.emailAddress });
    if (checkIfEmailAlredyExist !== null) {
      let successResponse = genericResponse(false, "Contact Person Details: Email Address Already Exist.", []);
      res.status(200).json(successResponse);
      return;
    }

    if (req.files) {
      let returnedFileName = await uploadImageFile(req, "contactLogoFileName", "contactLogo");
      post.contactLogoFileName = returnedFileName;
    }
    post.recordType = 'U';
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    console.log("post:", post);
    const updateParameter = await Contacts.updateOne({ _id: mongoose.Types.ObjectId(post.ContactsID) }, { $set: post });

    if (updateParameter.n === 1 || updateParameter.nModified > 0) {

      // if (post.otherEmailAddress.length > 0) {
      //   let otherEmails = {
      //     contactUserID: req.body._id,
      //     lastModifiedDate: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
      //     recordType: "U"
      //   }
      //   console.log("otherEmails", otherEmails);
      //   post.otherEmailAddress.forEach(element, async => {
      //     if (element !== "") {
      //       console.log("element", element);
      //       otherEmails.otherEmailAddress = element;
      //       const update = await ContactOtherEmails.updateOne({ _id: mongoose.Types.ObjectId(req.body._id) }, { $set: otherEmails });

      //     }
      //   });
      // }

      let responseObject = genericResponse(true, `Contacts Details updated successfully.`, []);
      return res.status(200).json(responseObject);
    } else {
      return res.status(200).json(genericResponse(false, `Contacts Details not updated.`, []));
    }
  } catch (error) {
    console.log("Catch in updateContact:", error)
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const deleteContact = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    console.log("deleteContact ID ==> ", post._id)
    const query = { _id: mongoose.Types.ObjectId(post._id) };
    if (post._id !== undefined && post._id !== '') {
      await Contacts.deleteOne(query);
      res.status(201).json(genericResponse(true, "Contact is deleted successfully", []));
    }
    else
      res.status(400).json(genericResponse(false, "Contact is not found", []));
  } catch (error) {
    console.log("Catch in deleteContact:", error);
    res.status(400).json(genericResponse(false, error.message, []));
  }
});

const fetchContactName = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (post.signatureKey !== process.env.SIGNATURE_KEY) {
      return res.status(401).json(genericResponse(false, 'Invalid Signature Key!', []));
    }
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), contactStatus: "Active" }
    const fetchContact = await Contacts.aggregate([
      {
        $match: query
      },
      {
        $project: {
          companyName: 1,
        }
      }
    ]);
    let successResponse = genericResponse(true, "ContactName fetched successfully.", fetchContact);
    res.status(200).json(successResponse);
  }
  catch (error) {
    let errorResponse = genericResponse(false, error.message, []);
    res.status(500).json(errorResponse);
  }
});

export {
  addContact,
  fetchContacts,
  deleteContact,
  fetchContactDetailsById,
  updateContact,
  fetchContactName

  // fetchContactForMerge
}
