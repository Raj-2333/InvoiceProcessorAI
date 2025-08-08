
const express = require('express');
const multer = require('multer');
const path = require('path');
const { processInvoice } = require('../controllers/invoiceController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.pdf'].includes(ext)) cb(null, true);
    else cb(new Error('Only JPG / JPEG / PNG / PDF allowed'));
  }
});

router.post('/', upload.single('file'), processInvoice);

module.exports = router;
