const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Configure AWS S3 Client (v3)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Multer memory storage to access file buffers
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to upload a single file to S3
const uploadFileToS3 = async (file, folder = 'documents') => {
  const key = `${folder}/${Date.now()}-${file.originalname}`;
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private', // change to 'public-read' if needed
    },
  });

  await upload.done();
  // Return the S3 URL
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

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

      // Helper to upload files for a specific type
      const processFiles = async (type) => {
        if (files[type]) {
          const uploadedUrls = await Promise.all(
            files[type].map(f => uploadFileToS3(f, type))
          );
          user.documents[type] = [...user.documents[type], ...uploadedUrls];
        }
      };

      await Promise.all(['idCopy', 'payslip', 'proofOfResidence', 'bankStatement'].map(processFiles));

      await user.save();
      return res.json({ message: 'Documents saved', documents: user.documents });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

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
