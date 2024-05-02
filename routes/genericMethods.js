import express from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
var nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator')
import mongoose from 'mongoose';
const sgMail = require('@sendgrid/mail');
var CryptoJS = require("crypto-js");
import axios from 'axios';
import GenerateSequence from '../models/generateSequenceModel.js';
import Warehouse from '../models/warehouseModel.js';
import Roles from '../models/rolesModel.js';
import AutoIncrementSequenceValues from '../models/quotationAISequenceValueModel.js';
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');

const request = require('request-promise');

// export default function sendTwilioMessage(toNumber, OTP) {
//     try {
//         let accountSid = process.env.TWILIO_ACCOUNT_SID;
//         let authToken = process.env.TWILIO_AUTH_TOKEN;
//         const twilio = require('twilio');
//         const client = new twilio(accountSid, authToken);
//         client.messages
//             .create({
//                 body: process.env.TWILIO_MESSAGE + OTP, // Message text
//                 to: toNumber, // Text this number
//                 from: process.env.TWILIO_FROM_NUMBER, // From a valid Twilio number
//             })
//             .then((message) => console.log("message==", message))
//             .catch((error) => console.log("Error in Twilio Message =" + JSON.stringify(message)));

//     } catch (error) {
//         console.log("Error in sendTwilioMessage==" + JSON.stringify(error));
//     }
// };

export default async function sendTwilioMessage(toNumber, sms) {
    try {
        console.log("Sending SMS using Twilio...", toNumber, sms);
        let accountSid = process.env.TWILIO_ACCOUNT_SID;
        let authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilio = require('twilio');
        const client = new twilio(accountSid, authToken);
        client.messages
            .create({
                body: sms, // Message text
                to: toNumber, // Text this number
                from: process.env.TWILIO_FROM_NUMBER, // From a valid Twilio number
            })
            .then((message) => console.log("message==", message))
            .catch((error) => console.log("Error in Twilio Message =", error));

    } catch (error) {
        console.log("Error in sendTwilioMessage==", error);
    }
};

export function testGenericMethod() {
    try {
    } catch (error) {
        console.log("Error in sendTwilioMessage==", error);
    }
};

//comment it on dated 8 feb 2024 for testing with 3 argumwent
// export async function uploadImageFile(req, imagePrefix) {
//     return new Promise(resolve => {
//         try {
//             const post = req.body;
//             let fileURL = process.env.LOCATION_PATH;
//             const fs = require("fs")
//             const date = new Date();
//             let month = date.toLocaleString('default', { month: 'long' });
//             month = month.toUpperCase().substring(0, 3);
//             const year = date.getFullYear();
//             const subfolderName = month + "-" + year
//             fileURL = fileURL + subfolderName;
//             const newpath = fileURL + "/";
//             const file = req.files && req.files.file; // Check if the file object exists
//             let fileName = post.fileName;
//             let onlyFileName = imagePrefix;
//             let currentDate = new Date();
//             onlyFileName = onlyFileName + "_" + currentDate.getDate() + (currentDate.getMonth() + 1) + currentDate.getFullYear() + "_" + currentDate.getTime();
//             let ext = fileName.substring(fileName.indexOf(".", 2), fileName.size);
//             let newFileName = onlyFileName + ext;
//             fs.access(fileURL, async function (error) {
//                 if (error) {
//                     await fs.mkdir(fileURL, { recursive: true }, (err) => {
//                         if (err) throw err;
//                     });
//                 };
//                 if (file) { // Check if the file object exists before moving the file
//                     file.mv(`${newpath}${newFileName}`, (err) => {
//                         if (err) {
//                             resolve(err);
//                         } else {
//                             let returnedFileName = subfolderName + "/" + newFileName;
//                             resolve(returnedFileName);
//                         }
//                     });
//                 } else {
//                     resolve('File object is undefined.');
//                 }
//             });
//         } catch (catchederror) {
//             console.log("Error in uploadFile==", catchederror);
//         }
//     });
// };

