const express = require("express");
const db = require("../db"); // Import your database connection
const authenticateJWT = require("../middleware/authenticateJWT"); // Import JWT authentication middleware
const axios = require("axios");

const baseURL = "https://vg-direct-backend-1.onrender.com";

const router = express.Router();

// Route: Add or Update a Rating (requires authentication)
router.post("/", authenticateJWT, async (req, res, next) => {
  console.log("POST /api/ratings called");

  try {
    const { game_id, score } = req.body; // `game_id` is the rawg_id passed from the frontend
    const user_id = req.user.user_id; // Use user_id from the decoded token

    // Log incoming data
    console.log("Received data:", { game_id, score, user_id });

    // Validation
    if (!game_id || !score) {
      console.log("Validation failed: game_id or score missing.");
      return res.status(400).json({ error: "game_id and score are required." });
    }

    // Ensure score is a number and within valid range
    const numericScore = parseInt(score, 10);
    if (isNaN(numericScore) || numericScore < 1 || numericScore > 10) {
      console.log("Validation failed: score is not a valid number or out of range.");
      return res.status(400).json({ error: "Score must be a valid number between 1 and 10." });
    }

    // Fetch the game_id from the database
    console.log(`Fetching game_id for rawg_id: ${game_id}`);
    const gameResponse = await axios.get(`${baseURL}/api/games/${game_id}`);
    const dbGameId = gameResponse.data.game_id;
    console.log("Fetched game_id from database:", dbGameId);

    // Insert or Update the Rating
    console.log("Prepared data for database:", { game_id: dbGameId, user_id, score: numericScore });
    const result = await db.query(
      `
      INSERT INTO ratings (game_id, user_id, score)
      VALUES ($1, $2, $3)
      ON CONFLICT (game_id, user_id)
      DO UPDATE SET score = EXCLUDED.score, created_at = CURRENT_TIMESTAMP
      RETURNING game_id, user_id, score;
      `,
      [dbGameId, user_id, numericScore]
    );

    console.log("Rating inserted/updated successfully:", result.rows[0]);
    return res.status(200).json({ rating: result.rows[0] });
  } catch (err) {
    console.error("Error in POST /ratings:", err.response?.data || err.message);

    // Log additional details if available
    if (err.response) {
      console.error("Error details:", {
        status: err.response.status,
        data: err.response.data,
      });
    }

    return next(err);
  }
});

// Route: Get Average Rating for a Game (no authentication required)
router.get("/:game_id/average-rating", async (req, res, next) => {
  try {
    const { game_id } = req.params; // `game_id` here is actually the `rawg_id`
    // console.log("Received game_id (rawg_id):", game_id);

    // Use the `/api/games/:id` route to fetch or add the game and get its `game_id`
    const gameResponse = await axios.get(`${baseURL}/api/games/${game_id}`);
    const actualGameId = gameResponse.data.game_id;

    // Fetch the average rating using the actual `game_id`
    const result = await db.query(
      `
      SELECT ROUND(AVG(score)::numeric, 2) AS average_rating
      FROM ratings
      WHERE game_id = $1;
      `,
      [actualGameId]
    );

    const averageRating = result.rows[0]?.average_rating || 0; // Default to 0 if no ratings
    console.log("Calculated average rating:", averageRating);

    return res.status(200).json({ averageRating });
  } catch (err) {
    console.error("Error in GET /:game_id/average-rating:", err.response?.data || err.message);
    return next(err);
  }
});

// Route: Get a User's Rating for a Game
router.get("/:game_id/:user_id", async (req, res, next) => {
  const { game_id, user_id } = req.params;

  // Validate input parameters
  if (!game_id || !user_id || isNaN(parseInt(user_id))) {
    console.error("Invalid game_id or user_id:", { game_id, user_id });
    return res.status(400).json({ error: "Invalid game_id or user_id" });
  }

  try {
    // Use the `/api/games/:id` route to fetch or add the game and get its `game_id`
    const gameResponse = await axios.get(`${baseURL}/api/games/${game_id}`);
    const actualGameId = gameResponse.data.game_id;

    // Query the ratings table for the actual game_id
    const result = await db.query(
      `
      SELECT score
      FROM ratings
      WHERE game_id = $1 AND user_id = $2;
      `,
      [actualGameId, user_id]
    );

    if (result.rows.length === 0) {
      console.log(`No rating found for user_id: ${user_id} and game_id: ${actualGameId}`);
      return res.status(200).json({ score: null }); // Return null instead of 404
    }

    console.log(`Rating found: ${result.rows[0].score}`);
    return res.status(200).json({ score: result.rows[0].score });
  } catch (err) {
    console.error("Error in GET /:game_id/:user_id:", err.response?.data || err.message);
    return next(err);
  }
});

module.exports = router;
