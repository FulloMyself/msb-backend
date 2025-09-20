// backend/models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed password
  phone: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  documents: {
    idCopy: { type: Array, default: [] },
    payslip: { type: Array, default: [] },
    proofOfResidence: { type: Array, default: [] },
    bankStatement: { type: Array, default: [] }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