//with 3 argument --subFolderName
export async function uploadImageFile(req, imagePrefix, mainFolderName = null) {
    return new Promise(resolve => {
        try {
            const post = req.body;
            let fileURL = process.env.LOCATION_PATH;
            const fs = require("fs")
            const date = new Date();
            let month = date.toLocaleString('default', { month: 'long' });
            month = month.toUpperCase().substring(0, 3);
            const year = date.getFullYear();
            const subfolderName = month + "-" + year
            if (mainFolderName) {
                fileURL = fileURL + mainFolderName + "/"; // Append the main folder name to the base path
            }
            fileURL = fileURL + subfolderName;
            const newpath = fileURL + "/";
            const file = req.files && req.files.file; // Check if the file object exists
            let fileName = post.fileName;
            let onlyFileName = imagePrefix;
            let currentDate = new Date();
            onlyFileName = onlyFileName + "_" + currentDate.getDate() + (currentDate.getMonth() + 1) + currentDate.getFullYear() + "_" + currentDate.getTime();
            let ext = fileName.substring(fileName.indexOf(".", 2), fileName.size);
            let newFileName = onlyFileName + ext;
            fs.access(fileURL, async function (error) {
                if (error) {
                    await fs.mkdir(fileURL, { recursive: true }, (err) => {
                        if (err) throw err;
                    });
                };
                if (file) { // Check if the file object exists before moving the file
                    if (!fs.existsSync(newpath)) {
                        fs.mkdirSync(newpath, { recursive: true }); // Create the directory if it does not exist
                    }
                    file.mv(`${newpath}${newFileName}`, (err) => {
                        if (err) {
                            resolve(err);
                        } else {
                            let returnedFileName = mainFolderName ? mainFolderName + "/" + subfolderName + "/" + newFileName : subfolderName + "/" + newFileName;
                            resolve(returnedFileName);
                        }
                    });
                } else {
                    resolve('File object is undefined.');
                }
            });
        } catch (catchederror) {
            console.log("Error in uploadFile==", catchederror);
        }
    });
};


export async function generateSearchParameterList(searchParameterList, searchParameter) {
    try {
        return new Promise(resolve => {
            var querySearch = [], querys = {};
            searchParameterList.forEach(key => {
                querys = {};
                querys[key] = { '$regex': '.*' + searchParameter.trim() + '.*', '$options': 'i' };
                querySearch.push(querys);
            });
            resolve(querySearch);
        });
    } catch (error) {
        console.log("Catch in generateSearchParameterList==", error);
    }
};

export async function generateSearchId(searchParameterList, searchParameter) {
    // try {
    //     return new Promise(resolve => {
    //         var querySearch = [], querys = {};
    //         searchParameterList.forEach(key => {
    //             querys = {};
    //             querys[key] = searchParameter;
    //             querySearch.push(querys);
    //         });
    //         resolve(querySearch);
    //     });
    // } catch (error) {
    //     console.log("Catch in generateSearchParameterList==", error);
    // }
};

export function dateToDDMmmYYYY(date) {
    try {
        // return new Promise(resolve => {
        var strArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var d = date.getDate();
        var m = strArray[date.getMonth()];
        var y = date.getFullYear();
        var formattdDate = '' + (d <= 9 ? '0' + d : d) + ' ' + m + ' ' + y;
        return formattdDate;
        // });
    } catch (error) {
        console.log("Catch in dateToDDMmmYYYY==", error);
    }
}

export function formatAMPM(hours, minutes) {
    try {
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours %= 12;
        hours = hours || 12;
        minutes = minutes < 10 ? `0${minutes}` : minutes;
        const strTime = `${hours}:${minutes} ${ampm}`;
        return strTime;
    } catch (error) {
        console.log("Catch in formatAMPM==", error);
    }
}

export async function generateOtp() {
    try {
        return new Promise(resolve => {
            const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })
            resolve(otp);
        });
    } catch (error) {
        console.log("Catch in generateOtp==", error);
    }
};

