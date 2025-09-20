// backend/routes/roleRoles.js
const express = require("express");
const auth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");
const router = express.Router();

// 🟢 Route for normal users (must be logged in as "user")
router.get("/profile", auth, roleAuth("user"), (req, res) => {
  res.json({ message: "Welcome normal user!", user: req.user });
});

// 🔴 Route for admins only
router.get("/admin/dashboard", auth, roleAuth("admin"), (req, res) => {
  res.json({ message: "Welcome admin!", user: req.user });
});

// 🔵 Route accessible by both
router.get("/shared", auth, roleAuth(["admin", "user"]), (req, res) => {
  res.json({ message: "Both roles can see this" });
});

module.exports = router;
