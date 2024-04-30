import mongoose from "mongoose";
import paginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const orderSchema = mongoose.Schema({
  businessUserID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  customerID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  jobID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  orderNumber: {
    type: Number,
  },
  orderDate: {
    type: Date,
  },
  selectUser: {
    type: String,
  },
  shipmentType: {
    type: String,
  },
  senderName: {
    type: String,
  },
  senderContactNumber: {
    type: String,
  },
  senderStreetAddress: {
    type: String,
  },
  senderCity: {
    type: String,
  },
  senderZipCode: {
    type: String,
  },
  senderStateID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  senderCountryID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  senderLocationLatitude: {
    type: String,
  },
  senderLocationLongitude: {
    type: String,
  },
  pickupWarehouseID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  receiverfirstName: {
    type: String,
  },
  receiverlastName: {
    type: String,
  },
  receiverName: {
    type: String,
  },
  receiverContactNumber: {
    type: String,
  },
  receiverStreetAddress: {
    type: String,
  },
  receiverCity: {
    type: String,
  },
  receiverZipCode: {
    type: String,
  },
  receiverCountryID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  receiverStateID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  senderAddressID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  receiverAddressID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  receiverLocationLatitude: {
    type: String,
  },
  receiverLocationLongitude: {
    type: String,
  },
  distance: {
    type: Number,
  },
  paymentType: {
    type: String,
  },
  pickupCharges: {
    type: Number,
  },
  fixedCharges: {
    type: Number,
  },
  variableCharges: {
    type: Number,
  },
  totalCharges: {
    type: Number,
  },
  paymentTransactionID: {
    type: String,
  },
  paymentGatewayIntentID: {
    type: String,
  },
  sessionID: {
    type: String,
  },
  paymentStatus: {
    type: String,
  },
  chargeCreditFlag: {
    type: Number,
  },
  orderStatus: {
    type: String,
  },
  estimatedDeliveryTime: {
    type: String,
  },
  startWarehouseID:{
    type: mongoose.Schema.Types.ObjectId,
  },

  trackStatus: {
    type: String,
  },

  createdBy: {
    type: Number,
  },
  createdDate: {
    type: Date,
    // required: true,
    // default: new Date(new Date() - (new Date().getTimezoneOffset() * 60000)),
  },
  lastModifiedDate: {
    type: Date,
  },
  lastModifiedBy: {
    type: Number,
  },
  recordType: {
    type: String,
    required: true,
    default: "I",
  },
});
orderSchema.plugin(paginate);
orderSchema.plugin(aggregatePaginate);
const Orders = mongoose.model("order", orderSchema);

export default Orders;
