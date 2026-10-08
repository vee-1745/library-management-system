const express = require("express");
const {
  issueBook,
  returnBook,
  getTransactions,
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/", getTransactions);
router.post("/issue", issueBook);
router.put("/:id/return", returnBook);

module.exports = router;