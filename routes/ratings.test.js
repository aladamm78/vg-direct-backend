const request = require("supertest");
const express = require("express");
const ratingsRouter = require("./ratings");
const db = require("../db");
const authenticateJWT = require("../middleware/authenticateJWT");

jest.mock("../db");
jest.mock("../middleware/authenticateJWT", () => jest.fn((req, res, next) => next()));

const app = express();
app.use(express.json());
app.use("/ratings", ratingsRouter);

describe("Ratings API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST / - should add or update a rating", async () => {
    authenticateJWT.mockImplementation((req, res, next) => {
      req.user = { user_id: 1 };
      next();
    });

    db.query.mockResolvedValueOnce({ rows: [{ game_id: 1, user_id: 1, score: 9 }] });

    const response = await request(app).post("/ratings").send({
      game_id: 1,
      score: 9,
    });

    expect(response.status).toBe(200);
    expect(response.body.rating).toEqual({ game_id: 1, user_id: 1, score: 9 });
    expect(db.query).toHaveBeenCalled();
  });

  test("GET /:game_id/average-rating - should fetch average rating for a game", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ average_rating: 8.5 }] });

    const response = await request(app).get("/ratings/1/average-rating");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ averageRating: 8.5 });
    expect(db.query).toHaveBeenCalled();
  });
});
