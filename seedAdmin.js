require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) { console.log('Admin already exists'); process.exit(0); }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const admin = new User({ email: ADMIN_EMAIL, passwordHash, role: 'admin' });
    await admin.save();
    console.log('Admin created:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
