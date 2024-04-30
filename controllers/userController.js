import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import Users from '../models/UsersModel.js';
import { encryptPassword, generatePassword, generateSearchParameterList, sendMail, sendMailBySendGrid, uploadImageFile } from '../routes/genericMethods.js';
import Roles from '../models/rolesModel.js';
import Templates from '../models/templatesModel.js';
import path from 'path';
import { createRequire } from 'module';
import BusinessUsers from '../models/businessUsersModel.js';
import Employee from '../models/employeeBfmModel.js';
const require = createRequire(import.meta.url);

const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    let updateData = {};
    console.log("post(updateUserProfile)", post)
    if (post.companyName !== "" && post.companyName !== undefined) {
      const checkcompanyNameExist = await BusinessUsers.find({ emailAddress: { $ne: post.emailAddress }, companyName: { '$regex': '^' + post.companyName.trim() + '$', '$options': 'i' } });
      if (checkcompanyNameExist.length > 0) {
        let successResponse = genericResponse(false, "Company Name Already Exist.", []);
        res.status(201).json(successResponse);
        return;
      }
    }
    if (post.phoneNumber !== "" && post.phoneNumber !== undefined) {
      updateData.phoneNumber = post.phoneNumber
      const mobileNumberExist = await BusinessUsers.find({ emailAddress: { $ne: post.emailAddress }, phoneNumber: post.phoneNumber });
      if (mobileNumberExist.length > 0) {
        let successResponse = genericResponse(false, "Mobile Number Already Exist.", []);
        res.status(201).json(successResponse);
        return;
      }

    }

    if (post.userType === 'Business' || post.userType === 'Admin') {

      var query = { _id: mongoose.Types.ObjectId(post._id) }
      if (post.confirmPassword) {
        post.userPassword = post.confirmPassword;
        await encryptPassword(post.userPassword).then(async data => {
          post.userPassword = data;
          var query = { emailAddress: post.emailAddress, userPassword: post.userPassword };
          const users = await Users.find(query);
          if (users.length > 0) {
            let errorRespnse = genericResponse(false, "New Password can't be same as Current Password.", []);
            res.status(200).json(errorRespnse);
            return;
          }
        })
          .catch((error) => {
            console.log("Password encryption error:", error);
            return;
          });
      }

      const fetchUsers = await Users.find(query);
      if (req.files) {
        let returnedFileName = await uploadImageFile(req, "profilePictureFileName");
        post.profilePictureFileName = returnedFileName;
      }
      post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      post.recordType = "U";
      var newValues = { $set: post };
      await Users.updateOne(query, newValues);

      if (post.userType === 'Business') {

        updateData.companyName = post.companyName;
        updateData.firstName = post.firstName;
        updateData.lastName = post.lastName;
        if (post.streetAddress !== 'undefined' || post.streetAddress !== '') {
          updateData.companyStreetAddress = post.streetAddress;
          updateData.companyCity = post.city
          updateData.companyZipCode = post.zipCode
          updateData.companyStateId = post.stateId
          updateData.companyCountryId = post.countryId
        }

        updateData.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        updateData.recordType = "U";
        var newValues = { $set: updateData };
        var querys = { emailAddress: fetchUsers[0].emailAddress }
        console.log("querys", querys, updateData)
        await BusinessUsers.updateOne(querys, newValues);
      }



      let successResponse = genericResponse(true, "User Profile updated successfully.", []);
      res.status(200).json(successResponse);
      return;

    } else if (post.userType === 'Warehouse') {
      var query = { _id: mongoose.Types.ObjectId(post._id) }
      if (post.confirmPassword) {
        post.userPassword = post.confirmPassword;
        await encryptPassword(post.userPassword).then(async data => {
          post.userPassword = data;
          var query = { emailAddress: post.emailAddress, userPassword: post.userPassword };
          const users = await Users.find(query);
          if (users.length > 0) {
            let errorRespnse = genericResponse(false, "New Password can't be same as Current Password.", []);
            res.status(200).json(errorRespnse);
            return;
          }
        })
          .catch((error) => {
            console.log("Password encryption error:", error);
            return;
          });
      }

      const fetchUsers = await Users.find(query);
      if (req.files) {
        let returnedFileName = await uploadImageFile(req, "profilePictureFileName");
        post.profilePictureFileName = returnedFileName;
      }
      post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      post.recordType = "U";
      var newValues = { $set: post };
      await Users.updateOne(query, newValues);

      let updateData = {};
      updateData.companyName = post.companyName;

      updateData.firstName = post.firstName;
      updateData.lastName = post.lastName;
      if (post.streetAddress !== 'undefined') {
        updateData.streetAddress = post.streetAddress;
        updateData.city = post.city
        updateData.zipCode = post.zipCode
        updateData.stateId = post.stateId
        updateData.countryId = post.countryId
      }
      updateData.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
      updateData.recordType = "U";
      var newValues = { $set: updateData };
      var querys = { _id: fetchUsers[0].employeeID }
      console.log("querys", querys)
      await Employee.updateOne(querys, newValues);

      let successResponse = genericResponse(true, "User Profile updated successfully.", []);
      res.status(200).json(successResponse);
      return;
    }

  } catch (error) {
    console.log("error in  update User Profile =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const addNewUser = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    // return;
    var query1 = { emailAddress: post.emailAddress };
    const checkIfEmailAlredyExist = await Users.find(query1);
    if (checkIfEmailAlredyExist.length > 0) {
      let successResponse = genericResponse(false, "Email Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    const password = await generatePassword();
    // post.userPassword = password;
    await encryptPassword(password).then(data => {
      post.userPassword = data;
    })
      .catch((error) => {
        console.log("Password encryption error:", error);
        return;
      });
    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "I";
    const newUser = new Users(post);
    const addUser = await newUser.save();

    let emailSubject = '';
    let emailBody = '';
    const templateQuery = { templateStatus: 'Active', templateName: 'NewSuperAdminUserEmailNotification' };
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
  } catch (error) {
    console.log("error in  addNewUser Controller =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchUserProfilea = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post._id) }

    const fetchUserProfile = await Users.findById(query, {
      firstName: 1, lastName: 1, emailAddress: 1, phoneNumber: 1, businessUserID: 1, userType: 1,
      profilePictureFileName: 1,
      // userPassword: 1, 
    });
    let successResponse = genericResponse(true, "User Profile fetched successfully.", fetchUserProfile);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in  fetch User Profile =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchUserProfile1 = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { _id: mongoose.Types.ObjectId(post._id) }
    console.log("query", query)
    const fetchCustomer = [
      {
        $match: query
      },
      {
        $lookup: {
          from: "business_users",
          localField: "businessUserID",
          foreignField: "_id",
          as: "businessUsers"
        }
      },
      // { $unwind: "$businessUsers" },
      {
        $unwind: {
          path: "$businessUsers",
          preserveNullAndEmptyArrays: true // Preserve documents even if there's no match
        }
      },
      {
        $lookup: {
          from: "country_states",
          localField: "businessUsers.companyStateId",
          foreignField: "_id",
          as: "states"
        }
      },
      // { $unwind: "$states" },
      {
        $unwind: {
          path: "$states",
          preserveNullAndEmptyArrays: true // Preserve documents even if there's no match
        }
      },
      {
        $lookup: {
          from: "countries",
          localField: "businessUsers.companyCountryId",
          foreignField: "_id",
          as: "countries"
        }
      },
      // { $unwind: "$countries" },
      {
        $unwind: {
          path: "$countries",
          preserveNullAndEmptyArrays: true // Preserve documents even if there's no match
        }
      },

      {
        $project: {
          firstName: 1,
          lastName: 1,
          emailAddress: 1,
          phoneNumber: 1,
          businessUserID: 1,
          userType: 1,
          profilePictureFileName: 1,
          companyName: "$businessUsers.companyName",
          streetAddress: "$businessUsers.companyStreetAddress",
          zipCode: "$businessUsers.companyZipCode",
          city: "$businessUsers.companyCity",
          countryName: "$countries.countryName",
          stateName: "$states.stateName",
          countryId: "$businessUsers.companyCountryId",
          stateId: "$businessUsers.companyStateId",
        },
      },


    ]
    const fetchUserProfile = await Users.aggregate(fetchCustomer);
    let successResponse = genericResponse(true, "User Profile fetched successfully.", fetchUserProfile);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in  fetch User Profile =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchUserProfile = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log("post", post)
    var query = { _id: mongoose.Types.ObjectId(post._id) }
    console.log("query", query)
    const fetchCustomer = [
      {
        $match: query
      },
      {
        $lookup: {
          from: "business_users",
          localField: "businessUserID",
          foreignField: "_id",
          as: "businessUsers"
        }
      },
      // { $unwind: "$businessUsers" },
      {
        $unwind: {
          path: "$businessUsers",
          preserveNullAndEmptyArrays: true // Preserve documents even if there's no match
        }
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeID",
          foreignField: "_id",
          as: "employee"
        }
      },
      {
        $unwind: {
          path: "$employee",
          preserveNullAndEmptyArrays: true // Preserve documents even if there's no match
        }
      },

      {
        $lookup: {
          from: "country_states",
          localField: "businessUsers.companyStateId",
          foreignField: "_id",
          as: "states"
        }
      },
      // { $unwind: "$states" },
      {
        $unwind: {
          path: "$states",
          preserveNullAndEmptyArrays: true // Preserve documents even if there's no match
        }
      },
      {
        $lookup: {
          from: "countries",
          localField: "businessUsers.companyCountryId",
          foreignField: "_id",
          as: "countries"
        }
      },
      // { $unwind: "$countries" },
      {
        $unwind: {
          path: "$countries",
          preserveNullAndEmptyArrays: true // Preserve documents even if there's no match
        }
      },
      {
        $lookup: {
          from: "country_states",
          localField: "employee.stateId",
          foreignField: "_id",
          as: "statesEmployee"
        }
      },
      // { $unwind: "$states" },
      {
        $unwind: {
          path: "$statesEmployee",
          preserveNullAndEmptyArrays: true // Preserve documents even if there's no match
        }
      },
      {
        $lookup: {
          from: "countries",
          localField: "employee.countryId",
          foreignField: "_id",
          as: "countriesEmployee"
        }
      },
      // { $unwind: "$countries" },
      {
        $unwind: {
          path: "$countriesEmployee",
          preserveNullAndEmptyArrays: true // Preserve documents even if there's no match
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          emailAddress: 1,
          phoneNumber: 1,
          businessUserID: 1,
          userType: 1,
          profilePictureFileName: 1,
          companyName: "$businessUsers.companyName",
          streetAddress: {
            $cond: {
              if: { $eq: ["$userType", "Business"] },
              then: "$businessUsers.companyStreetAddress",
              else: "$employee.streetAddress", // or you can specify a default value if needed
            }
          },

          zipCode: {
            $cond: {
              if: { $eq: ["$userType", "Business"] },
              then: "$businessUsers.companyZipCode",
              else: "$employee.zipCode",
              // else: { $arrayElemAt: ["$employee.zipCode", 0] },
            }
          },
          city: {
            $cond: {
              if: { $eq: ["$userType", "Business"] },
              then: "$businessUsers.companyCity",
              else: "$employee.city" // or you can specify a default value if needed
            }
          },
          countryName: {
            $cond: {
              if: { $eq: ["$userType", "Business"] },
              then: "$countries.countryName",
              else: "$countriesEmployee.countryName" // or you can specify a default value if needed
            }
          },
          stateName: {
            $cond: {
              if: { $eq: ["$userType", "Business"] },
              then: "$states.stateName",
              else: "$statesEmployee.stateName" // or you can specify a default value if needed
            }
          },
          countryId: {
            $cond: {
              if: { $eq: ["$userType", "Business"] },
              then: "$businessUsers.companyCountryId",
              else: "$employee.countryId" // or you can specify a default value if needed
            }
          },
          stateId: {
            $cond: {
              if: { $eq: ["$userType", "Business"] },
              then: "$businessUsers.companyStateId",
              else: "$employee.stateId" // or you can specify a default value if needed
            }
          }
        },
      },



    ]
    const fetchUserProfile = await Users.aggregate(fetchCustomer);
    let successResponse = genericResponse(true, "User Profile fetched successfully.", fetchUserProfile);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in  fetch User Profile =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const viewFile = asyncHandler(async (req, res) => {
  try {
    let fileName = req.query.fileName;
    var options = {
      root: process.env.LOCATION_PATH,
      dotfiles: 'deny',
      headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
      },
      status: genericResponse(true, "File viewed successfully.", [])
    }

    res.sendFile(fileName, options, function (error) {
      try {

        if (error) {
          let errorRespnse = genericResponse(false, error.message, []);
          res.status(200).json(errorRespnse);
        }
      } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
      }
    })
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(200).json(errorRespnse);
  }
});

const fetchRoles = asyncHandler(async (req, res) => {
  try {

    const fetchRoles = await Roles.find({ applicableForBusinessUser: "No" });
    let successResponse = genericResponse(true, "Roles fetched successfully.", fetchRoles);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchRoles  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
})

const fetchUserCount = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    var query = { userType: post.userType };
    const userCount = await Users.countDocuments(query);
    res.json(genericResponse(true, 'User count fetched successfully', userCount));
  } catch (error) {
    res.status(200).json(genericResponse(false, error.message, []))
  }
});

