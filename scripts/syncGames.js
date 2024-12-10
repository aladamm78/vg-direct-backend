const axios = require("axios");
const pool = require("../db"); // Import the PostgreSQL connection

const API_KEY = "9aa05b2ff77b476c8ff49505059dd4ed";

const fetchAndMapGames = async () => {
  try {
    const response = await axios.get("https://api.rawg.io/api/games", {
      params: { key: API_KEY, page_size: 15 },
    });

    const games = response.data.results;

    // Map RAWG API data to match database columns
    const mappedGames = games.map((game) => {
      const platforms = game.platforms.map((p) => p.platform.name).join(", ");
      const releaseYear = game.released ? parseInt(game.released.split("-")[0]) : null;

      return {
        rawg_id: game.id,
        title: game.name,
        platform: platforms,
        release_year: releaseYear,
        genre: null, // You can fetch more detailed data for this
        developer: null, // Not included in the initial response
        description: null, // Not included in the initial response
        image_url: game.background_image,
      };
    });

    return mappedGames;
  } catch (error) {
    console.error("Error fetching games from RAWG API:", error.message);
    throw error;
  }
};

const insertGamesIntoDB = async (games) => {
  for (const game of games) {
    try {
      await pool.query(
        `INSERT INTO games (rawg_id, title, platform, release_year, genre, developer, description, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (rawg_id) DO NOTHING`,
        [
          game.rawg_id,
          game.title,
          game.platform,
          game.release_year,
          game.genre,
          game.developer,
          game.description,
          game.image_url,
        ]
      );
    } catch (error) {
      console.error(`Error inserting game ${game.title}:`, error.message);
    }
  }
};

const syncGames = async () => {
  const games = await fetchAndMapGames();
  await insertGamesIntoDB(games);
  console.log("Games synchronized successfully!");
  process.exit(); // Exit the script
};

syncGames();
