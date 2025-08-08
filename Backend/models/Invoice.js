
const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: String,
  quantity: String,
  unitPrice: String,
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: String,
  dateIssued: String,
  vendorName: String,
  totalAmount: String,
  tax: String,
  lineItems: [lineItemSchema],
  confidences: mongoose.Schema.Types.Mixed, 
  rawResponse: String,
  filePath: String,
  originalFileName: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Invoice', invoiceSchema);
