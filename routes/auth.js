require('dotenv').config();

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

// Register a new user
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if email or username already exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user into database
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, username",
      [username, email, hashedPassword]
    );

    // Generate JWT token
    const token = jwt.sign(
      { user_id: newUser.rows[0].user_id, username: newUser.rows[0].username },
      SECRET_KEY, // Use the same secret key as in the `.env`
      { expiresIn: "1h" }
    );

    res.status(201).json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error("Error registering user:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// Login a user
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
  
    try {
      // Check if user exists
      const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
      if (user.rows.length === 0) {
        return res.status(400).json({ error: "Invalid credentials" });
      }
  
      // Compare password
      const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { user_id: user.rows[0].user_id, username: user.rows[0].username },
        SECRET_KEY, // Use the same secret key as in the `.env`
        { expiresIn: "1h" }
      );
  
      res.status(200).json({ token, user: { user_id: user.rows[0].user_id, username: user.rows[0].username } });
    } catch (err) {
      console.error("Error logging in user:", err.message);
      res.status(500).json({ error: "Server error" });
    }
  });
  

module.exports = router;
