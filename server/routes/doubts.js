const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Doubt = require("../models/Doubt");
const Answer = require("../models/Answer");
const { requireAuth, requireTeacher } = require("../middleware/auth");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/", requireAuth, async (req, res) => {
  try {
    const { filter, scope } = req.query;
    const query = { isDeleted: false };
    if (filter === "resolved") query.isResolved = true;
    if (filter === "unresolved") query.isResolved = false;
    if (scope === "mine") query.author = req.user._id;

    const doubts = await Doubt.find(query).sort({ votes: -1, createdAt: -1 }).lean();

    const doubtIds = doubts.map((d) => d._id);
    const answerCounts = await Answer.aggregate([
      { $match: { doubt: { $in: doubtIds } } },
      { $group: { _id: "$doubt", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    answerCounts.forEach((a) => { countMap[a._id.toString()] = a.count; });

    const isTeacher = req.user.role === "teacher";
    const result = doubts.map((d) => ({
      ...d,
      authorName: isTeacher ? d.authorName : "Universal User",
      hasVoted: d.votedBy.some((id) => id.toString() === req.user._id.toString()),
      answerCount: countMap[d._id.toString()] || 0,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id).lean();
    if (!doubt || doubt.isDeleted) return res.status(404).json({ error: "Not found" });

    const answers = await Answer.find({ doubt: req.params.id })
      .sort({ isVerified: -1, createdAt: 1 }).lean();
    const isTeacher = req.user.role === "teacher";

    res.json({
      ...doubt,
      authorName: isTeacher ? doubt.authorName : "Universal User",
      hasVoted: doubt.votedBy.some((id) => id.toString() === req.user._id.toString()),
      answers: answers.map((a) => ({
        ...a,
        authorName: isTeacher ? a.authorName : "Universal User",
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  const { text, tags } = req.body;
  if (!text) return res.status(400).json({ error: "Doubt text is required" });
  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const doubt = await Doubt.create({
      text,
      imageUrl,
      author: req.user._id,
      authorName: req.user.name,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    });
    res.status(201).json(doubt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/upvote", requireAuth, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt || doubt.isDeleted) return res.status(404).json({ error: "Not found" });
    const userId = req.user._id;
    const alreadyVoted = doubt.votedBy.some((id) => id.toString() === userId.toString());
    if (alreadyVoted) {
      doubt.votedBy = doubt.votedBy.filter((id) => id.toString() !== userId.toString());
      doubt.votes = Math.max(0, doubt.votes - 1);
    } else {
      doubt.votedBy.push(userId);
      doubt.votes += 1;
    }
    await doubt.save();
    res.json({ votes: doubt.votes, hasVoted: !alreadyVoted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/resolve", requireAuth, requireTeacher, async (req, res) => {
  try {
    const doubt = await Doubt.findByIdAndUpdate(req.params.id, { isResolved: true }, { new: true });
    res.json(doubt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", requireAuth, requireTeacher, async (req, res) => {
  try {
    await Doubt.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: "Doubt deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
