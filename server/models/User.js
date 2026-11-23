const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    enrollment: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: ["student", "teacher"], default: "student" },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
