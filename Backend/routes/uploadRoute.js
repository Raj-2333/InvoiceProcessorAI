const express = require('express');
const multer = require('multer');
const path = require('path');
const { processInvoice } = require('../controllers/invoiceController');

const router = express.Router();

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'uploads/'),
//   filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
//   fileFilter: (req, file, cb) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     if (['.jpg', '.jpeg', '.png'].includes(ext)) cb(null, true);
//     else cb(new Error('Only JPG / JPEG / PNG files allowed'));
//   }
// });

// Store file in memory instead of disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png'];
    const ext = file.originalname.toLowerCase().match(/\.[0-9a-z]+$/);
    if (ext && allowedExts.includes(ext[0])) cb(null, true);
    else cb(new Error('Only JPG / JPEG / PNG files allowed'));
  }
});

router.post('/', upload.single('file'), processInvoice);

module.exports = router;
