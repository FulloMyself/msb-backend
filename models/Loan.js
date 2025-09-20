const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "under-review", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },

  // Add this 👇
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Loan", loanSchema);
