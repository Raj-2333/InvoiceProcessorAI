const fs = require('fs');
const path = require('path');
const Invoice = require('../models/Invoice');
const { GoogleGenerativeAI } = require('@google/generative-ai'); 
require('dotenv').config();

function safeParseJson(text) {
  if (!text) return null;
  // Trim obvious code fences
  text = text.replace(/```json|```/g, '').trim();
  // Try direct parse
  try { return JSON.parse(text); } catch (e) {}
  // Try to extract first {...}
  const m = text.match(/{[\s\S]*}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch (e) {}
  }
  return null;
}

exports.processInvoice = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    // read file
    const filePath = path.resolve(req.file.path);
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');

    // build prompt describing the expected JSON output
    const prompt = `
You are an assistant that extracts invoice fields. Given the image attached, return JSON only with the following fields:
{
  "Invoice Number": { "value": "...", "confidence": "0-100" },
  "Date Issued": { "value": "...", "confidence": "0-100" },
  "Vendor Name": { "value": "...", "confidence": "0-100" },
  "Total Amount": { "value": "...", "confidence": "0-100" },
  "Tax": { "value": "...", "confidence": "0-100" },
  "Line Items": [
    { "description": "...", "quantity": "...", "unitPrice": "...", "confidence": "0-100" }
  ]
}
Return only JSON. If a field is missing, set its value to empty string and confidence to 0.
`;

    // instantiate Gemini client and model
    const client = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API });
    const model = client.getGenerativeModel({ model: 'gemini-pro-vision' });

    // call the model with inline image data
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: base64,
        },
      },
    ]);

    // result.response may be a promise-like; we attempt to read text
    const response = await result.response;
    // `response.text()` returns the string output
    const text = typeof response.text === 'function' ? response.text() : (response.outputText || '');

    // try parse
    const parsed = safeParseJson(text);

    // Build document to save
    const invoiceDoc = {
      invoiceNumber: parsed?.['Invoice Number']?.value || '',
      dateIssued: parsed?.['Date Issued']?.value || '',
      vendorName: parsed?.['Vendor Name']?.value || '',
      totalAmount: parsed?.['Total Amount']?.value || '',
      tax: parsed?.['Tax']?.value || '',
      lineItems: parsed?.['Line Items'] || [],
      confidences: {
        invoiceNumber: parsed?.['Invoice Number']?.confidence || parsed?.['Invoice Number']?.confidence || '',
        dateIssued: parsed?.['Date Issued']?.confidence || '',
        vendorName: parsed?.['Vendor Name']?.confidence || '',
        totalAmount: parsed?.['Total Amount']?.confidence || '',
        tax: parsed?.['Tax']?.confidence || '',
      },
      rawResponse: text || '',
      filePath: filePath,
      originalFileName: req.file.originalname,
    };

    // save to DB
    const saved = await Invoice.create(invoiceDoc);

    res.json({ success: true, invoice: saved });

  } catch (err) {
    console.error('processInvoice error:', err);
    res.status(500).json({ success: false, error: 'Processing failed', details: err.message });
  }
};