// const fetchUser = asyncHandler(async (req, res) => {
//   try {
//     const post = req.body;
//     const query = { userType: 'Admin' }
//     const fetchUser = await Users.aggregate([
//       {
//         $match: query
//       },
//       {
//         $lookup: {
//           from: "roles",
//           localField: "roleID",
//           foreignField: "_id",
//           as: "roles"
//         }
//       },
//       { $unwind: "$roles" },
//       {
//         $project: {
//           fullNameString: { fullName: { $concat: ["$firstName", " ", "$lastName"] } },
//           emailAddress: "$emailAddress",
//           userStatus: "$userStatus",
//           role: "$roles.roleName",
//           userType: "$userType",
//         }
//       }
//     ])
//     let successResponse = genericResponse(true, "Users fetched successfully.", fetchUser);
//     res.status(200).json(successResponse);
//   } catch (error) {
//     console.log("error in fetchUser  =", error);
//     let errorRespnse = genericResponse(false, error.message, []);
//     res.status(400).json(errorRespnse);
//   }
// });

// const fetchUser = asyncHandler(async (req, res) => {
//   try {
//     const post = req.body;

//     var query = { userType: 'Admin' };

//     var sort = {};
//     if (post.filterValues != undefined && post.filterValues != '')
//       query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);

//     let fetchQuery = [

