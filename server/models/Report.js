const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doubtId: { type: mongoose.Schema.Types.ObjectId, ref: "Doubt", default: null },
    answerId: { type: mongoose.Schema.Types.ObjectId, ref: "Answer", default: null },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "reviewed", "dismissed"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
