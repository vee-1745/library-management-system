// Wraps async route handlers so thrown errors reach the error handler
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || "Server error";

  // Invalid ObjectId, e.g. /api/books/abc
  if (err.name === "CastError") {
    status = 400;
    message = "Invalid ID format";
  }

  // Schema validation failed
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  // Duplicate value on a unique field (isbn, email)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field} already exists`;
  }

  res.status(status).json({ message });
};

module.exports = { asyncHandler, notFound, errorHandler };