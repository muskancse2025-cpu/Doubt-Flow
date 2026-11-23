const User = require("../models/User");

const requireAuth = async (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    if (user.isBlocked) return res.status(403).json({ error: "Account blocked" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid user" });
  }
};

const requireTeacher = (req, res, next) => {
  if (req.user?.role !== "teacher") {
    return res.status(403).json({ error: "Teacher access required" });
  }
  next();
};

module.exports = { requireAuth, requireTeacher };
