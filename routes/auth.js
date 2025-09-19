const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Optional: for token-based auth
const User = require('../models/User');

// ========================
// REGISTER NEW USER
// ========================
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  // 1. Validate input
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // 2. Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'user', // default role
      createdAt: new Date()
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ========================
// LOGIN USER
// ========================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // 3. Ensure password exists
    if (!user.password) {
      return res.status(500).json({ error: 'User password not set.' });
    }

    // 4. Compare password safely
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // 5. Optional: generate JWT token
    // const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // 6. Success response
    res.json({
      message: 'Login successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      // token // include if using JWT
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;
