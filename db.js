const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: "aws-0-us-east-1.pooler.supabase.com",
  port: 6543,
  database: "postgres", // Change if your database name is different
  user: "postgres.hgmddkatqfqxssgcliwn",
  password: "WipeOut2048!", // Replace with your password
  ssl: {
    rejectUnauthorized: false, // Supabase requires SSL
  },
});

module.exports = pool;
