const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date },
    status: { type: String, enum: ["issued", "returned"], default: "issued" },
    fine: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);