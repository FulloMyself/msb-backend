// backend/routes/documents.js
const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { authMiddleware } = require('../middleware/auth');

// Upload a document
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const { type, fileUrl } = req.body;

    if (!['ID Copy', 'Payslip', 'Proof of Residence', 'Bank Statement'].includes(type)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    const document = new Document({
      user: req.user.id,  // comes from JWT middleware
      type,
      fileUrl,
    });

    await document.save();
    res.status(201).json(document);
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({ error: 'Server error while uploading document' });
  }
});

// Fetch all documents for the logged-in user
router.get('/my-documents', authMiddleware, async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user.id });
    res.json(documents);
  } catch (err) {
    console.error('Error fetching user documents:', err);
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Admin fetches all documents
router.get('/all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const documents = await Document.find().populate('user', 'name email phone');
    res.json(documents);
  } catch (err) {
    console.error('Error fetching all documents:', err);
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Admin updates document status
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (err) {
    console.error('Error updating document status:', err);
    res.status(500).json({ error: 'Error updating document status' });
  }
});

module.exports = router;
