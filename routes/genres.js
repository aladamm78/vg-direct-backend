const express = require("express");
const pool = require("../db"); // Ensure the database connection is imported
const router = express.Router();

// Get all genres
router.get("/", async (req, res) => {
    console.log("Fetching genres..."); // Add this here
    try {
      const result = await pool.query(`SELECT * FROM genres ORDER BY name ASC`);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching genres:", error.message);
      res.status(500).send("Server error");
    }
  });

module.exports = router;
