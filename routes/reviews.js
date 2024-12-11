// Backend: routes/reviews.js
require('dotenv').config();
const express = require("express");
const db = require("../db"); // Database connection
const authenticateJWT = require("../middleware/authenticateJWT"); // JWT authentication middleware

const router = express.Router();

// Route: Fetch reviews for a specific game
router.get("/reviews/:rawg_id", async (req, res) => {
  const { rawg_id } = req.params;

  try {
    const gameResult = await db.query(
      `SELECT game_id FROM games WHERE rawg_id = $1`,
      [rawg_id]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: "Game not found in the database" });
    }

    const { game_id } = gameResult.rows[0];

    const reviews = await db.query(
      `
      SELECT r.review_id, r.review_text, r.created_at, 
             u.user_id, u.username
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.game_id = $1
      `,
      [game_id]
    );

    res.json(reviews.rows);
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Route: Add a new review for a game (requires authentication)
router.post("/reviews", authenticateJWT, async (req, res) => {
  const { rawg_id, review_text } = req.body;
  const { user_id } = req.user;

  if (!rawg_id || !review_text) {
    return res.status(400).json({ error: "rawg_id and review_text are required" });
  }

  try {
    const gameResult = await db.query(
      `SELECT game_id FROM games WHERE rawg_id = $1`,
      [rawg_id]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: "Game not found in the database" });
    }

    const { game_id } = gameResult.rows[0];

    const existingReview = await db.query(
      `SELECT review_id FROM reviews WHERE user_id = $1 AND game_id = $2`,
      [user_id, game_id]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({
        error: "You have already reviewed this game. Please edit your existing review.",
      });
    }

    const result = await db.query(
      `
      INSERT INTO reviews (game_id, user_id, review_text)
      VALUES ($1, $2, $3)
      RETURNING review_id, game_id, user_id, review_text, created_at
      `,
      [game_id, user_id, review_text]
    );

    res.status(201).json({ review: result.rows[0], username: req.user.username });
  } catch (error) {
    console.error("Error adding review:", error.message);
    res.status(500).json({ error: "Failed to add review" });
  }
});

module.exports = router;
