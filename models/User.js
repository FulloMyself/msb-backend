// backend/models/User.js
const mongoose = require('mongoose');

const documentsSchema = new mongoose.Schema({
  idCopy: { type: mongoose.Schema.Types.Mixed, default: null }, // string or array
  payslip: { type: mongoose.Schema.Types.Mixed, default: null },
  proofOfResidence: { type: mongoose.Schema.Types.Mixed, default: null },
  bankStatement: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed password
  phone: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  documents: { type: documentsSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
