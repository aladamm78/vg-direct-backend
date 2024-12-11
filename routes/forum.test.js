const request = require("supertest");
const express = require("express");
const forumRouter = require("./forum");
const pool = require("../db");

jest.mock("../db");

const app = express();
app.use(express.json());
app.use("/forum", forumRouter);

describe("Forum API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET / - should fetch all forum posts", async () => {
    const mockPosts = [
      { post_id: 1, title: "Post 1", comment_count: 2 },
      { post_id: 2, title: "Post 2", comment_count: 0 },
    ];

    pool.query.mockResolvedValueOnce({ rows: mockPosts });

    const response = await request(app).get("/forum");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockPosts);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String));
  });

  test("POST / - should create a new forum post", async () => {
    const mockPost = {
      post_id: 1,
      user_id: 1,
      game_id: 1,
      title: "Test Post",
      body: "Test Content",
    };

    pool.query.mockResolvedValueOnce({ rows: [mockPost] });

    const response = await request(app).post("/forum").send({
      user_id: 1,
      game_id: 1,
      title: "Test Post",
      body: "Test Content",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockPost);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO forum_posts"),
      [1, 1, "Test Post", "Test Content"]
    );
  });

  test("GET /search - should search forum posts by title or body", async () => {
    const mockResults = [{ post_id: 1, title: "Post 1", comment_count: 3 }];

    pool.query.mockResolvedValueOnce({ rows: mockResults });

    const response = await request(app).get("/forum/search?query=Post");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResults);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ["%Post%"]);
  });
});
