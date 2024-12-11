const request = require("supertest");
const jwt = require("jsonwebtoken");
const express = require("express");
const authenticateJWT = require("./authenticateJWT");

const SECRET_KEY = process.env.SECRET_KEY || "b17b09...";

// Create a test application with a protected route
const app = express();
app.use(express.json());
app.get("/protected", authenticateJWT, (req, res) => {
  res.status(200).json({ message: "Access granted", user: req.user });
});

describe("authenticateJWT Middleware", () => {
  let validToken;
  let expiredToken;

  beforeAll(() => {
    // Generate a valid token
    validToken = jwt.sign(
      { username: "testuser", isAdmin: false },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Generate an expired token
    expiredToken = jwt.sign(
      { username: "testuser", isAdmin: false },
      SECRET_KEY,
      { expiresIn: "-1h" }
    );
  });

  test("should allow access with a valid token", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Access granted");
    expect(res.body).toHaveProperty("user.username", "testuser");
    expect(res.body).toHaveProperty("user.isAdmin", false);
  });

  test("should deny access without a token", async () => {
    const res = await request(app).get("/protected");

    expect(res.statusCode).toBe(401);
  });

  test("should deny access with an expired token", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.statusCode).toBe(403);
  });

  test("should deny access with an invalid token", async () => {
    const invalidToken = "invalid.token.here";

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${invalidToken}`);

    expect(res.statusCode).toBe(403);
  });

  test("should log proper messages for debugging", async () => {
    const consoleSpy = jest.spyOn(console, "log");

    await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${validToken}`);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization header:",
      `Bearer ${validToken}`
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Authenticated user from token:",
      expect.objectContaining({ username: "testuser", isAdmin: false })
    );

    consoleSpy.mockRestore();
  });
});
