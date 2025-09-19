const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  documents: {
    idCopy: [String],
    payslip: [String],
    proofOfResidence: [String],
    bankStatement: [String]
  }
});

module.exports = mongoose.model('User', UserSchema);
