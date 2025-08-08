const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const Invoice = require('../models/Invoice');
require('dotenv').config();


function safeParseJson(text) {
  if (!text) return null;
  let t = text.replace(/```json|```/g, '').trim();
  try { return JSON.parse(t); } catch (e) {}
  // fallback: extract first {...}
  const m = t.match(/{[\s\S]*}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch (e) {}
  }
  return null;
}


async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set in .env');

  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const model = process.env.GROQ_MODEL || 'llama3-70b-8192';

  const payload = {
    model,
    messages: [
      { role: 'system', content: 'You are a helpful assistant that extracts structured data from invoice text. Return JSON ONLY.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    max_tokens: 2000,
  };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const resp = await axios.post(url, payload, { headers, timeout: 120000 });
  // path: resp.data.choices[0].message.content (OpenAI-style)
  return resp?.data?.choices?.[0]?.message?.content ?? '';
}

exports.processInvoice = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    //  Read image file
    const filePath = path.resolve(req.file.path);
    const buffer = fs.readFileSync(filePath);

    //  OCR with Tesseract
    const workerPromise = Tesseract.recognize(filePath, 'eng', {
      logger: m => { /* optional logging: console.log(m) */ }
    });

    const ocrResult = await workerPromise;
    const rawText = ocrResult?.data?.text?.trim() || '';

    // If OCR returns nothing, fail gracefully
    if (!rawText) {
      return res.status(500).json({ success: false, error: 'OCR produced empty text' });
    }

    //  Build prompt for Groq
    const userPrompt = `
You are an invoice extractor. Given the OCR text below, extract the following fields and return a JSON object **only** in this exact shape:

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

For any missing field, set "value": "" and "confidence": 0.
Here is the OCR'd text (do not invent fields not present; use best guess and assign confidence):
-------------------------
${rawText}
-------------------------
Return only JSON.
`;

    //  Call Groq API
    const modelText = await callGroq(userPrompt);

    //  Attempt to parse robustly
    const parsed = safeParseJson(modelText);

    // If parsing failed, return full response for manual inspection
    if (!parsed) {
      // Save record with rawResponse for debugging
      const invoiceDoc = {
        invoiceNumber: '',
        dateIssued: '',
        vendorName: '',
        totalAmount: '',
        tax: '',
        lineItems: [],
        confidences: {},
        rawText,
        rawResponse: modelText,
        filePath,
        originalFileName: req.file.originalname,
      };
      const saved = await Invoice.create(invoiceDoc);
      return res.status(200).json({
        success: true,
        invoice: saved,
        warning: 'Could not parse model output as JSON. Raw model output saved in rawResponse for inspection.',
        rawModelOutput: modelText
      });
    }

    //  Build invoice doc from parsed JSON (defensive)
    const invoiceDoc = {
      invoiceNumber: parsed?.['Invoice Number']?.value || '',
      dateIssued: parsed?.['Date Issued']?.value || '',
      vendorName: parsed?.['Vendor Name']?.value || '',
      totalAmount: parsed?.['Total Amount']?.value || '',
      tax: parsed?.['Tax']?.value || '',
      lineItems: Array.isArray(parsed?.['Line Items']) ? parsed['Line Items'] : [],
      confidences: {
        invoiceNumber: parsed?.['Invoice Number']?.confidence || 0,
        dateIssued: parsed?.['Date Issued']?.confidence || 0,
        vendorName: parsed?.['Vendor Name']?.confidence || 0,
        totalAmount: parsed?.['Total Amount']?.confidence || 0,
        tax: parsed?.['Tax']?.confidence || 0,
      },
      rawText,
      rawResponse: modelText,
      filePath,
      originalFileName: req.file.originalname,
    };

    // Save to DB
    const saved = await Invoice.create(invoiceDoc);

    //  Respond with saved invoice
    return res.json({ success: true, invoice: saved });

  } catch (err) {
    console.error('processInvoice error:', err);
    return res.status(500).json({ success: false, error: 'Processing failed', details: err.message });
  }
};