//       {
//         $lookup: {
//           from: "roles",
//           localField: "roleID",
//           foreignField: "_id",
//           as: "roles"
//         }
//       },
//       { $unwind: "$roles" },
//       {
//         $project: {
//           fullNameString: { fullName: { $concat: ["$firstName", " ", "$lastName"] } },
//           emailAddress: "$emailAddress",
//           userStatus: "$userStatus",
//           userType: "$userType",
//           role: "$roles.roleName",
//           businessUserID: "$businessUserID",
//           userType: "$userType",
//           profilePictureFileName: "$profilePictureFileName"
//         }
//       },
//       { $match: query }
//     ];

//     if (post.sortingType && post.sortingField) {
//       var sortField = post.sortingField;
//       sort[sortField] = post.sortingType;

//       fetchQuery.push({ $sort: sort });
//     } else {
//       sort = { createdDate: -1 }
//     }
//     let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
//     if (post.userStatus !== "All") {
//       query.userStatus = post.userStatus;
//       fetchQuery.push({ $match: query });
//     }

//     let myAggregation = Users.aggregate()
//     myAggregation._pipeline = fetchQuery
//     Users.aggregatePaginate(
//       myAggregation,
//       options,
//       (err, result) => {
//         if (err) {
//           const errorResponse = genericResponse(false, "Unable to fetch", []);
//           res.status(400).json(errorResponse);

