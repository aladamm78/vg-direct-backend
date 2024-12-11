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

  // Add password validation (minimum 8 characters, at least one letter and one number)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long and include at least one letter and one number",
    });
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
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(201).json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error("Error registering user:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});



// Login a user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Query the database for the user by username
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Generate a JWT token if the username and password are valid
    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    console.error("Error in /login route:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

  

module.exports = router;
