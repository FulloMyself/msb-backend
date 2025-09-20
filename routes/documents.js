// backend/routes/documents.js
const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Allowed document types
const DOC_TYPES = ['idCopy', 'payslip', 'proofOfResidence', 'bankStatement'];

// =======================
// AWS S3 Setup
// =======================
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'public-read',
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
  }),
});

// =======================
// Upload a document (S3)
// =======================
router.post('/upload', authMiddleware, upload.any(), async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.files?.[0]; // multer-s3 puts uploaded files in req.files array

    if (!DOC_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the S3 URL
    const fileUrl = req.file.location;


    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.documents[type]) user.documents[type] = [];
    if (!Array.isArray(user.documents[type])) user.documents[type] = [user.documents[type]];

    user.documents[type].push({
      fileUrl,
      status: 'pending',
      uploadedAt: new Date(),
    });

    await user.save();

    res.status(201).json({ message: 'Document uploaded successfully', documents: user.documents });
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({ error: 'Server error while uploading document' });
  }
});

// =======================
// Fetch all documents for logged-in user
// =======================
router.get('/my-documents', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user.documents);
  } catch (err) {
    console.error('Error fetching user documents:', err);
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// =======================
// Admin fetches all users' documents
// =======================
router.get('/all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const users = await User.find({}, 'name email documents');
    res.json(users);
  } catch (err) {
    console.error('Error fetching all documents:', err);
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// =======================
// Admin updates document status
// =======================
router.put('/:userId/:docType/:index/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const { userId, docType, index } = req.params;
    const { status } = req.body;

    if (!DOC_TYPES.includes(docType)) return res.status(400).json({ error: 'Invalid document type' });
    if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.documents[docType] || !user.documents[docType][index]) {
      return res.status(404).json({ error: 'Document not found' });
    }

    user.documents[docType][index].status = status;
    await user.save();

    res.json({ message: 'Document status updated', documents: user.documents });
  } catch (err) {
    console.error('Error updating document status:', err);
    res.status(500).json({ error: 'Error updating document status' });
  }
});

module.exports = router;
