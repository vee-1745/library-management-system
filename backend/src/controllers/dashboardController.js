const Book = require("../models/Book");
const Member = require("../models/Member");
const Transaction = require("../models/Transaction");
const { asyncHandler } = require("../middleware/errorHandler");

// GET /api/dashboard
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    bookTotals,
    totalMembers,
    activeMembers,
    issuedNow,
    overdueNow,
    fineTotals,
    genres,
    topBooks,
    monthly,
  ] = await Promise.all([
    // Copies across the whole catalogue
    Book.aggregate([
      {
        $group: {
          _id: null,
          titles: { $sum: 1 },
          totalCopies: { $sum: "$totalCopies" },
          availableCopies: { $sum: "$availableCopies" },
        },
      },
    ]),

    Member.countDocuments(),
    Member.countDocuments({ isActive: true }),

    Transaction.countDocuments({ status: "issued" }),
    Transaction.countDocuments({ status: "issued", dueDate: { $lt: now } }),

    // Total fines collected from returned books
    Transaction.aggregate([
      { $match: { status: "returned" } },
      { $group: { _id: null, totalFines: { $sum: "$fine" } } },
    ]),

    // Titles per genre (top 5)
    Book.aggregate([
      { $match: { genre: { $nin: [null, ""] } } },
      { $group: { _id: "$genre", titles: { $sum: 1 }, copies: { $sum: "$totalCopies" } } },
      { $sort: { titles: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, genre: "$_id", titles: 1, copies: 1 } },
    ]),

    // Most borrowed books: group, then join with books using $lookup
    Transaction.aggregate([
      { $group: { _id: "$book", timesIssued: { $sum: 1 } } },
      { $sort: { timesIssued: -1 } },
      { $limit: 5 },
      { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "book" } },
      { $unwind: "$book" },
      {
        $project: {
          _id: 0,
          bookId: "$book._id",
          title: "$book.title",
          author: "$book.author",
          timesIssued: 1,
        },
      },
    ]),

    // Books issued per month, last 6 months
    Transaction.aggregate([
      { $match: { issueDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$issueDate", timezone: "Asia/Kolkata" } },
          issued: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: "$_id", issued: 1 } },
    ]),
  ]);

  const totals = bookTotals[0] || { titles: 0, totalCopies: 0, availableCopies: 0 };

  res.json({
    books: {
      titles: totals.titles,
      totalCopies: totals.totalCopies,
      availableCopies: totals.availableCopies,
      issuedCopies: totals.totalCopies - totals.availableCopies,
    },
    members: { total: totalMembers, active: activeMembers },
    transactions: { currentlyIssued: issuedNow, overdue: overdueNow },
    fines: { totalCollected: fineTotals[0]?.totalFines || 0 },
    genres,
    topBooks,
    monthly,
  });
});

module.exports = { getStats };