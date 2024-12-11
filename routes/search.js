const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    console.log("Query parameter:", query);

    const apiUrl = `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${query}`;
    console.log("API URL:", apiUrl);

    const response = await fetch(apiUrl);
    console.log("RAWG API Response:", response);

    if (!response.ok) {
      console.error("RAWG API returned an error:", response.statusText || "Unknown error");
      return res.status(response.status || 500).json({ error: "Failed to fetch from RAWG API" });
    }

    const data = await response.json();
    console.log("RAWG API Data:", data);

    res.status(200).json(data.results);
  } catch (err) {
    console.error("Error in search route:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
