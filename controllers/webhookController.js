import asyncHandler from 'express-async-handler'
import genericResponse from '../routes/genericWebResponses.js';
import SubscriptionPlan from '../models/subscriptionPlansModel.js';
import express from 'express'
import { createRequire } from 'module';
import Orders from '../models/ordersModel.js';

const require = createRequire(import.meta.url);
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
import mongoose from 'mongoose';
import BuPaymentTransactionsModel from '../models/buPaymentTransactionModel.js';
import BussinessUserCredit from '../models/businessuserCreditsModel.js';
import PlanFeatures from '../models/planFeaturesModel.js';
import BusinessUsers from '../models/businessUsersModel.js';
import InvoicePaymentsModel from '../models/invoicePaymentsModel.js';
import OrderDriverJob from '../models/orderDriverJobsModel.js';


const app = express()
app.use(express.json())

const webhooks = (express.raw({ type: 'application/json' }), async (request, response) => {
  const endpointSecret = "whsec_45ee1480df21c5fe6e8fa55dedf83dbafca4697381934079696fe5e833b6f12c";
  const currentDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
  // console.log("request", request.body.data.object)
  let webhookData = request.body
  const payload = {
    id: request.body.id,
    object: 'event',
  };
  const payloadString = JSON.stringify(payload, null, 2);
  const secret = endpointSecret;
  const header = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret,
  });
  const event = stripe.webhooks.constructEvent(payloadString, header, secret);
  if (event.id === payload.id) {
    switch (webhookData.type) {
      case 'checkout.session.async_payment_failed':
        const checkoutSessionAsyncPaymentFailed = request.body.data.object;
        await Orders.updateOne({ _id: mongoose.Types.ObjectId(checkoutSessionAsyncPaymentFailed.metadata.orderID) }, { $set: { paymentTransactionID: checkoutSessionAsyncPaymentFailed.payment_intent, paymentGatewayIntentID: checkoutSessionAsyncPaymentFailed.payment_intent, paymentStatus: checkoutSessionAsyncPaymentFailed.payment_status } })
        // Then define and call a function to handle the event checkout.session.async_payment_failed
        break;
      case 'checkout.session.async_payment_succeeded':
        const checkoutSessionAsyncPaymentSucceeded = request.body.data.object;
        await Orders.updateOne({ _id: mongoose.Types.ObjectId(checkoutSessionAsyncPaymentSucceeded.metadata.orderID) }, { $set: { paymentTransactionID: checkoutSessionAsyncPaymentSucceeded.payment_intent, paymentGatewayIntentID: checkoutSessionAsyncPaymentSucceeded.payment_intent, paymentStatus: checkoutSessionAsyncPaymentSucceeded.payment_status } })


        // Then define and call a function to handle the event checkout.session.async_payment_succeeded
        break;
      case 'checkout.session.completed':
        const checkoutSessionCompleted = request.body.data.object;
        console.log("checkoutSessionCompleted", checkoutSessionCompleted)
        await OrderDriverJob.updateOne({ orderID: mongoose.Types.ObjectId(checkoutSessionCompleted.metadata.orderID) }, { $set: { jobStatus: "To be Dropped" } })
        await Orders.updateOne({ _id: mongoose.Types.ObjectId(checkoutSessionCompleted.metadata.orderID) }, { $set: { paymentTransactionID: checkoutSessionCompleted.payment_intent, paymentGatewayIntentID: checkoutSessionCompleted.payment_intent, paymentStatus: "Successful", trackStatus: "Order Booked" } })
        // let payment_intent = stripe.PaymentIntent.retrieve(request.body.data.object.payment_intent)
        // console.log("che", request.body.data.object)
        // Then define and call a function to handle the event checkout.session.completed
        break;



      case 'checkout.session.expired':
        const checkoutSessionExpired = request.body.data.object;
        await Orders.updateOne({ _id: mongoose.Types.ObjectId(checkoutSessionExpired.metadata.orderID) }, { $set: { paymentTransactionID: checkoutSessionExpired.payment_intent, paymentGatewayIntentID: checkoutSessionExpired.payment_intent, paymentStatus: checkoutSessionExpired.payment_status } })
        // Then define and call a function to handle the event checkout.session.expired
        break;

      case 'payment_intent.succeeded':
        const paymentIntentSuccess = request.body.data.object;
        if (paymentIntentSuccess.metadata.paymentType === "Subcription") {
          const addPaymentTransactions = new BuPaymentTransactionsModel();
          addPaymentTransactions.transactionDateTime = currentDate;
          addPaymentTransactions.businessUserID = paymentIntentSuccess.metadata.businessUserID;
          addPaymentTransactions.paymentGatewayIntentID = paymentIntentSuccess.id
          addPaymentTransactions.paymentTransactionID = paymentIntentSuccess.id
          addPaymentTransactions.transactionType = 'Subscription Plan Changed';
          addPaymentTransactions.createdDate = currentDate;
          addPaymentTransactions.transactionStatus = "Successful"
          const addedSubscriptionTransactions = await addPaymentTransactions.save();

        } else if (paymentIntentSuccess.metadata.paymentType === "Add Charge") {
          const charge = {}
          const fetchUser = await BusinessUsers.find({ _id: mongoose.Types.ObjectId(paymentIntentSuccess.metadata.businessUserID) })

          await BusinessUsers.updateOne({ _id: mongoose.Types.ObjectId(paymentIntentSuccess.metadata.businessUserID) }, { $set: { availableCredits: fetchUser[0].availableCredits + parseInt(paymentIntentSuccess.metadata.creditBuy) } })
          charge.businessUserID = paymentIntentSuccess.metadata.businessUserID
          charge.transactionDescription = "Add Credits"
          charge.transactionDateTime = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
          charge.createdDate = new Date(new Date() - (new Date().getTimezoneOffset() * 60000));
          charge.creditsBalance = fetchUser[0].availableCredits + parseInt(paymentIntentSuccess.metadata.creditBuy)
          charge.creditsUsed = 0
          charge.creditsPurchased = parseInt(paymentIntentSuccess.metadata.creditBuy)
          await new BussinessUserCredit(charge).save()
        } else if (paymentIntentSuccess.metadata.paymentType === "Order") {
          await Orders.updateOne({ _id: mongoose.Types.ObjectId(paymentIntentSuccess.metadata.orderID) }, { $set: { paymentTransactionID: paymentIntentSuccess.id, paymentGatewayIntentID: paymentIntentSuccess.id, paymentStatus: "Successful", trackStatus: "Order Booked" } })
        }
        if (paymentIntentSuccess.metadata.paymentType === "Subcription" || paymentIntentSuccess.metadata.paymentType === "Add Credit") {
          const invoice = await stripe.invoices.create({
            customer: paymentIntentSuccess.metadata.gatewayUserID,
            description: 'Invoice for Payment',
            auto_advance: false
          });
          await stripe.invoiceItems.create({
            invoice: invoice.id,
            customer: paymentIntentSuccess.metadata.gatewayUserID,
            currency: 'aud',
            amount: paymentIntentSuccess.metadata.amount,

          });
          let paidInvoive = await stripe.invoices.pay(invoice.id, {

            paid_out_of_band: true
          }
          );
          if (paidInvoive !== "" || paidInvoive !== undefined) {
            const paymentData = {}
            paymentData.businessUserID = paymentIntentSuccess.metadata.businessUserID
            paymentData.invoiceID = paidInvoive.id
            paymentData.invoiceDate = currentDate

            if (paidInvoive.status === "paid") {
              paymentData.invoiceStatus = "Paid"
            } else {
              paymentData.invoiceStatus = "Failed"
            }

            // paymentData.invoiceStatus = paidInvoive.status
            paymentData.invoiceNumber = paidInvoive.number
            paymentData.transactionType = paymentIntentSuccess.metadata.paymentType
            paymentData.currencySymbol = paidInvoive.currency
            paymentData.invoiceAmount = paidInvoive.subtotal
            paymentData.paymentDate = currentDate
            paymentData.paymentAmount = paidInvoive.subtotal
            paymentData.createdDate = currentDate
            await new InvoicePaymentsModel(paymentData).save()
          }

        }

        break;
      // case 'payment_intent.payment_failed':
      //   const paymentIntentPaymentFailed = webhookData.object;
      //   // Then define and call a function to handle the event payment_intent.payment_failed
      //   break;
      // ... handle other event types
      default:
      // console.log(`Unhandled event type ${ webhookData.type}`);
    }


  }
  response.send();
})
export {
  webhooks
}