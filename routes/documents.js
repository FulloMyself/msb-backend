const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const auth = require('../middleware/auth');
const User = require('../models/User');

// AWS S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Multer in memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to upload a file buffer to S3
const uploadToS3 = async (file, folder) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${folder}/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  const parallelUpload = new Upload({
    client: s3,
    params
  });

  await parallelUpload.done();

  // Return public URL
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
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

      if (!user.documents) {
        user.documents = {
          idCopy: [],
          payslip: [],
          proofOfResidence: [],
          bankStatement: []
        };
      }

      const files = req.files || {};

      // Upload each file type
      const processFiles = async (type) => {
        if (files[type]) {
          const urls = await Promise.all(
            files[type].map(file => uploadToS3(file, type))
          );
          user.documents[type] = [...user.documents[type], ...urls];
        }
      };

      await Promise.all([
        processFiles('idCopy'),
        processFiles('payslip'),
        processFiles('proofOfResidence'),
        processFiles('bankStatement')
      ]);

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
