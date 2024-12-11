const request = require("supertest");
const express = require("express");
const searchRouter = require("./search");
const fetch = require("node-fetch");

jest.mock("node-fetch");

process.env.RAWG_API_KEY = "mock_api_key"; // Mock API Key

const app = express();
app.use("/search", searchRouter);

describe("Search API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET / - should fetch search results from RAWG API", async () => {
    const mockResponse = {
      results: [{ id: 1, name: "Game 1" }],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const response = await request(app).get("/search?query=game");

    console.log("Response Status:", response.status);
    console.log("Response Body:", response.body);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse.results);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("key=mock_api_key"));
  });

  test("GET / - should return 400 if query is missing", async () => {
    const response = await request(app).get("/search");

    console.log("Response Status:", response.status);
    console.log("Response Body:", response.body);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Query parameter is required");
  });
});
