const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Loan = require('../models/Loan'); // make sure this exists


// ==========================
// GET ADMIN DASHBOARD STATS
// ==========================
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingLoans = await Loan.countDocuments({ status: 'pending' });
    const totalLoanAmount = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      totalUsers,
      pendingLoans,
      totalLoanAmount: totalLoanAmount[0] ? totalLoanAmount[0].total : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching admin stats' });
  }
});

// ==========================
// GET ALL USERS
// ==========================
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // exclude passwords
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// ==========================
// GET ALL LOANS
// ==========================
router.get('/loans', async (req, res) => {
  try {
    const loans = await Loan.find().populate('user', 'name email'); // link user info
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching loans' });
  }
});

// ==========================
// GET ALL DOCUMENTS
// ==========================
router.get('/documents', async (req, res) => {
  try {
    const documents = await Document.find().populate('user', 'name email');
    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

// ==========================
// UPDATE DOCUMENT STATUS
// ==========================
router.patch('/document/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const doc = await User.findById(id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.status = status;
    await doc.save();

    res.json({ message: 'Document status updated', document: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating document status' });
  }
});

// ==========================
// UPDATE LOAN STATUS
// ==========================
router.patch('/loan/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'under-review', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid loan status value' });
  }

  try {
    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    loan.status = status;
    await loan.save();

    res.json({ message: 'Loan status updated', loan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating loan status' });
  }
});


module.exports = router;