export async function generatePassword() {
    try {
        return new Promise(resolve => {
            const password = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: true, upperCaseAlphabets: true, specialChars: true })
            resolve(password);
        });
    } catch (error) {
        console.log("Catch in generatePassword==", error);
    }
};

export async function generateTempPassword() {
    try {
        return new Promise(resolve => {
            const password = otpGenerator.generate(8, { digits: true, lowerCaseAlphabets: true, upperCaseAlphabets: true, specialChars: true })
            resolve(password);
        });
    } catch (error) {
        console.log("Catch in generatePassword==", error);
    }
};

export async function sendMail(receiver, subject, body) {
    try {
        return new Promise(resolve => {
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            var mailOptions = {
                from: process.env.EMAIL_USER,
                to: receiver,
                subject: subject,
                html: body
            };
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log("Error in transporter.sendMail()", error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            resolve(true);
        });
    } catch (error) {
        console.log("Catch in sendMail==", error);
    }
};

export async function sendMailBySendGrid(receiver, subject, emailTemplate) {

    try {
        console.log("Sending mail using SendGrid", receiver, subject, emailTemplate);
        new Promise(resolve => {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
                from: process.env.SEND_GRID_VERIFIED_EMAIL_PROD,
                to: receiver,
                subject: subject,
                html: emailTemplate
            };
            sgMail
                .send(msg)
                .then((info) => {
                    console.log('Email sent: ' + info);
                })
                .catch((error) => {
                    console.log("Error in transporter.sendMail()", error);
                });
            resolve(true);
        });
    }
    catch (error) {
        console.log("error in catch==", error);
    }
}

export async function updateToObjectType(selectedList) {
    try {
        return new Promise(resolve => {

            resolve((selectedList).map((item, i) => {
                return (
                    mongoose.Types.ObjectId(item)
                )
            }));
        });
    } catch (error) {
        console.log("Catch in updateToObjectType==", error);
    }
};

export async function uploadCVSFile(req, csvPrefix) {
    return new Promise(resolve => {
        try {
            const post = req.body;
            let fileURL = process.env.LOCATION_PATH;
            const fs = require("fs")
            const date = new Date();
            let month = date.toLocaleString('default', { month: 'long' });
            month = month.toUpperCase().substring(0, 3);
            const year = date.getFullYear();
            const subfolderName = month + "-" + year
            fileURL = fileURL + subfolderName;
            const newpath = fileURL + "/";
            const file = req.files.file;
            let fileName = post.fileName;
            let onlyFileName = csvPrefix;
            let currentDate = new Date();
            onlyFileName = onlyFileName + "_" + currentDate.getDate() + (currentDate.getMonth() + 1) + currentDate.getFullYear() + "_" + currentDate.getTime();
            let ext = fileName.substring(fileName.indexOf(".", 2), fileName.size);
            let newFileName = onlyFileName + "." + ext;
            fs.access(fileURL, async function (error) {
                if (error) {
                    await fs.mkdir(fileURL, { recursive: true }, (err) => {
                        if (err) throw err;
                    });
                };
                file.mv(`${newpath}${newFileName}`, (err) => {
                    if (err) {
                        resolve(err);
                    } else {
                        let returnedFileName = subfolderName + "/" + newFileName;
                        resolve(returnedFileName);
                    }
                });
            });
        } catch (catchederror) {
            console.log("Error in uploadCSVFile==", catchederror);
        }
    });
};

export async function encryptPassword(password) {
    try {
        var iv = CryptoJS.enc.Hex.parse("");
        const key = CryptoJS.enc.Hex.parse(process.env.ENCRYPTION_SEED_KEY);
        var encryptedPassword = CryptoJS.AES.encrypt(password, key, { iv: iv }).toString();
        return encryptedPassword;
    } catch (error) {
        console.log("Catch in encryptPassword==", error);
    }
};

