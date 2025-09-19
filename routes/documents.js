const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const auth = require('../middleware/auth');
const User = require('../models/User');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});
const upload = multer({ storage });

// Upload documents (multiple files per type)
router.post('/upload', auth, upload.fields([
  { name: 'idCopy', maxCount: 10 },
  { name: 'payslip', maxCount: 10 },
  { name: 'proofOfResidence', maxCount: 10 },
  { name: 'bankStatement', maxCount: 10 }
]), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Initialize documents if not present
    if (!user.documents) {
      user.documents = {
        idCopy: [],
        payslip: [],
        proofOfResidence: [],
        bankStatement: []
      };
    }

    const files = req.files || {};

    // Helper to append new files to existing array
    const appendFiles = (type) => {
      if (files[type]) {
        const uploadedPaths = files[type].map(f => `/uploads/${f.filename}`);
        user.documents[type] = [...user.documents[type], ...uploadedPaths];
      }
    };

    ['idCopy', 'payslip', 'proofOfResidence', 'bankStatement'].forEach(appendFiles);

    await user.save();
    return res.json({ message: 'Documents saved', documents: user.documents });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get my documents
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('documents');
    return res.json({ documents: user.documents });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
