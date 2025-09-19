const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 300, max: 4000 },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Loan', loanSchema);
