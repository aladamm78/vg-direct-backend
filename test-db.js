require("dotenv").config(); // Load environment variables from .env
const { Pool } = require("pg"); // Import the Pool module from pg

// Configure the connection pool
const pool = new Pool({
  host: process.env.SUPABASE_HOST,
  port: process.env.SUPABASE_PORT,
  database: process.env.SUPABASE_DATABASE,
  user: process.env.SUPABASE_USER,
  password: process.env.SUPABASE_PASSWORD,
  ssl: {
    require: true,
    rejectUnauthorized: false, // Required for Supabase connections
  },
});

// Test the connection
pool.query("SELECT * FROM your_table_name LIMIT 1", (err, res) => {
  if (err) {
    console.error("Query error:", err);
  } else {
    console.log("Query result:", res.rows);
  }
});