export async function decryptPassword(password) {
    try {
        var iv = CryptoJS.enc.Hex.parse("");
        const key = CryptoJS.enc.Hex.parse(process.env.ENCRYPTION_SEED_KEY);
        var decryptedPassword = CryptoJS.AES.decrypt(password, key, { iv: iv }).toString(CryptoJS.enc.Utf8);
        return decryptedPassword;
    } catch (error) {
        console.log("Catch in decryptPassword==", error);
    }
};

export async function templateFilter(name, templateArray) {
    return new Promise(async resolve => {
        let result = "None";
        let template = [];
        try {

            template = templateArray.filter(template => template.templateName === name);
            console.log("bjasdhbaj", template)
            if (template.length > 0) {
                if (template[0].templateType === "Email") {
                    let emailvalues = {
                        templateSubject: template[0].templateSubject,
                        templateMessage: template[0].templateMessage
                    }
                    result = emailvalues;
                } else {
                    result = template[0].templateMessage
                }

            }
            resolve(result);

        } catch (error) {
            console.log("Catch in getSesstionDataByID==", error);
            resolve(result);
        }
    });
};

export async function parameterfilter(code, parameterArray) {
    return new Promise(async resolve => {
        let result = "None";
        let parameter = [];
        try {
            parameter = parameterArray.filter(parameter => parameter.parameterCode === code);
            if (parameter.length > 0) {
                result = parameter[0].parameterValue;
            }
            resolve(result);

        } catch (error) {
            console.log("Catch in getSesstionDataByID==", error);
            resolve(result);
        }
    });
};

export async function sendEmail(receiver, subject, emailTemplate) {
    try {
        new Promise(resolve => {
            // resolve(sendEmailByZeptoMail(receiver, subject, emailTemplate));
            resolve(sendEmailBySendGrid(receiver, subject, emailTemplate));
        });
    }
    catch (error) {
        console.log("error in catch==", error);
        resolve(false);
    }
};

export async function sendEmailBySendGrid(receiver, subject, emailTemplate) {
    try {
        console.log("Sending mail using SendGrid");
        new Promise(resolve => {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
                from: process.env.SEND_GRID_VERIFIED_EMAIL_PROD,
                to: receiver,
                subject: subject,
                html: emailTemplate
            };
            sgMail
                .send(msg)
                .then((info) => {
                    console.log('Email sent: ' + info);
                })
                .catch((error) => {
                    console.log("Error in transporter.sendMail()", error);
                });
            resolve(true);
        });
    }
    catch (error) {
        console.log("error in catch==", error);
    }
};

export async function yelpAPI(fetchAPI) {
    return new Promise(async resolve => {
        try {
            const api = `https://api.yelp.com/v3/businesses/${fetchAPI}`;
            await axios.get(api, { headers: { "Authorization": `Bearer ${process.env.YELP_TOKEN}` } })
                .then(res => {
                    // this.setState({
                    //     items: res.data,  /*set response data in items array*/
                    //     isLoaded : true,
                    //     redirectToReferrer: false
                    // })
                    resolve(res.data)

                })
                .catch(
                    (error) => {
                        console.log("Error in yelpAPI =", error)
                        resolve(undefined)
                    }

                );
        } catch (catchederror) {
            resolve(undefined)
            // console.log("Error in uploadCSVFile==" + JSON.stringify(catchederror.data.error));
        }
    });
};

export async function generateSequenceValue(sequenceName, id) {
    try {
        var sequenceDocument = await GenerateSequence.findOneAndUpdate(
            { "businessUserID": id, "sequenceName": sequenceName },
            { $inc: { "sequenceValue": 1 } },
            { new: true }
        );
        if (sequenceDocument == null) {
            const checkIfFieldExist = await GenerateSequence.find({ sequenceName: sequenceName, businessUserID: id });
            if (checkIfFieldExist.length == 0) {
                await new GenerateSequence({ sequenceName: sequenceName, businessUserID: id, sequenceValue: 1, }).save()
                return 1;
            }
            return null;
        }
        else
            return sequenceDocument.sequenceValue;
    } catch (error) {
        console.log("Catch in generateSequenceValue==", error);
        return null;
    }
};

