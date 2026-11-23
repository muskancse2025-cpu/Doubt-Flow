const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Login / Register (upsert by enrollment)
router.post("/login", async (req, res) => {
  const { name, enrollment, phone } = req.body;
  if (!name || !enrollment || !phone) {
    return res.status(400).json({ error: "Name, enrollment, and phone are required" });
  }

  try {
    let user = await User.findOne({ enrollment });

    if (!user) {
      user = await User.create({ name, enrollment, phone });
    } else {
      // Update name/phone on re-login
      user.name = name;
      user.phone = phone;
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      enrollment: user.enrollment,
      role: user.role,
      isBlocked: user.isBlocked,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed a teacher account (run once)
router.post("/seed-teacher", async (req, res) => {
  try {
    let teacher = await User.findOne({ enrollment: "TEACHER001" });
    if (!teacher) {
      teacher = await User.create({
        name: "Professor",
        enrollment: "TEACHER001",
        phone: "0000000000",
        role: "teacher",
      });
    }
    res.json({ message: "Teacher account ready", teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
