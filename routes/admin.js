const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Loan = require('../models/Loan');
const { authMiddleware } = require('../middleware/auth');

// ==========================
// GET ADMIN DASHBOARD STATS
// ==========================
router.get('/stats', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

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
router.get('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

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
router.get('/loans', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

  try {
    const loans = await Loan.find().populate('user', 'name email');
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching loans' });
  }
});

// ==========================
// GET ALL DOCUMENTS
// ==========================
router.get('/documents', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

  try {
    const users = await User.find({}, 'name email documents');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

// ==========================
// UPDATE DOCUMENT STATUS
// ==========================
router.put('/document/:userId/:docType/:index/status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

  const { userId, docType, index } = req.params;
  const { status } = req.body;

  const DOC_TYPES = ['idCopy', 'payslip', 'proofOfResidence', 'bankStatement'];
  if (!DOC_TYPES.includes(docType)) return res.status(400).json({ message: 'Invalid document type' });
  if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.documents[docType] || !user.documents[docType][index]) {
      return res.status(404).json({ message: 'Document not found' });
    }

    user.documents[docType][index].status = status;
    await user.save();

    res.json({ message: 'Document status updated', documents: user.documents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating document status' });
  }
});

// ==========================
// UPDATE LOAN STATUS
// ==========================
router.put('/loan/:id/status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

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
