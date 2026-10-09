const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/login   body: { email, password }
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  // Same message for unknown email and wrong password, on purpose
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({
    token: signToken(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

module.exports = { login, getMe };