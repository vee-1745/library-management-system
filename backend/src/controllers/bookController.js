const Book = require("../models/Book");
const { asyncHandler } = require("../middleware/errorHandler");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/books?search=&genre=&page=1&limit=10
const getBooks = asyncHandler(async (req, res) => {
  const { search, genre } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);

  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: rx }, { author: rx }, { genre: rx }, { isbn: rx }];
  }
  if (genre) filter.genre = new RegExp(`^${escapeRegex(genre)}$`, "i");

  const [books, total] = await Promise.all([
    Book.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Book.countDocuments(filter),
  ]);

  res.json({ books, page, pages: Math.ceil(total / limit), total });
});

// GET /api/books/:id
const getBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });
  res.json(book);
});

// POST /api/books
const createBook = asyncHandler(async (req, res) => {
  const { title, author, isbn, genre, publishedYear, totalCopies } = req.body;
  const copies = totalCopies || 1;

  const book = await Book.create({
    title,
    author,
    isbn,
    genre,
    publishedYear,
    totalCopies: copies,
    availableCopies: copies,
  });

  res.status(201).json(book);
});

// PUT /api/books/:id
const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });

  const { title, author, isbn, genre, publishedYear, totalCopies } = req.body;

  if (totalCopies !== undefined) {
    const issued = book.totalCopies - book.availableCopies;
    if (totalCopies < issued) {
      return res.status(400).json({
        message: `Cannot set total copies below ${issued} (currently issued)`,
      });
    }
    book.totalCopies = totalCopies;
    book.availableCopies = totalCopies - issued;
  }

  if (title !== undefined) book.title = title;
  if (author !== undefined) book.author = author;
  if (isbn !== undefined) book.isbn = isbn;
  if (genre !== undefined) book.genre = genre;
  if (publishedYear !== undefined) book.publishedYear = publishedYear;

  const updated = await book.save();
  res.json(updated);
});

// DELETE /api/books/:id
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });
  res.json({ message: "Book deleted" });
});

module.exports = { getBooks, getBook, createBook, updateBook, deleteBook };