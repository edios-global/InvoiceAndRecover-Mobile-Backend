import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import mongoose from 'mongoose';
import { encryptPassword, generatePassword, generateSearchParameterList, sendMailBySendGrid, uploadImageFile } from '../routes/genericMethods.js';
import Employee from '../models/employeeBfmModel.js';
import Document from '../models/employeeDocumentBfmModel.js';
import Roles from '../models/rolesModel.js';
import Users from '../models/UsersModel.js';
import Templates from '../models/templatesModel.js';


const addEmployee = asyncHandler(async (req, res) => {
    const post = req.body;

    console.log("adaf" ,post )
    try {
        const checkIfFirstAlreadyExist = await Employee.find({ firstName: post.firstName, lastName: post.lastName, birthDate: post.birthDate, });
        if (checkIfFirstAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "FirstName , LastName and BirthDate Already Exist with Another Employee", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkIfEmailAlredyExist = await Employee.find({ emailAddress: post.emailAddress });
        if (checkIfEmailAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "Email Address Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkIfMobileAlreadyExist = await Employee.find({ phoneNumber: post.phoneNumber });
        if (checkIfMobileAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Mobile Number Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        if (req.files) {
            let returnedFileName = await uploadImageFile(req, "profileFileName");
            post.profileFileName = returnedFileName;
        }
        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.recordType = "I";
        const addedEmployee = await new Employee(post).save();
        if (addedEmployee._id !== null) {
            let successResponse = genericResponse(true, "add Employee added successfully.", addedEmployee);
            res.status(201).json(successResponse);
            return;
        } else {
            let errorRespnse = genericResponse(false, "enable to add Employee", []);
            res.status(200).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log(error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchEmployee = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        var query = { businessUserID: mongoose.Types.ObjectId(post.businessUserID) };
        var sort = {};
        if (post.filterValues != undefined && post.filterValues != '')
            query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
        const fetchQuery = [
            {
                $project: {
                    employeeType: "$employeeType",
                    employeeCode: "$employeeCode",
                    firstName: "$firstName",
                    lastName: "$lastName",
                    businessUserID: "$businessUserID",
                    department: "$department",
                    designation: "$designation",
                    employeeStatus: "$employeeStatus",
                },
            },
            {
                $match: query
            },
        ]
        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;

            fetchQuery.push({ $sort: sort });
        } else {
            sort = { createdDate: -1 }
        }
        let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
        if (post.employeeStatus !== "All") {
            query.employeeStatus = post.employeeStatus;
            fetchQuery.push({ $match: query });
        }
        let myAggregation = Employee.aggregate()
        myAggregation._pipeline = fetchQuery
        Employee.aggregatePaginate(
            myAggregation,
            options,
            (err, result) => {
                if (err) {
                    const errorResponse = genericResponse(false, "Unable to fetch", []);
                    res.status(400).json(errorResponse);

                } else {
                    const successResponse = genericResponse(true, "Employee fetched successfully", result);
                    res.status(200).json(successResponse);

                }
            }
        );
    }
    catch (error) {
        console.log("error in fetch Employee =", error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }

});

const fetchEmployeeById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post.id) };
        const fetchEmployee = await Employee.find(query);
        if (fetchEmployee.length > 0) {
            let successResponse = genericResponse(true, "fetchEmployeeById fetched successfully.", fetchEmployee);
            res.status(201).json(successResponse);
        }

        else {
            let errorRespnse = genericResponse(false, "Something went wrong, Try again!", []);
            res.status(200).json(errorRespnse);
            return;
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

// const updateEmployee = asyncHandler(async (req, res) => {
//     const post = req.body;
//     console.log("post", post)
//     try {
//         const query = { _id: mongoose.Types.ObjectId(post.id) }
//         const checkIfEmployeeCodeAlreadyExist = await Employee.find({ employeeCode: { '$regex': '^' + post.employeeCode.trim() + '$', '$options': 'i' } });
//         if (checkIfEmployeeCodeAlreadyExist.length > 0) {
//             let successResponse = genericResponse(false, "Employee Code Already Exist.", []);
//             res.status(201).json(successResponse);
//             return;
//         }
//         const checkIfTaxAlreadyExist = await Employee.find({ taxFileNumber: { '$regex': '^' + post.taxFileNumber.trim() + '$', '$options': 'i' } });
//         if (checkIfTaxAlreadyExist.length > 0) {
//             let successResponse = genericResponse(false, "Tax File Number Already Exist.", []);
//             res.status(201).json(successResponse);
//             return;
//         }
//         const checkIfMemberAlreadyExist = await Employee.find({ memberNumber: { '$regex': '^' + post.memberNumber.trim() + '$', '$options': 'i' } });
//         if (checkIfMemberAlreadyExist.length > 0) {
//             let successResponse = genericResponse(false, "Member Number Already Exist.", []);
//             res.status(201).json(successResponse);
//             return;
//         }
//         // const checkIfMgrCodeAlreadyExist = await Employee.find({ employeeCode: { '$regex': '^' + post.reportingManagerEmployeeName.trim() + '$', '$options': 'i' } });
//         // if (checkIfMgrCodeAlreadyExist.length > 0) {
//         //     let successResponse = genericResponse(false, "Reporting Manager Code can't be same as Exist Employee Code ", []);
//         //     res.status(201).json(successResponse);
//         //     return;
//         // }
//         if (req.files) {
//             let returnedFileName = await uploadImageFile(req, "iDCardFileName");
//             post.iDCardFileName = returnedFileName;
//         }
//         post.recordType = 'U';
//         post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
//         delete post._id;
//         var newValues = { $set: post }
//         const updateParameter = await Employee.updateOne(query, newValues);
//         console.log("up", updateParameter);
//         if (updateParameter.matchedCount > 0) {
//             let successResponse = genericResponse(true, "Employee  updated successfully.", []);
//             res.status(200).json(successResponse);
//         } else {
//             let errorRespnse = genericResponse(false, "Employee not updated successfully.", []);
//             res.status(200).json(errorRespnse);
//             return;
//         }
//     } catch (error) {
//         let errorRespnse = genericResponse(false, error.message, []);
//         res.status(400).json(errorRespnse);
//     }
// });

const updateEmployee = asyncHandler(async (req, res) => {
    try {

        if (req.body.employeeCode !== '' && req.body.employeeCode !== undefined) {
            const checkIfEmployeeCodeAlreadyExist = await Employee.find({ businessUserID: req.body.businessUserID, _id: { $ne: mongoose.Types.ObjectId(req.body.id) }, employeeCode: { '$regex': '^' + req.body.employeeCode.trim() + '$', '$options': 'i' } });
            if (checkIfEmployeeCodeAlreadyExist.length > 0) {
                let successResponse = genericResponse(false, "Employee Code already exists.", []);
                res.status(201).json(successResponse);
                return;
            }
        }
        if (req.body.taxFileNumber !== '' && req.body.taxFileNumber !== undefined) {
            const checkIfTaxAlreadyExist = await Employee.find({ businessUserID: req.body.businessUserID, _id: { $ne: mongoose.Types.ObjectId(req.body.id) }, taxFileNumber: { '$regex': '^' + req.body.taxFileNumber.trim() + '$', '$options': 'i' } });
            if (checkIfTaxAlreadyExist.length > 0) {
                let successResponse = genericResponse(false, "Tax File Number already exists.", []);
                res.status(201).json(successResponse);
                return;
            }
        }
        if (req.body.memberNumber !== '' && req.body.memberNumber !== undefined) {
            const checkIfMemberAlreadyExist = await Employee.find({ businessUserID: req.body.businessUserID, _id: { $ne: mongoose.Types.ObjectId(req.body.id) }, memberNumber: { '$regex': '^' + req.body.memberNumber.trim() + '$', '$options': 'i' } });
            if (checkIfMemberAlreadyExist.length > 0) {
                let successResponse = genericResponse(false, "Member Number already exists.", []);
                res.status(201).json(successResponse);
                return;
            }
        }

        const checkIfEmailAlredyExist = await Employee.find({ businessUserID: req.body.businessUserID, _id: { $ne: mongoose.Types.ObjectId(req.body.id) }, emailAddress: req.body.emailAddress });
        if (checkIfEmailAlredyExist.length > 0) {
            let successResponse = genericResponse(false, "Email Address Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }
        const checkIfMobileAlreadyExist = await Employee.find({ businessUserID: req.body.businessUserID, _id: { $ne: mongoose.Types.ObjectId(req.body.id) }, phoneNumber: req.body.phoneNumber });
        if (checkIfMobileAlreadyExist.length > 0) {
            let successResponse = genericResponse(false, "Mobile Number Already Exist.", []);
            res.status(201).json(successResponse);
            return;
        }

        const fetchEmployee = await Employee.find({ _id: mongoose.Types.ObjectId(req.body.id) })


        if (req.body.mobileAppUserName !== "" && req.body.mobileAppUserName !== undefined) {
            const checkIfMobileAlreadyExist = await Employee.find({ businessUserID: req.body.businessUserID, _id: { $ne: mongoose.Types.ObjectId(req.body.id) }, mobileAppUserName: { '$regex': '^' + req.body.mobileAppUserName.trim() + '$', '$options': 'i' } });
            if (checkIfMobileAlreadyExist.length > 0) {
                let successResponse = genericResponse(false, "Mobile App User Name already exists.", []);
                res.status(201).json(successResponse);
                return;
            }
        }


        const post = req.body;
        const userData = {}
        if (post.mobileAppAccess === "Warehouse") {

            const warehouseRrole = await Roles.find({ roleName: "Warehouse Dashboard" })
            const password = await generatePassword();
            await encryptPassword(password).then(data => {
                userData.userPassword = data;
            })
                .catch((error) => {
                    console.log("Password encryption error:", error);
                    return;
                });


            const fetchUser = await Users.find({ employeeID: post.id })
            if (fetchUser.length === 0) {
                userData.roleID = warehouseRrole[0]._id
                userData.businessUserID = fetchEmployee[0].businessUserID
                userData.userStatus = "Active"
                userData.userType = "Warehouse"
                userData.employeeID = post.id
                userData.lastName = fetchEmployee[0].lastName
                userData.emailAddress = fetchEmployee[0].emailAddress
                userData.phoneNumber = fetchEmployee[0].phoneNumber
                userData.firstName = fetchEmployee[0].firstName
                userData.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

                const save = new Users(userData).save()

                const templateQuery = { templateStatus: 'Active', templateName: 'WarehouseNewUser' };
                const fetchedTemplates = await Templates.find(templateQuery);
                let emailSubject = '';
                let emailBody = '';
                if (fetchedTemplates.length > 0) {
                    let val = fetchedTemplates[0];
                    val.templateSubject = val.templateSubject.replaceAll('[FirstName]', post.firstName);
                    val.templateSubject = val.templateSubject.replaceAll('[LastName]', post.lastName);
                    val.templateSubject = val.templateSubject.replaceAll('[EmailAddress]', post.emailAddress);

                    emailSubject = val.templateSubject;
                    val.templateMessage = val.templateMessage.replaceAll('[FirstName]', post.firstName);
                    val.templateMessage = val.templateMessage.replaceAll('[LastName]', post.lastName);
                    val.templateMessage = val.templateMessage.replaceAll('[EmailAddress]', post.emailAddress);
                    // val.templateMessage = val.templateMessage.replaceAll('[URL]', password);
                    val.templateMessage = val.templateMessage.replaceAll('[Password]', password);

                    emailBody = val.templateMessage;
                    sendMailBySendGrid(post.emailAddress, emailSubject, emailBody);
                }
            }
        }
        if (post.fileName !== undefined && post.fileName !== '') {
            if (req.files.file) {
                let returnedFileName = await uploadImageFile(req, "profileFileName");
                post.profileFileName = returnedFileName;
                req.files.file = ""
            }
        }

        if (post.fileName1 !== undefined && post.fileName1 !== '') {
            if (req.files.file1) {
                req.files.file = req.files.file1
                post.fileName = post.fileName1
                let returnedFileName = await uploadImageFile(req, "iDCardFileName");
                post.iDCardFileName = returnedFileName;
            }
        }


        if (post.mobileAppAccess !== "Warehouse") {
            var unsetValuesw = { $unset: { employeeWarehouseLocation: "" } }
            const updateParameter = await Employee.updateOne({ _id: mongoose.Types.ObjectId(req.body.id) }, unsetValuesw)

        }
        post.recordType = 'U';
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        delete post._id;
        if (post.iDCardIssueDate === 'undefined' || post.iDCardIssueDate === null) {
            post.iDCardIssueDate = ""
        }
        if (post.releivingDate === 'undefined' || post.releivingDate === null) {
            post.releivingDate = ""
        }
        if (post.employeeWarehouseLocation === "" || post.employeeWarehouseLocation === null) {
            post.employeeWarehouseLocation = undefined
        }
        var newValues = { $set: post }
        const updateParameter = await Employee.updateOne({ _id: mongoose.Types.ObjectId(req.body.id) }, newValues);


        let successResponse = genericResponse(true, "Employee  updated successfully.", []);
        res.status(200).json(successResponse);

    } catch (error) {
        console.log("error in updateEmployee=====>", error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});


const deleteEmployee = asyncHandler(async (req, res) => {
    try {
        if (req.body._id.length > 0) {
            let string="";
            for (let data of req.body._id) {
                const fetchedCustomer = await Employee.find({ _id: data });
                const customers = fetchedCustomer[0];
                if (customers) {
                    var query = { employeeID: data };
                    const teamCount = await Document.count(query);
                    if (teamCount === 0) {
                        const deleteData = await customers.remove();
                    }
                    else {
                        string += `${fetchedCustomer[0].firstName} ${fetchedCustomer[0].lastName} `
                    }
                } else {
                    let errorRespnse = genericResponse(false, "Customer not found.", []);
                    res.status(200).json(errorRespnse);
                    return
                }

            }

            if (string) {
                let errorRespnse = genericResponse(false, ` Employee can't be deleted because ${string}  contains Documents Please First Documents and then Employee can be deleted.. `, []);
                res.status(200).json(errorRespnse);
                return

            } else {
                let successResponse = genericResponse(true, "Employee deleted successfully.", []);
                res.status(200).json(successResponse);
                return
            }
        }
        else {
            let errorRespnse = genericResponse(false, "Please Select Atleast One Employee", []);
            res.status(200).json(errorRespnse);
        }
    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchEmployeeNameList = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        const fetchPlan = await Employee.find({ designation: "Management", businessUserID: mongoose.Types.ObjectId(post.businessUserID), _id: { $ne: mongoose.Types.ObjectId(req.body.id) } })
        let successResponse = genericResponse(true, "fetchEmployeeName fetched successfully.", fetchPlan);
        res.status(201).json(successResponse);

    } catch (error) {
        console.log(error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});



// -------> Documents Api Below

const addDocument = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        if (req.files) {
            let returnedFileName = await uploadImageFile(req, "documentFileName");
            post.documentFileName = returnedFileName;
        }
        post.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.uploadedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
        post.recordType = "I";
        const addedDocument = await new Document(post).save();
        if (addedDocument._id !== null) {
            let successResponse = genericResponse(true, "add Document added successfully.",);
            res.status(201).json(successResponse);
            return;
        } else {
            let errorRespnse = genericResponse(false, error.message, []);
            res.status(200).json(errorRespnse);
            return;
        }
    } catch (error) {
        console.log(error.message);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchDocument = asyncHandler(async (req, res) => {
    const post = req.body;
    try {
        var query = { employeeID: mongoose.Types.ObjectId(post.employeeID) };
        var sort = {};
        if (post.filterValues != undefined && post.filterValues != '')
          query.$or = await generateSearchParameterList(post.searchParameterList, post.filterValues);
        const fetchQuery = [
            {
                $project: {
                    documentName: "$documentName",
                    documentType: "$documentType",
                    uploadedDate: "$uploadedDate",
                    uploadedDateString:{
                        $concat: [
                            {
                                $let: {
                                    vars: {
                                        monthsInString: [, 'Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec ']
                                    },
                                    in: {
                                        $arrayElemAt: ['$$monthsInString', { $month: "$uploadedDate" }]
                                    }
                                }
                            },
                            { $dateToString: { format: "%d", date: "$uploadedDate" } }, ", ",
                            { $dateToString: { format: "%Y", date: "$uploadedDate" } },
                        ]
                    },
                    employeeID:"$employeeID", 
                    idAndPath:{_id:"$_id" ,documentFileName:"$documentFileName"}
                }
            },
            {   $match:query }

        ];

        if (post.sortingType && post.sortingField) {
            var sortField = post.sortingField;
            sort[sortField] = post.sortingType;
      
            fetchQuery.push({ $sort: sort });
          } else {
            sort = { uploadedDate: -1 }
          }
          let options = { page: post.page, limit: post.limit, skip: post.limit * post.page, sort: sort };
          let myAggregation = Document.aggregate()
          myAggregation._pipeline = fetchQuery
          Document.aggregatePaginate(
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
        console.log("sdfsfffs" , error.message)
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(400).json(errorRespnse);
    }
});

const fetchDocumentById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        const document = await Document.find(query);
        if (document.length > 0) {
            let successResponse = genericResponse(true, "Document fetched successfully.", document);
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

const updateDocument = asyncHandler(async (req, res) => {
    try {

        const post = req.body;

        var query = { _id: mongoose.Types.ObjectId(post.id) }

        if (req.files) {
            let returnedFileName = await uploadImageFile(req, "documentFileName");
            post.documentFileName = returnedFileName;
        }
        post.recordType = 'U';
        post.lastModifiedDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));

        const updatedDocument = await Document.updateOne(query, {
            $set: {
                documentName: post.documentName,
                documentType: post.documentType,
                documentFileName: post.documentFileName,
            }
        });
        let successResponse = genericResponse(true, "updateDocument updated successfully.", []);
        res.status(200).json(successResponse);

    } catch (error) {
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const deleteDocument = asyncHandler(async (req, res) => {
    try {
        if(req.body._id.length >0){
            const deleteDooc = await Document.deleteMany({ _id: {$in:req.body._id}})
            if(deleteDooc.deletedCount === 0 ){
                let errorResponse = genericResponse(false, "Something Went Wromng", []);
                res.status(200).json(errorResponse);
            }else{
                let successResponse = genericResponse(true, "Document Deleted Succesfully", []);
                res.status(200).json(successResponse);
            }
        }else{
            let errorResponse = genericResponse(false, "Select Atleast One Document", []);
            res.status(200).json(errorResponse);
        }
    } catch (error) {
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

const fetchEmployeeName = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: { $ne: mongoose.Types.ObjectId(req.body._id) } };
        const fetchPlan = await Employee.find(query)
        let successResponse = genericResponse(true, "fetchEmployeeName fetched successfully.", fetchPlan);
        res.status(201).json(successResponse);

    } catch (error) {
        console.log(error);
        let errorRespnse = genericResponse(false, error.message, []);
        res.status(200).json(errorRespnse);
    }
});

const fetchImageById = asyncHandler(async (req, res) => {
    try {
        const post = req.body;
        var query = { _id: mongoose.Types.ObjectId(post._id) };
        const document = await Document.find(query);

        if (document.length > 0) {
            let successResponse = genericResponse(true, "Document fetched successfully.", document);
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

export {
    addEmployee,
    fetchEmployee,
    fetchEmployeeById,
    updateEmployee,
    deleteEmployee,
    addDocument,
    fetchDocument,
    fetchDocumentById,
    updateDocument,
    deleteDocument,
    viewFile,
    fetchEmployeeNameList,
    fetchImageById,
    fetchEmployeeName


}