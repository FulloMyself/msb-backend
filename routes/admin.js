const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Loan = require('../models/Loan');

// admin-only middleware
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
  next();
}

// list all users
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    return res.json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// get a user with their loans
router.get('/user/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const loans = await Loan.find({ userId: user._id }).sort({ createdAt: -1 });
    return res.json({ user, loans });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// update loan status
router.patch('/loan/:loanId', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending','approved','rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const loan = await Loan.findById(req.params.loanId);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    loan.status = status;
    await loan.save();
    return res.json({ message: 'Loan status updated', loan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// list all loans (admin)
router.get('/loans', auth, isAdmin, async (req, res) => {
  try {
    const loans = await Loan.find().populate('userId', 'email').sort({ createdAt: -1 });
    return res.json({ loans });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
