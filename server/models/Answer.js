const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    doubt: { type: mongoose.Schema.Types.ObjectId, ref: "Doubt", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, default: "Unknown" },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Answer", answerSchema);