//         } else {
//           const successResponse = genericResponse(true, "My Users fetched successfully", result);
//           res.status(200).json(successResponse);

//         }
//       }
//     );

//   } catch (error) {
//     console.log("error in fetchUser  =", error);
//     let errorRespnse = genericResponse(false, error.message, []);
//     res.status(400).json(errorRespnse);
//   }
// });

const fetchBusinessUser = asyncHandler(async (req, res) => {
  try {
    const post = req.body
    // console.log("sbdnbjfd", post)
    // return
    const query1 = { businessUserID: mongoose.Types.ObjectId(post.businessUserID), userType: 'Business' };
    let fetchQuery = [
      {
        $match: query1
      },
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
          role: "$roles.roleName",
          profilePictureFileName: "$profilePictureFileName"
        }
      }
    ];

    const usersCount = (await Users.aggregate(fetchQuery)).length;
    const usersList = await Users.aggregate(fetchQuery).sort({ _id: -1 })
    let successResponse = genericResponse(true, "Users fetched successfully.", usersList);
    res.status(200).json(successResponse);

  } catch (error) {
    console.log("error in fetchUser  =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});



const updateUsers = asyncHandler(async (req, res) => {
  try {
    const post = req.body;

    const emailQuery = {
      _id: { $ne: mongoose.Types.ObjectId(req.body._id) },
      emailAddress: { '$regex': '^' + req.body.emailAddress.trim() + '$', '$options': 'i' }
    };
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


// const deleteUser = asyncHandler(async (req, res) => {
//   const post = req.body;
//   try {
//     const query = { _id: mongoose.Types.ObjectId(post._id) }
//     if (post._id != undefined && post._id != '') {
//       await Users.deleteOne(query);
//       res.status(201).json(genericResponse(true, 'User deleted sucessfully', []))
//     }
//     else
//       res.status(400).json(genericResponse(false, 'User is  not found', []))
//   } catch (error) {
//     res.status(400).json(genericResponse(false, error.message, []))
//   }

// });


const deleteUsers = asyncHandler(async (req, res) => {
  try {
    if (req.body._id.length > 0) {
      const User = await Users.deleteMany({ _id: { $in: req.body._id } });
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


const downloadPDFFile = asyncHandler(async (req, res) => {
  try {
    console.log("API downloadPDFFile");
    let fs = require('fs');
    const fileName = req.query.fileName;
    const filePath = path.join(process.env.LOCATION_PATH, fileName);

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    const stream = fs.createReadStream(filePath);
    stream.on('open', () => {
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Length', fileSize);
      stream.pipe(res);
    });

    stream.on('error', (error) => {
      if (error.code === 'ECONNABORTED') {
        console.error('Error: Request aborted');
      } else {
        console.error('Error occurred while downloading file:', error);
      }
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
      }
    });

    stream.on('end', () => {
      console.log('File download completed successfully.');
    });
  } catch (error) {
    console.error('Error occurred while fetching PDF:', error.message);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
});

const deleteQR_PDFFile = asyncHandler(async (req, res) => {
  try {
    var fs = require("fs");
    fs.unlink(
      process.env.LOCATION_PATH + `/pdfFiles/${req.body.fileName}`,
      function (err) {
        // fs.unlink(process.env.LOCATION_PATH + `/${req.body.fileName}`, function (err) {
        if (err) {
          throw err;
        }
        // if no error, file has been deleted successfully
      }
    );

    console.log("in deleteQR_PDFFile",);
    let successResponse = genericResponse(
      true,
      "File Deleted successfully.",
      []
    );
    res.status(200).json(successResponse);
  } catch (error) {
    let errorRespnse = genericResponse(false, error.message, []);
    console.log("error.in deleteQR_PDFFile", error.message);
    res.status(201).json(errorRespnse);
  }
});


// Mobile API ------------->

const fetchUsers = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    const query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) }
    const fetchUser = await Users.aggregate([
      {
        $match: query
      },
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
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
          firstName: "$firstName",
          lastName: "$lastName",
          emailAddress: "$emailAddress",
          userStatus: "$userStatus",
          role: "$roles.roleName",
        }
      },
    ])

    let successResponse = genericResponse(true, "Users fetched successfully.", fetchUser);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in fetchUsers=", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const addUser = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    console.log('addUser(post)', post);

    var query1 = { emailAddress: post.emailAddress };
    const checkIfEmailAlredyExist = await Users.find(query1);
    if (checkIfEmailAlredyExist.length > 0) {
      let successResponse = genericResponse(false, "Email Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }
    const password = await generatePassword();
    post.userPassword = password;
    await encryptPassword(password).then(data => {
      post.userPassword = data;
    })
      .catch((error) => {
        console.log("Password encryption error:", error);
        return;
      });
    post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    post.recordType = "I";
    post.userType = "Business";
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
      let successResponse = genericResponse(true, "New User added successfully.", []);
      res.status(200).json(successResponse);
      // if (addUser.length > 0) {
      //   let successResponse = genericResponse(true, "New User added successfully.", []);
      //   res.status(200).json(successResponse);
      // } else {
      //   let successResponse = genericResponse(false, "New User Error.", []);
      //   res.status(200).json(successResponse);
      // }
    }
    else {
      let successResponse = genericResponse(false, "Email Template Error.", []);
      res.status(200).json(successResponse);
    }
  } catch (error) {
    console.log("error in  addNewUser Controller =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const fetchUserById = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    const query = { _id: mongoose.Types.ObjectId(post._id) }
    const fetchUserById = await Users.findById(query);
    fetchUserById.userPassword = undefined;
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
    console.log("gfh", post)
    const checkIfEmailAlredyExist = await Users.find({ _id: { $ne: mongoose.Types.ObjectId(req.body.userID) }, emailAddress: { '$regex': '^' + req.body.emailAddress.trim() + '$', '$options': 'i' } });
    console.log("checkIfEmailAlredyExist", checkIfEmailAlredyExist)
    if (checkIfEmailAlredyExist.length > 0) {
      let successResponse = genericResponse(false, "Email Address Already Exist.", []);
      res.status(201).json(successResponse);
      return;
    }

    const query = { _id: mongoose.Types.ObjectId(post.userID) }
    post.recordType = "U";
    post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
    let newValue = { $set: post };
    const updateUser = await Users.updateOne(query, newValue);
    let successResponse = genericResponse(true, " User updated successfully.", []);
    res.status(200).json(successResponse);
  } catch (error) {
    console.log("error in  updateUser =", error);
    let errorRespnse = genericResponse(false, error.message, []);
    res.status(400).json(errorRespnse);
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  try {
    const post = req.body;
    if (post.signatureKey !== process.env.SIGNATURE_KEY) return res.status(200).json(genericResponse(false, 'Invalid Signature Key!', []));
    console.log("deleteUser ID ==> ", post._id)
    const query = { _id: mongoose.Types.ObjectId(post._id) };
    if (post._id !== undefined && post._id !== '') {
      await Users.deleteOne(query);
      res.status(201).json(genericResponse(true, "User is deleted successfully", []));
    }
    else
      res.status(202).json(genericResponse(false, "User is not found", []));
  } catch (error) {
    console.log("Catch in deleteUser:", error);
    res.status(400).json(genericResponse(false, error.message, []));
  }
});

export {
  updateUserProfile,
  fetchUserProfile,
  fetchUserCount,
  viewFile,
  addNewUser,
  fetchRoles,
  fetchBusinessUser,
  downloadPDFFile,
  deleteQR_PDFFile,

  // Mobile API ------------->
  fetchUsers,
  addUser,
  fetchUserById,
  updateUser,
  deleteUser,
}