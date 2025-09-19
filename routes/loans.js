const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Loan = require('../models/Loan');

// apply for loan (user)
router.post('/apply', auth, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || isNaN(amount)) return res.status(400).json({ message: 'Invalid amount' });
    if (amount < 300 || amount > 4000) return res.status(400).json({ message: 'Amount must be between R300 and R4000' });

    const loan = new Loan({ userId: req.user.userId, amount });
    await loan.save();
    return res.json({ message: 'Application submitted', loan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// get my loans
router.get('/my', auth, async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    return res.json({ loans });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
