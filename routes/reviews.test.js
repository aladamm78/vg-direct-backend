const request = require("supertest");
const app = require("../server");
const db = require("../db"); // Your database connection
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY || "b17b09..."; // Your secret key for JWT

const generateToken = (user) => {
  return jwt.sign({ username: user.username, user_id: user.user_id }, SECRET_KEY);
};

describe("Reviews Routes", () => {
  let token;
  let testUser;
  let testGameId;

  beforeAll(async () => {
    // Create a test user
    const result = await db.query(`
      INSERT INTO users (username, email, password_hash)
      VALUES ('testuser', 'testuser@example.com', '$2b$10$hashedpassword123')
      RETURNING *`);

    if (result.rows.length > 0) {
      testUser = result.rows[0];
    } else {
      console.error("Failed to create test user");
    }

    token = generateToken(testUser); // Generate a valid token for this user

    // Add a game to the database for review testing
    const gameResult = await db.query(`
      INSERT INTO games (rawg_id, title, description, platform)
      VALUES (12345, 'Test Game', 'A test game description', 'PC')
      RETURNING game_id`);
    testGameId = gameResult.rows[0].game_id;
  });

  afterAll(async () => {
    if (testUser && testUser.user_id) {
      await db.query("DELETE FROM reviews WHERE user_id = $1", [testUser.user_id]);
      await db.query("DELETE FROM users WHERE user_id = $1", [testUser.user_id]);
    }
    await db.query("DELETE FROM games WHERE rawg_id = 12345");
  });

  test("POST /api/reviews should allow an authenticated user to add a review", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({
        rawg_id: 12345,
        review_text: "Great game!"
      });
    
    expect(res.status).toBe(201);
    expect(res.body.review).toHaveProperty("review_id");
    expect(res.body.username).toBe(testUser.username);
  });

  test("POST /api/reviews should return 400 if rawg_id or review_text is missing", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({
        rawg_id: 12345
      });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("rawg_id and review_text are required");
  });

  test("GET /api/reviews/:rawg_id should fetch reviews for a specific game", async () => {
    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({
        rawg_id: 12345,
        review_text: "Amazing!"
      });

    const res = await request(app)
      .get("/api/reviews/12345");
    
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("review_text");
  });
});