export async function QRGenerator(qrData) {
    try {
        const opts = {
            errorCorrectionLevel: 'H',
            type: 'terminal',
            quality: 0.95,
            margin: 1,
            color: {
                dark: '#020708',
                light: '#FFF',
            },
        }
        return new Promise(resolve => {
            QRCode.toDataURL(qrData, opts).then(qrImage => {
                resolve(qrImage);
            }).catch(err => {
                console.error(err)
            })

        });
    } catch (error) {
        console.log("Catch in generatePassword==", error);
    }
};

// export async function generatePDF(contentList, fileName) {

//     console.log("Start to generate the PDF");
//     const browser = await puppeteer.launch({
//       headless: true,
//     //   executablePath: 'path_to_chrome',
//       defaultViewport: null,
//       args: ['--no-sandbox'],
//       timeout: 0, // Set a high timeout value
//       devtools: false,
//       ignoreDefaultArgs: ['--disable-extensions'], // optional
//       ignoreHTTPSErrors: true, // optional
//       defaultNavigationTimeout: 0, // Disable default navigation timeout
//       protocolTimeout: 0, // Disable protocol timeout
//     });
//     const page = await browser.newPage();

//     await page.setUserAgent(
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36"
//     );

//   const contentStyle= contentList

//     await page.setContent(contentStyle);

//     // await page.setContent(contentList);  
//     // IMP: Set margin to 0 for the entire page
//     await page.addStyleTag({ content: '* { margin: 0; }' });

//     await page.pdf({
//       path: process.env.LOCATION_PATH + `/pdfFiles/${fileName}.pdf`,
//       width: 384, // in px
//       height: 864, // in px
//       printBackground: true,
//       preferCSSPageSize: true,
//       timeout: 0, // Disable printToPDF timeout
//     });

//     await browser.close();

//     return fileName + ".pdf";
//   }
//   export async function generatePDF(contentArray, fileName) {
//     const browser = await puppeteer.launch({ headless: true });
//     const page = await browser.newPage();

//     await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');

//     await page.setContent(contentArray);


//     await page.pdf({
//         path: process.env.LOCATION_PATH + `/pdfFiles/${fileName}.pdf`,
//         format: 'letter',
//         printBackground: true,
//         preferCSSPageSize: true,
//         // height: 50 + 'px'
//     });

//     await browser.close();

//     return fileName + '.pdf';
// }


export async function generatePDF(contentArray, fileName) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application",
        userDataDir: "C:\\Windows\\system32\\config\\systemprofile\\.cache\\puppetee"
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36"
    );
    var document = `
      <!DOCTYPE html>
      <html>
      <head>  
     
        <style>
        
          body {
            margin:0px;    
            padding:0px; 
            
          }
          .border-bottom{
            border-bottom:1px solid black;
          }
        </style>
      </head>
      <body>
     
      </body>
      </html>
    `
    const contentStyle = contentArray + document

    await page.setContent(contentStyle);


    await page.pdf({
        path: process.env.LOCATION_PATH + `/pdfFiles/${fileName}.pdf`,
        format: 'letter',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
            top: "10px",
            right: "0px",
            bottom: "0px",
            left: "0px"
        },
        // height: 50 + 'px'
    });

    await browser.close();

    return fileName + '.pdf';
}

