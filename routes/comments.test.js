const request = require("supertest");
const express = require("express");
const commentsRouter = require("./comments");
const commentModel = require("../models/commentModel");
const authenticateJWT = require("../middleware/authenticateJWT");

jest.mock("../models/commentModel");
jest.mock("../middleware/authenticateJWT", () =>
  jest.fn((req, res, next) => {
    req.user = { user_id: 1 }; // Mock authenticated user
    next();
  })
);

const app = express();
app.use(express.json());
app.use("/api", commentsRouter); // Matches `/api` prefix in server.js

// Debugging middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

describe("Comments API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST /api/comments - should create a new comment", async () => {
    const mockComment = {
      comment_id: 1,
      post_id: 1,
      user_id: 1,
      content: "Test comment",
      created_at: "2024-12-11T00:00:00Z",
    };

    // Mock the commentModel's createComment method
    commentModel.createComment.mockResolvedValue(mockComment);

    // Make the POST request
    const response = await request(app).post("/api/comments").send({
      post_id: 1,
      content: "Test comment",
    });

    // Log and assert
    console.log("Response Status:", response.status);
    console.log("Response Body:", response.body);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockComment);
    expect(commentModel.createComment).toHaveBeenCalledWith(1, 1, "Test comment");
  });

  test("POST /api/comments - should return 400 if required fields are missing", async () => {
    // Make the POST request with missing fields
    const response = await request(app).post("/api/comments").send({});

    // Log and assert
    console.log("Response Status:", response.status);
    console.log("Response Body:", response.body);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("post_id and content are required.");
  });

  test("GET /api/comments/:post_id - should fetch all comments for a post", async () => {
    const mockRawComments = [
      { comment_id: 1, content: "Comment 1", parent_comment_id: null },
      { comment_id: 2, content: "Reply to Comment 1", parent_comment_id: 1 },
    ];

    const formattedComments = [
      {
        comment_id: 1,
        content: "Comment 1",
        parent_comment_id: null,
        replies: [
          {
            comment_id: 2,
            content: "Reply to Comment 1",
            parent_comment_id: 1,
            replies: [],
          },
        ],
      },
    ];

    // Mock the commentModel's getCommentsByPostId method
    commentModel.getCommentsByPostId.mockResolvedValue(mockRawComments);

    // Make the GET request
    const response = await request(app).get("/api/comments/1");

    // Log and assert
    console.log("Response Status:", response.status);
    console.log("Response Body:", response.body);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(formattedComments);
    expect(commentModel.getCommentsByPostId).toHaveBeenCalledWith("1");
  });
});
