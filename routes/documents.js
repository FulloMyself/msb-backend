const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const auth = require('../middleware/auth');
const User = require('../models/User');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadsDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});
const upload = multer({ storage });

router.post('/upload', auth, upload.fields([
  { name: 'idCopy', maxCount: 1 },
  { name: 'payslip', maxCount: 1 },
  { name: 'proofOfResidence', maxCount: 1 },
  { name: 'bankStatement', maxCount: 1 } // only 1 now
]), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Initialize documents if not present
    if (!user.documents) {
      user.documents = {
        idCopy: null,
        payslip: null,
        proofOfResidence: null,
        bankStatement: null
      };
    }

    const files = req.files || {};
    if (files.idCopy && files.idCopy[0]) user.documents.idCopy = `/uploads/${files.idCopy[0].filename}`;
    if (files.payslip && files.payslip[0]) user.documents.payslip = `/uploads/${files.payslip[0].filename}`;
    if (files.proofOfResidence && files.proofOfResidence[0]) user.documents.proofOfResidence = `/uploads/${files.proofOfResidence[0].filename}`;
    if (files.bankStatement && files.bankStatement[0]) user.documents.bankStatement = `/uploads/${files.bankStatement[0].filename}`;

    await user.save();
    return res.json({ message: 'Documents saved', documents: user.documents });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// get my documents
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
