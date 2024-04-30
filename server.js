import path from 'path'
import express from 'express'
import dotenv from 'dotenv'
import colors from 'colors'
import morgan from 'morgan'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'
import connectDB from './config/db.js'
import { createRequire } from 'module';
import loginRoutes from './routes/loginRoutes.js';
import wizardRoutes from './routes/wizardRoutes.js';
import planRoutes from './routes/planRoutes.js'
import rolesRoutes from './routes/rolesRoutes.js'
import userRoutes from './routes/userRoutes.js'
import userSettingRoutes from './routes/userSettingRoutes.js'
import countryStateRoutes from './routes/countryStateRoutes.js'
import businessLocationRoutes from './routes/businessLocationRoutes.js'
import businessReviewLinkRoutes from './routes/businessReviewLinkRoutes.js'
import generalSettingRoutes from './routes/generalSettingRoutes.js'
import clientsRoutes from './routes/clientsRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import feedbackSettingRoutes from './routes/feedbackSettingRoutes.js'
import requestcampaignsettingsRoutes from './routes/requestcampaignsettingsRoutes.js'
import businessUserNotificationRoutes from './routes/businessUserNotificationRoutes.js'
import reviewRequestRoutes from './routes/reviewRequestRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import dashboard from './routes/dashboardRoutes.js'
import subscriptionPlan from './routes/subscriptionPlanRoutes.js';
import businessIntegrationsRoutes from './routes/businessIntegrationsRoutes.js';
import parameterSettingRoutes from './routes/parameterSettingRoutes.js';
import templatesRoutes from './routes/templatesRoutes.js';
import affiliateRoutes from './routes/affiliateRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import parameterRoutes from './routes/parameterRoutes.js';
import customerRoutes from './routes/customerBfmRoutes.js';
import employeeRoutes from './routes/employeeBfmRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import deliveryTimeRoutes from './routes/deliveryTimeRoutes.js';
import shipmentRoutes from './routes/shipmentRoutes.js';
import batRoutes from './routes/batGroupRoutes.js';

import ordersRoutes from './routes/ordersRoutes.js'
import checklistRoutes from './routes/checklistRoutes.js';
import warehouseDashboardRoutes from './routes/warehouseDashboardRoutes.js';
import loadPlanVehiclesRoutes from './routes/loadPlanVehiclesRoutes.js'
import themesRoutes from './routes/themesRoutes.js'
import mobileloginRoutes from './routes/mobileloginRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import defaultRoutes from './routes/defaultSettingRoutes.js'
import itemsRoutes from './routes/itemsRoutes.js'
import itemCategoriesRoutes from './routes/itemCategoriesRoutes.js'
import quotationRoutes from './routes/quotationRoutes.js'



// import mobileloginRoutes from './mobile-api/routes/loginRoutes.js';
const require = createRequire(import.meta.url);
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
dotenv.config()

connectDB()

const app = express()
// For File Uploads
const fileupload = require("express-fileupload");
const cors = require("cors");
const bodyParser = require('body-parser');

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  // Please enable for production environment
  // if (req.protocol === 'http') {
  //   return res.redirect(301, `https://${req.headers.host}${req.url}`);
  // }
  next();
});

app.use(cors());
app.use(fileupload());
app.use(express.static("files"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use(express.json())

app.use('/api/login', loginRoutes)
app.use('/api/wizard', wizardRoutes)
app.use('/api/plan', planRoutes)
app.use('/api/roles', rolesRoutes)
app.use('/api/user', userRoutes)
app.use('/api/userSetting', userSettingRoutes)
app.use('/api/countryState', countryStateRoutes)
app.use('/api/businessLocation', businessLocationRoutes)
app.use('/api/businessReviewLink', businessReviewLinkRoutes)
app.use('/api/generalSetting', generalSettingRoutes)
app.use('/api/clients', clientsRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/feedbackSetting', feedbackSettingRoutes)
app.use('/api/requestcampaignsettings', requestcampaignsettingsRoutes)
app.use('/api/notification', businessUserNotificationRoutes)
app.use('/api/requests', reviewRequestRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/dashboard', dashboard)
app.use('/api/subscriptionPlan', subscriptionPlan)
app.use('/api/businessIntegrations', businessIntegrationsRoutes)
app.use('/api/parameterSetting', parameterSettingRoutes)
app.use('/api/template', templatesRoutes)
app.use('/api/affilate', affiliateRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/parameter', parameterRoutes)
app.use('/api/customer', customerRoutes)
app.use('/api/employee', employeeRoutes)
app.use('/api/warehouse', warehouseRoutes)
app.use('/api/vehicle', vehicleRoutes)
app.use('/api/deliveryTime', deliveryTimeRoutes)
app.use('/api/shipment', shipmentRoutes)
app.use('/api/bat', batRoutes)
app.use('/api/order', ordersRoutes)
app.use('/api/checklist', checklistRoutes)
app.use('/api/warehouseDashboard', warehouseDashboardRoutes)
app.use('/api/loadPlanVehicles', loadPlanVehiclesRoutes)
app.use('/api/themeSettings', themesRoutes)
//Karan
app.use('/api/defaultSettings', defaultRoutes)
app.use('/api/itemCategries', itemCategoriesRoutes)
app.use('/api/items', itemsRoutes)
//gourav
app.use('/api/contact', contactRoutes);
app.use('/api/quotation', quotationRoutes);





app.use('/mobileApi', mobileloginRoutes)



const __dirname = path.resolve()
app.use('/uploads', express.static(path.join(__dirname, '/uploads')))

app.get('/', (req, res) => {
  res.send('API is running....')
})

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000
const HOSTNAME = process.env.HOSTNAME || localhost

// Please enable for production environment
// var https = require('https');
// var fs = require('fs');
// var https_options = {
//   key: fs.readFileSync(__dirname + "/backend/ssl/STAR.reviewarm.com.key"),
//   cert: fs.readFileSync(__dirname + "/backend/ssl/STAR.reviewarm.com.crt"),
//   ca: [
//     fs.readFileSync(__dirname + '/backend/ssl/STAR.reviewarm.com.p7b'),
//     fs.readFileSync(__dirname + '/backend/ssl/STAR.reviewarm.com.ca-bundle')
//   ]
// }
// https.createServer(https_options, app).listen(443,);


app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
)
