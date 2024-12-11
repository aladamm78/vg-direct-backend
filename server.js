const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const pool = require("./db"); 

const forumRoutes = require("./routes/forum");
const genresRoutes = require("./routes/genres");
const profileRoutes = require("./routes/profile");
const authRoutes = require("./routes/auth");
const ratingsRoutes = require("./routes/ratings"); 
const userRoutes = require('./routes/user');
const commentsRoutes = require('./routes/comments');
const reviewsRoutes = require('./routes/reviews');
const searchRoutes = require("./routes/search");

const app = express();

module.exports = app;

if (process.env.NODE_ENV !== "test") {
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
}

const BASE_URL = "https://api.rawg.io/api";
const API_KEY = "9aa05b2ff77b476c8ff49505059dd4ed";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/forum-posts", forumRoutes);
app.use("/api/genres", genresRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ratings", ratingsRoutes); // Use Ratings Router
app.use('/api/users', userRoutes);
app.use('/api', commentsRoutes);
app.use('/api', reviewsRoutes);
app.use("/api/search", searchRoutes);

// RAWG API routes
app.get("/api/games", async (req, res) => {
  try {
    const { search = "", page = 1, page_size = 40 } = req.query;
    const response = await axios.get(`${BASE_URL}/games`, {
      params: {
        key: API_KEY,
        search,
        page,
        page_size,
      },
    });
    console.log("RAWG API Response:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching games:", error.message);
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

app.get("/api/games/:id", async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Fetching game details for rawg_id: ${id}`);

    // Check if the game already exists in the database
    const gameQuery = `
      SELECT * 
      FROM games 
      WHERE rawg_id = $1
    `;
    const gameResult = await pool.query(gameQuery, [id]);

    if (gameResult.rows.length > 0) {
      console.log(`Game exists in database. rawg_id: ${id}`);
      return res.json(gameResult.rows[0]); // Return existing game
    }

    // Fetch game details from RAWG API if not found
    const axiosConfig = {
      timeout: 10000,
      params: { key: API_KEY },
    };

    const rawgResponse = await axios.get(`${BASE_URL}/games/${id}`, axiosConfig);
    const data = rawgResponse.data;

    const description = data.description_raw || data.description || "No description available";
    const truncatedDescription =
      description.length > 300 ? `${description.substring(0, 300)}...` : description;

    const platforms = data.platforms
      ? data.platforms.map((p) => p.platform.name).join(", ")
      : "Unknown";
    const genres = data.genres
      ? data.genres.map((g) => g.name).join(", ")
      : "Unknown";
    const developers = data.developers
      ? data.developers.map((dev) => dev.name).join(", ")
      : "Unknown";

    const gameData = {
      rawg_id: id,
      title: data.name || "Unknown",
      description: truncatedDescription,
      platform: platforms,
      release_year: data.released ? parseInt(data.released.split("-")[0]) : null,
      genre: genres,
      developer: developers,
      image_url: data.background_image || "",
    };
    console.log(`[DEBUG] Preparing to insert game into database:`, gameData);
    console.log(`Inserting new game into database. rawg_id: ${id}`);
    const insertGameQuery = `
      INSERT INTO games (game_id, rawg_id, title, description, platform, release_year, genre, developer, image_url)
      VALUES (nextval('games_game_id_seq'), $1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const insertResult = await pool.query(insertGameQuery, [
      id,
      gameData.title,
      gameData.description,
      gameData.platform,
      gameData.release_year,
      gameData.genre,
      gameData.developer,
      gameData.image_url,
    ]);

    console.log(`Game successfully inserted. rawg_id: ${id}`);
    return res.json(insertResult.rows[0]); // Return inserted game
  } catch (error) {
    console.error("Error fetching game details:", error.message, error.stack);
    res.status(500).json({ error: "Failed to fetch or insert game details" });
  }
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const corsOptions = {
  origin: [
    "https://your-frontend-live-url.onrender.com", 
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true, // If cookies or authentication are used
};

app.use(cors(corsOptions));
