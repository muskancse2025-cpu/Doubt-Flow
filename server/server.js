require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/doubts", require("./routes/doubts"));
app.use("/api/answers", require("./routes/answers"));
app.use("/api/reports", require("./routes/reports"));

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/doubtplatform";

// Database connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB connected successfully!"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Server listener (Moved outside for faster deployment)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});