export async function appNotification(registrationID, title, body, notificationId) {
    try {

        console.log("appNotification => ", registrationID, title, body)
        var originAPI = 'https://fcm.googleapis.com/fcm/send';
        const options = {
            method: 'POST',
            uri: originAPI,
            body: {
                "registration_ids": registrationID,
                "topic": "BossFM",
                "notification": {
                    title: title,
                    body: body,
                    sound: "default",
                    notificationId: notificationId,
                },

                // "data": {
                //     "notificationId": notificationId,
                //     "title": title,
                //     "body": body,
                //     "notificationType": notificationType,
                //     "image": image,

                //     "chatId": Id,
                //     "dateTime": dateTime
                // },

            },
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'key=AAAADUus3E8:APA91bFXCJGHBe_Zb_8rEAGbNq0Rn4-UY7ntKocCmCx6DTON_DZ6xJgfjoirgS0cC_b1GXsqT5mECYGZ-0xvR6BgTXOBtyqdEH-SV1_Jscm4Jy0J982p08sg1WptyFRn8lMKZmgf1kUi'
            }
        }
        request(options).then(response => {
            console.log("appNotification response==", response)
            // console.log("appNotification options==", options)
        }).catch((error) => console.log("Error in Twilio SMS =" + JSON.stringify(error)));
    } catch (error) {
        console.log("Error in appNotification==" + console.log("error", error));
    }
};

export async function getWarehouse(lat, long, businessUserID, senderCity) {

    const fetchWarehouse = await Warehouse.find({ businessUserID: mongoose.Types.ObjectId(businessUserID), city: senderCity })
    let warehouseLocations = []
    for (let data of fetchWarehouse) {


        if (data.warehouseLocationLatitude && data.warehouseLocationLongitude !== "" && data.warehouseLocationLatitude && data.warehouseLocationLongitude !== undefined) {
            var unit = "metric"
            var originAPI = 'https://maps.googleapis.com/maps/api/directions/json?origin=' + lat + ', ' + long + '&destination=' + data.warehouseLocationLatitude + ', ' + data.warehouseLocationLongitude + '&units=' + unit + '&key=AIzaSyCNe-x9Jn_2903j9PxhLPw6SPGXMwIlkCM';

            const options = {
                method: 'POST',
                uri: originAPI,
                // body: req.body,
                json: true,
            }
            await request(options).then(response => {
                const totalDist = response.routes[0].legs[0].distance.value;
                const totalDistance = totalDist / 1000;

                let pushData = {
                    distance: totalDistance,
                    warehouseID: data._id
                }
                warehouseLocations.push(pushData)


            }).catch(err => {
                console.log("Errror==> ", err)
            });
        }

    }
    return warehouseLocations.reduce((min, current) => {
        return current.distance < min.distance ? current : min;
    }, warehouseLocations[0]);

};

export async function getNextSequenceValue(sequenceName, id, defaultQuotPrefixValue) {
    try {
        console.log("defaultQuotPrefixValue", defaultQuotPrefixValue);
        const numValue = parseInt(defaultQuotPrefixValue, 10);
        if (isNaN(numValue)) {
            throw new Error('Invalid input. Please provide a valid number.');
        }
        const incrementNumber = async (num) => {
            // Remove leading zeros and convert to number
            const numValue = parseInt(num, 10);

            // Check if numValue is NaN
            if (isNaN(numValue)) {
                throw new Error('Invalid input. Please provide a valid number.');
            }

            // Increment the number by 1
            const incrementedNum = numValue + 1;
            // Get the original length of the number
            const originalLength = num.length;
            // Convert the incremented number back to string and pad with leading zeros
            return String(incrementedNum).padStart(originalLength, '0');
        }
        let isQuotationIncrement = await AutoIncrementSequenceValues.findOne({ businessUserID: id, columnName: sequenceName, });
        console.log("isQuotationIncrement", isQuotationIncrement);
        if (isQuotationIncrement) {
            if (isQuotationIncrement.defaultQuotationPrefixNumber === defaultQuotPrefixValue) {
                const updatedNumber = await incrementNumber(isQuotationIncrement.sequenceValue)
                let sequenceDocument = await AutoIncrementSequenceValues.updateOne(
                    { "businessUserID": id, "columnName": sequenceName, "defaultQuotationPrefixNumber": defaultQuotPrefixValue },
                    { $set: { "sequenceValue": updatedNumber } },

                );
                if (sequenceDocument.nModified === 1) { return updatedNumber }
                else {
                    return null
                }
            } else {
                let sequenceDocument = await AutoIncrementSequenceValues.updateOne(
                    { "businessUserID": id, "columnName": sequenceName },
                    { $set: { "sequenceValue": defaultQuotPrefixValue, "defaultQuotationPrefixNumber": defaultQuotPrefixValue } },

                );
                if (sequenceDocument.nModified === 1) { return defaultQuotPrefixValue }
                else {
                    return null
                }

            }
        } else {
            const inserted = await new AutoIncrementSequenceValues({ columnName: sequenceName, businessUserID: id, sequenceValue: defaultQuotPrefixValue, defaultQuotationPrefixNumber: defaultQuotPrefixValue }).save()
            console.log("inserted", inserted);
            if (inserted) return defaultQuotPrefixValue
            else {
                return null
            }
        }
    } catch (error) {
        console.log("Catch in getNextSequenceValue==", error.message);
        return null;
    }
}

