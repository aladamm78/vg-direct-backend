const request = require("supertest");
const express = require("express");
const authRoutes = require("./auth");
const pool = require("../db");

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

// Mock the database pool
jest.mock("../db");

describe("Auth Routes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    it("should register a user successfully", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // No existing user
      pool.query.mockResolvedValueOnce({ 
        rows: [{ user_id: 1, username: "testuser" }] 
      });

      const response = await request(app)
        .post("/auth/register")
        .send({
          username: "testuser",
          email: "test@example.com",
          password: "Password123",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.username).toBe("testuser");
    });

    it("should return error for missing fields", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          username: "",
          email: "",
          password: "",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("All fields are required");
    });

    it("should return error for weak password", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          username: "testuser",
          email: "test@example.com",
          password: "weak",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Password must be at least 8 characters long and include at least one letter and one number"
      );
    });

    it("should return error if user already exists", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ username: "testuser" }] });

      const response = await request(app)
        .post("/auth/register")
        .send({
          username: "testuser",
          email: "test@example.com",
          password: "Password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("User already exists");
    });

    it("should handle server errors gracefully", async () => {
      pool.query.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .post("/auth/register")
        .send({
          username: "testuser",
          email: "test@example.com",
          password: "Password123",
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Server error");
    });
  });
});
