const express = require("express");
const router = express.Router();
const User = require("../models/user");
const authenticateJWT = require("../middleware/authenticateJWT");

// Middleware to authenticate user requests
router.use(authenticateJWT);

// GET route to fetch user profile by username
router.get("/user/:username", async (req, res, next) => {
  try {
    const username = req.params.username;
    if (req.user.username !== username) {
      return res.status(403).json({ error: "You are not authorized to view this profile" });
    }

    const user = await User.findOne(username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      username: user.username,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
