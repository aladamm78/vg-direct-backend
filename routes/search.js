require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

// Use the key from the .env file or a fallback
const API_KEY = process.env.RAWG_API_KEY || "9aa05b2ff77b476c8ff49505059dd4ed";

// GET /api/search
router.get("/", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    const rawgResponse = await fetch(
      `https://api.rawg.io/api/games?key=${API_KEY}&search=${query}`
    );

    const rawgText = await rawgResponse.text(); // Log the full RAWG API response
    console.log("RAWG API Response:", rawgText);

    const rawgData = JSON.parse(rawgText);

    if (!rawgData.results || rawgData.results.length === 0) {
      return res.status(404).json({ error: "No results found" });
    }

    res.status(200).json(rawgData.results);
  } catch (error) {
    console.error("Error fetching RAWG API data:", error);
    res.status(500).json({ error: "Failed to fetch data from RAWG API" });
  }
});

module.exports = router;
