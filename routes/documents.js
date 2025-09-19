const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,    
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Multer S3 storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'private', // change to 'public-read' if you want public URLs
    metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
    key: (req, file, cb) => {
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/\s+/g, '_'); // remove spaces
      cb(null, `${req.user.userId}/${timestamp}-${sanitizedName}`);
    }
  })
});

// Upload documents (multiple files per type)
router.post(
  '/upload',
  auth,
  upload.fields([
    { name: 'idCopy', maxCount: 10 },
    { name: 'payslip', maxCount: 10 },
    { name: 'proofOfResidence', maxCount: 10 },
    { name: 'bankStatement', maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Ensure user.documents exists and is an object with arrays
      user.documents = user.documents || {
        idCopy: [],
        payslip: [],
        proofOfResidence: [],
        bankStatement: []
      };

      const files = req.files || {};

      // Append new files to the user's document arrays
      ['idCopy', 'payslip', 'proofOfResidence', 'bankStatement'].forEach(type => {
        if (files[type]) {
          const uploadedUrls = files[type].map(f => f.location); // full S3 URL
          user.documents[type] = [...user.documents[type], ...uploadedUrls];
        }
      });

      await user.save();

      return res.json({ message: 'Documents uploaded successfully', documents: user.documents });
    } catch (err) {
      console.error('Document upload error:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// Get logged-in user's documents
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('documents');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ documents: user.documents || {} });
  } catch (err) {
    console.error('Fetch documents error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
