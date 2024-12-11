const request = require("supertest");
const express = require("express");
const genresRouter = require("./genres");
const pool = require("../db");

jest.mock("../db");

const app = express();
app.use(express.json());
app.use("/genres", genresRouter);

describe("Genres API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET / - should fetch all genres", async () => {
    const mockGenres = [{ genre_id: 1, name: "Action" }, { genre_id: 2, name: "Adventure" }];

    pool.query.mockResolvedValueOnce({ rows: mockGenres });

    const response = await request(app).get("/genres");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockGenres);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM genres"));
  });
});
