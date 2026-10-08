const Member = require("../models/Member");
const Transaction = require("../models/Transaction");
const { asyncHandler } = require("../middleware/errorHandler");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/members?search=&page=1&limit=10
const getMembers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);

  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(String(search)), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [members, total] = await Promise.all([
    Member.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Member.countDocuments(filter),
  ]);

  res.json({ members, page, pages: Math.ceil(total / limit), total });
});

// GET /api/members/:id
const getMember = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: "Member not found" });
  res.json(member);
});

// POST /api/members
const createMember = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const member = await Member.create({ name, email, phone });
  res.status(201).json(member);
});

// PUT /api/members/:id
const updateMember = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: "Member not found" });

  const { name, email, phone, isActive } = req.body;
  if (name !== undefined) member.name = name;
  if (email !== undefined) member.email = email;
  if (phone !== undefined) member.phone = phone;
  if (isActive !== undefined) member.isActive = isActive;

  res.json(await member.save());
});

// DELETE /api/members/:id
const deleteMember = asyncHandler(async (req, res) => {
  const hasBooks = await Transaction.exists({ member: req.params.id, status: "issued" });
  if (hasBooks) {
    return res.status(400).json({ message: "Member still has issued books" });
  }

  const member = await Member.findByIdAndDelete(req.params.id);
  if (!member) return res.status(404).json({ message: "Member not found" });
  res.json({ message: "Member deleted" });
});

module.exports = { getMembers, getMember, createMember, updateMember, deleteMember };