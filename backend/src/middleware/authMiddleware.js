const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { asyncHandler } = require("./errorHandler");

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Not authorized, invalid or expired token" });
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    return res.status(401).json({ message: "Not authorized, user no longer exists" });
  }

  req.user = user;
  next();
});

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  res.status(403).json({ message: "Admin access required" });
};

module.exports = { protect, adminOnly };