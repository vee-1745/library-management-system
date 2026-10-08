const Book = require("../models/Book");
const Member = require("../models/Member");
const Transaction = require("../models/Transaction");
const { asyncHandler } = require("../middleware/errorHandler");

const FINE_PER_DAY = 5; // rupees per overdue day
const MAX_BOOKS_PER_MEMBER = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const populateOpts = [
  { path: "book", select: "title author isbn" },
  { path: "member", select: "name email" },
];

// POST /api/transactions/issue   body: { bookId, memberId, days? }
const issueBook = asyncHandler(async (req, res) => {
  const { bookId, memberId } = req.body;
  const days = parseInt(req.body.days) || 14;

  if (!bookId || !memberId) {
    return res.status(400).json({ message: "bookId and memberId are required" });
  }
  if (days < 1 || days > 60) {
    return res.status(400).json({ message: "days must be between 1 and 60" });
  }

  const member = await Member.findById(memberId);
  if (!member) return res.status(404).json({ message: "Member not found" });
  if (!member.isActive) return res.status(400).json({ message: "Member is inactive" });

  const alreadyHas = await Transaction.findOne({ book: bookId, member: memberId, status: "issued" });
  if (alreadyHas) {
    return res.status(400).json({ message: "Member already has a copy of this book" });
  }

  const activeCount = await Transaction.countDocuments({ member: memberId, status: "issued" });
  if (activeCount >= MAX_BOOKS_PER_MEMBER) {
    return res.status(400).json({ message: `Limit reached: ${MAX_BOOKS_PER_MEMBER} books per member` });
  }

  // Atomic: only decrements if a copy is still available
  const book = await Book.findOneAndUpdate(
    { _id: bookId, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { new: true }
  );

  if (!book) {
    const exists = await Book.exists({ _id: bookId });
    return res
      .status(exists ? 400 : 404)
      .json({ message: exists ? "No copies available" : "Book not found" });
  }

  try {
    const tx = await Transaction.create({
      book: book._id,
      member: member._id,
      dueDate: new Date(Date.now() + days * DAY_MS),
    });
    await tx.populate(populateOpts);
    res.status(201).json(tx);
  } catch (err) {
    // Undo the decrement if the transaction record failed
    await Book.findByIdAndUpdate(book._id, { $inc: { availableCopies: 1 } });
    throw err;
  }
});

// PUT /api/transactions/:id/return
const returnBook = asyncHandler(async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx) return res.status(404).json({ message: "Transaction not found" });
  if (tx.status === "returned") {
    return res.status(400).json({ message: "Book already returned" });
  }

  const now = new Date();
  const overdueDays = now > tx.dueDate ? Math.ceil((now - tx.dueDate) / DAY_MS) : 0;
  const fine = overdueDays * FINE_PER_DAY;

  // Condition on status so a double-click can't return twice
  const updated = await Transaction.findOneAndUpdate(
    { _id: tx._id, status: "issued" },
    { status: "returned", returnDate: now, fine },
    { new: true }
  ).populate(populateOpts);

  if (!updated) return res.status(400).json({ message: "Book already returned" });

  await Book.findByIdAndUpdate(tx.book, { $inc: { availableCopies: 1 } });

  res.json({ transaction: updated, overdueDays, fine });
});

// GET /api/transactions?status=&member=&book=&overdue=true&page=1&limit=10
const getTransactions = asyncHandler(async (req, res) => {
  const { status, member, book, overdue } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);

  const filter = {};
  if (status) filter.status = String(status);
  if (member) filter.member = String(member);
  if (book) filter.book = String(book);
  if (overdue === "true") {
    filter.status = "issued";
    filter.dueDate = { $lt: new Date() };
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate(populateOpts)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  res.json({ transactions, page, pages: Math.ceil(total / limit), total });
});

module.exports = { issueBook, returnBook, getTransactions };