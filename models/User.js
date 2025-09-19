const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user','admin'], default: 'user' },
  documents: {
    idCopy: { type: String, default: '' },
    payslip: { type: String, default: '' },
    proofOfResidence: { type: String, default: '' },
    bankStatement: { type: [String], default: [] } // up to 3
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
