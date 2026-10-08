const express = require("express");
const {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
} = require("../controllers/memberController");

const router = express.Router();

router.route("/").get(getMembers).post(createMember);
router.route("/:id").get(getMember).put(updateMember).delete(deleteMember);

module.exports = router;