require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const { protect } = require("./src/middleware/authMiddleware");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing in .env");
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Library Management API is running" });
});

// Public
app.use("/api/auth", require("./src/routes/authRoutes"));

// Protected: a valid token is required for everything below
app.use("/api/books", protect, require("./src/routes/bookRoutes"));
app.use("/api/members", protect, require("./src/routes/memberRoutes"));
app.use("/api/transactions", protect, require("./src/routes/transactionRoutes"));
app.use("/api/dashboard", protect, require("./src/routes/dashboardRoutes"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});