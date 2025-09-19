// routes/documents.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// Configure AWS SDK v3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to upload a single file to S3 under a user folder
async function uploadFileToS3(file, userId, type) {
  const key = `${userId}/${type}/${Date.now()}-${uuidv4()}-${file.originalname}`;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ACL: 'private',
  };
  await s3.send(new PutObjectCommand(params));
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// Upload documents endpoint
router.post(
  '/upload',
  auth,
  upload.fields([
    { name: 'idCopy', maxCount: 10 },
    { name: 'payslip', maxCount: 10 },
    { name: 'proofOfResidence', maxCount: 10 },
    { name: 'bankStatement', maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (!user.documents) {
        user.documents = {
          idCopy: [],
          payslip: [],
          proofOfResidence: [],
          bankStatement: [],
        };
      }

      const files = req.files || {};

      // Upload files to S3 under user folder
      for (const type of ['idCopy', 'payslip', 'proofOfResidence', 'bankStatement']) {
        if (files[type]) {
          const uploadedUrls = [];
          for (const file of files[type]) {
            const url = await uploadFileToS3(file, user._id.toString(), type);
            uploadedUrls.push(url);
          }
          user.documents[type] = [...user.documents[type], ...uploadedUrls];
        }
      }

      // Save only the updated documents field
      await User.findByIdAndUpdate(
        user._id,
        { $set: { documents: user.documents } },
        { new: true, runValidators: true }
      );

      res.json({ message: 'Documents uploaded successfully', documents: user.documents });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// Get logged-in user's documents
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('documents');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ documents: user.documents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
