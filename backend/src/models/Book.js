const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, required: true, unique: true, trim: true },
    genre: { type: String, trim: true },
    publishedYear: { type: Number },
    totalCopies: { type: Number, required: true, min: 1, default: 1 },
    availableCopies: { type: Number, required: true, min: 0, default: 1 },
  },
  { timestamps: true }
);

bookSchema.index({ title: "text", author: "text", genre: "text" });

module.exports = mongoose.model("Book", bookSchema);