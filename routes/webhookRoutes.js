import mongoose from 'mongoose';
import express from 'express'
import { webhook } from '';
// import { webhooks } from '../controllers/webhookController.js';
import { addOrder } from '../controllers/orderController';

const router = express.Router()



router.post('webhook', addOrder);


export default router