const express = require("express");
const router = express.Router();
const Report = require("../models/Report");
const User = require("../models/User");
const { requireAuth, requireTeacher } = require("../middleware/auth");

// POST report a doubt or answer
router.post("/", requireAuth, async (req, res) => {
  const { doubtId, answerId, reason } = req.body;
  if (!reason) return res.status(400).json({ error: "Reason is required" });
  if (!doubtId && !answerId) return res.status(400).json({ error: "Provide doubtId or answerId" });

  try {
    const report = await Report.create({
      reportedBy: req.user._id,
      doubtId: doubtId || null,
      answerId: answerId || null,
      reason,
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all reports (teacher only)
router.get("/", requireAuth, requireTeacher, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reportedBy", "name enrollment")
      .populate("doubtId", "text")
      .populate("answerId", "text")
      .sort({ createdAt: -1 })
      .lean();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update report status (teacher)
router.patch("/:id", requireAuth, requireTeacher, async (req, res) => {
  const { status } = req.body;
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH block a user (teacher)
router.patch("/block/:userId", requireAuth, requireTeacher, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBlocked: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: `User ${user.name} has been blocked` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
