const express = require("express");
const db = require("../db"); // Database connection
const authenticateJWT = require("../middleware/authenticateJWT"); // JWT authentication middleware

const router = express.Router();

// Route: Fetch reviews for a specific game
router.get("/reviews/:rawg_id", async (req, res) => {
  const { rawg_id } = req.params;

  try {
    // Fetch the game_id from the database using the rawg_id
    const gameResult = await db.query(
      `SELECT game_id FROM games WHERE rawg_id = $1`,
      [rawg_id]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: "Game not found in the database" });
    }

    const { game_id } = gameResult.rows[0];

    // Fetch reviews for the game_id
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
    const { user_id } = req.user; // Extract user details from JWT payload
  
    if (!rawg_id || !review_text) {
      return res.status(400).json({ error: "rawg_id and review_text are required" });
    }
  
    try {
      // Fetch the game_id from the database using the rawg_id
      const gameResult = await db.query(
        `SELECT game_id FROM games WHERE rawg_id = $1`,
        [rawg_id]
      );
  
      if (gameResult.rows.length === 0) {
        return res.status(404).json({ error: "Game not found in the database" });
      }
  
      const { game_id } = gameResult.rows[0];
  
      // Check if the user has already reviewed this game
      const existingReview = await db.query(
        `SELECT review_id FROM reviews WHERE user_id = $1 AND game_id = $2`,
        [user_id, game_id]
      );
  
      if (existingReview.rows.length > 0) {
        return res.status(400).json({
          error: "You have already reviewed this game. Please edit your existing review.",
        });
      }
  
      // Insert the review into the database
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


// Route: Delete a review (requires authentication and ownership)
router.delete("/reviews/:review_id", authenticateJWT, async (req, res) => {
  const { review_id } = req.params;
  const { user_id } = req.user;

  try {
    // Ensure the review belongs to the authenticated user
    const review = await db.query(
      `
      SELECT * 
      FROM reviews 
      WHERE review_id = $1 AND user_id = $2
      `,
      [review_id, user_id]
    );

    if (review.rows.length === 0) {
      return res.status(403).json({ error: "You are not authorized to delete this review" });
    }

    // Delete the review
    await db.query(`DELETE FROM reviews WHERE review_id = $1`, [review_id]);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error.message);
    res.status(500).json({ error: "Failed to delete review" });
  }
});


// Route: Fetch all reviews by a specific user
router.get("/reviews/user/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    // Fetch reviews written by the specific user
    const reviews = await db.query(
      `
      SELECT r.review_id, r.review_text, r.created_at, 
             g.title AS game_title, g.rawg_id
      FROM reviews r
      JOIN games g ON r.game_id = g.game_id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      `,
      [user_id]
    );

    // If no reviews found, respond with an empty array
    if (reviews.rows.length === 0) {
      return res.status(200).json([]); // Return an empty array
    }

    res.json(reviews.rows);
  } catch (error) {
    console.error("Error fetching user reviews:", error.message);
    res.status(500).json({ error: "Failed to fetch user reviews" });
  }
});


// Route: Edit an existing review (requires authentication)
router.put("/reviews/:review_id", authenticateJWT, async (req, res) => {
    const { review_id } = req.params;
    const { review_text } = req.body;
    const { user_id } = req.user; // Extract user details from JWT
  
    if (!review_text) {
      return res.status(400).json({ error: "review_text is required" });
    }
  
    try {
      // Check if the review exists and belongs to the authenticated user
      const review = await db.query(
        `SELECT * FROM reviews WHERE review_id = $1 AND user_id = $2`,
        [review_id, user_id]
      );
  
      if (review.rows.length === 0) {
        return res.status(403).json({ error: "You are not authorized to edit this review" });
      }
  
      // Update the review text in the database
      const result = await db.query(
        `
        UPDATE reviews
        SET review_text = $1, created_at = NOW() -- Update timestamp as well
        WHERE review_id = $2
        RETURNING *;
        `,
        [review_text, review_id]
      );
  
      res.status(200).json({ review: result.rows[0] });
    } catch (error) {
      console.error("Error editing review:", error.message);
      res.status(500).json({ error: "Failed to edit review" });
    }
  });

module.exports = router;
