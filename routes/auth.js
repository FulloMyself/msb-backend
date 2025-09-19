// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'verysecret_jwt_key';

// Register (frontend users)
router.post('/register', async (req, res) => {
  try {
    const { name = '', email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: passwordHash, role: 'user' });
    await user.save();

    return res.status(201).json({ message: 'Registered' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Login (both roles)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Support either `password` or legacy `passwordHash` fields in DB
    const storedHash = user.password || user.passwordHash;
    if (!storedHash) return res.status(500).json({ message: 'User has no password set' });

    const ok = await bcrypt.compare(password, storedHash);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // return token + safe user object
    return res.json({
      token,
      user: { id: user._id.toString(), name: user.name || '', email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