export async function getRole(...values) {
    const fetchedRoles = await Roles.find({ planID: mongoose.Types.ObjectId(values[0]) });
    if (fetchedRoles.length > 0) {
        let roleID = fetchedRoles.map(val => {
            if (val.roleName === values[1]) {
                return val._id
            }
        })
        return roleID[0]
    }
};

export async function copyFile(sourcePath, destinationFileFolder, callback) {
    const sourceFilePath = path.join(process.env.LOCATION_PATH, sourcePath);
    const destinationFolderPath = path.join(process.env.LOCATION_PATH, destinationFileFolder);
    const destinationFilePath = path.join(destinationFolderPath, path.basename(sourcePath));
    console.log("destinationFilePath", destinationFilePath);
    // Check if the destination folder exists, if not, create it
    const destinationFolder = path.dirname(destinationFilePath);
    if (!fs.existsSync(destinationFolder)) {
        fs.mkdirSync(destinationFolder, { recursive: true });
    }
    console.log("sourceFilePath", sourceFilePath);
    // Copy the file from source to destination
    fs.copyFile(sourceFilePath, destinationFilePath, (err) => {
        if (err) {
            console.error('Error copying file:', err);
            callback(err);
            return;
        }
        console.log('File copied successfully.');
        callback(null);
    });
}

export async function uploadQuotationFile(req, imagePrefix, mainFolderName = null) {
    return new Promise(resolve => {
        try {
            let fileURL = process.env.LOCATION_PATH;
            const fs = require("fs")
            const subfolderName = req.body.quotationID;
            if (mainFolderName) {
                fileURL = fileURL + mainFolderName + "/"; // Append the main folder name to the base path
            }
            fileURL = fileURL + subfolderName;
            const newpath = fileURL + "/";
            const file = req.files && req.files.file; // Check if the file object exists
            let fileObj = req.files?.file;
            let onlyFileName = imagePrefix;
            let currentDate = new Date();
            onlyFileName = onlyFileName + "_" + currentDate.getDate() + (currentDate.getMonth() + 1) + currentDate.getFullYear() + "_" + currentDate.getTime();

            let ext = fileObj.name.substring(fileObj.name.indexOf(".", 2), fileObj.size);
            let newFileName = onlyFileName + ext;
            fs.access(fileURL, async function (error) {
                if (error) {
                    await fs.mkdir(fileURL, { recursive: true }, (err) => {
                        if (err) throw err;
                    });
                };
                if (file) { // Check if the file object exists before moving the file
                    if (!fs.existsSync(newpath)) {
                        fs.mkdirSync(newpath, { recursive: true }); // Create the directory if it does not exist
                    }
                    file.mv(`${newpath}${newFileName}`, (err) => {
                        if (err) {
                            resolve(err);
                        } else {
                            let returnedFileName = mainFolderName ? mainFolderName + "/" + subfolderName + "/" + newFileName : subfolderName + "/" + newFileName;
                            resolve(returnedFileName);
                        }
                    });
                } else {
                    resolve('File object is undefined.');
                }
            });
        } catch (catchederror) {
            console.log("Error in uploadQuotationFile==", catchederror);
        }
    });
};

