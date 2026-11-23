const express = require("express");
const router = express.Router();
const Answer = require("../models/Answer");
const Doubt = require("../models/Doubt");
const { requireAuth, requireTeacher } = require("../middleware/auth");

// POST submit an answer to a doubt
router.post("/:doubtId", requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Answer text is required" });

  try {
    const doubt = await Doubt.findById(req.params.doubtId);
    if (!doubt || doubt.isDeleted) return res.status(404).json({ error: "Doubt not found" });

    const answer = await Answer.create({
      text,
      doubt: req.params.doubtId,
      author: req.user._id,
      authorName: req.user.name,
    });

    res.status(201).json(answer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET answers for a doubt
router.get("/:doubtId", requireAuth, async (req, res) => {
  try {
    const answers = await Answer.find({ doubt: req.params.doubtId })
      .sort({ isVerified: -1, createdAt: 1 })
      .lean();

    const isTeacher = req.user.role === "teacher";
    const result = answers.map((a) => ({
      ...a,
      authorName: isTeacher ? a.authorName : "Universal User",
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH verify an answer (teacher only)
router.patch("/:answerId/verify", requireAuth, requireTeacher, async (req, res) => {
  try {
    const answer = await Answer.findByIdAndUpdate(
      req.params.answerId,
      { isVerified: true, verifiedBy: req.user._id },
      { new: true }
    );
    if (!answer) return res.status(404).json({ error: "Answer not found" });
    res.json(answer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE an answer (teacher only)
router.delete("/:answerId", requireAuth, requireTeacher, async (req, res) => {
  try {
    await Answer.findByIdAndDelete(req.params.answerId);
    res.json({ message: "Answer deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
