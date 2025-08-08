
const express = require('express');
const Invoice = require('../models/Invoice');
const path = require('path');
const fs = require('fs');

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const total = await Invoice.countDocuments();
    const invoices = await Invoice.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    res.json({ success: true, invoices, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id).lean();
    if (!inv) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, invoice: inv });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


router.get('/:id/download-json', async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id).lean();
    if (!inv) return res.status(404).json({ success: false, error: 'Not found' });
    const filename = `invoice-${inv._id}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(inv, null, 2));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Download failed' });
  }
});


router.get('/:id/download-image', async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id).lean();
    if (!inv) return res.status(404).json({ success: false, error: 'Not found' });
    const filePath = path.resolve(inv.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'File missing' });
    res.download(filePath, inv.originalFileName || path.basename(filePath));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Download failed' });
  }
});

module.exports = router;