export async function uploadInvoiceFile(req, imagePrefix, mainFolderName = null) {
    return new Promise(resolve => {
        try {
            let fileURL = process.env.LOCATION_PATH;
            const fs = require("fs")
            const subfolderName = req.body.invoiceID;
            if (mainFolderName) {
                fileURL = fileURL + mainFolderName + "/"; // Append the main folder name to the base path
            }
            fileURL = fileURL + subfolderName;
            const newpath = fileURL + "/";
            const file = req.files && req.files.file; // Check if the file object exists
            let fileObj = req.files?.file[0];
            let onlyFileName = imagePrefix;
            let currentDate = new Date();
            onlyFileName = onlyFileName + "_" + currentDate.getDate() + (currentDate.getMonth() + 1) + currentDate.getFullYear() + "_" + currentDate.getTime();


            let ext = fileObj.name.substring(fileObj.name.indexOf(".", 2), fileObj.size);
            let newFileName = onlyFileName + ext;
            fs.access(fileURL, async function (error) {
                if (error) {
                    await fs.mkdir(fileURL, { recursive: true }, (err) => {
                        if (err) throw err;
                    });
                };
                if (file) { // Check if the file object exists before moving the file
                    if (!fs.existsSync(newpath)) {
                        fs.mkdirSync(newpath, { recursive: true }); // Create the directory if it does not exist
                    }
                    file.mv(`${newpath}${newFileName}`, (err) => {
                        if (err) {
                            resolve(err);
                        } else {
                            let returnedFileName = mainFolderName ? mainFolderName + "/" + subfolderName + "/" + newFileName : subfolderName + "/" + newFileName;
                            resolve(returnedFileName);
                        }
                    });
                } else {
                    resolve('File object is undefined.');
                }
            });
        } catch (catchederror) {
            console.log("Error in uploadInvoiceFile==", catchederror);
        }
    });
};

export async function uploadRctiFile(req, imagePrefix, mainFolderName = null) {
    return new Promise(resolve => {
        try {
            let fileURL = process.env.LOCATION_PATH;
            const fs = require("fs")
            const subfolderName = req.body.rctiID;
            if (mainFolderName) {
                fileURL = fileURL + mainFolderName + "/"; // Append the main folder name to the base path
            }
            fileURL = fileURL + subfolderName;
            const newpath = fileURL + "/";
            const file = req.files && req.files.file; // Check if the file object exists
            let fileObj = req.files?.file[0];
            let onlyFileName = imagePrefix;
            let currentDate = new Date();
            onlyFileName = onlyFileName + "_" + currentDate.getDate() + (currentDate.getMonth() + 1) + currentDate.getFullYear() + "_" + currentDate.getTime();


            let ext = fileObj.name.substring(fileObj.name.indexOf(".", 2), fileObj.size);
            let newFileName = onlyFileName + ext;
            fs.access(fileURL, async function (error) {
                if (error) {
                    await fs.mkdir(fileURL, { recursive: true }, (err) => {
                        if (err) throw err;
                    });
                };
                if (file) { // Check if the file object exists before moving the file
                    if (!fs.existsSync(newpath)) {
                        fs.mkdirSync(newpath, { recursive: true }); // Create the directory if it does not exist
                    }
                    file.mv(`${newpath}${newFileName}`, (err) => {
                        if (err) {
                            resolve(err);
                        } else {
                            let returnedFileName = mainFolderName ? mainFolderName + "/" + subfolderName + "/" + newFileName : subfolderName + "/" + newFileName;
                            resolve(returnedFileName);
                        }
                    });
                } else {
                    resolve('File object is undefined.');
                }
            });
        } catch (catchederror) {
            console.log("Error in uploadRctiFile==", catchederror);
        }
    });
};

export function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}


