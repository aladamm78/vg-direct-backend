const request = require("supertest");
const express = require("express");
const profileRouter = require("./profile");
const User = require("../models/user");
const authenticateJWT = require("../middleware/authenticateJWT");

jest.mock("../models/user");
jest.mock("../middleware/authenticateJWT", () => jest.fn((req, res, next) => next()));

const app = express();
app.use(express.json());
app.use("/profile", profileRouter);

describe("Profile API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /user/:username - should fetch user profile", async () => {
    authenticateJWT.mockImplementation((req, res, next) => {
      req.user = { username: "testuser" };
      next();
    });

    const mockUser = {
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      email: "testuser@example.com",
    };

    User.findOne.mockResolvedValue(mockUser);

    const response = await request(app).get("/profile/user/testuser");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUser);
    expect(User.findOne).toHaveBeenCalledWith("testuser");
  });

  test("GET /user/:username - should return 403 if unauthorized", async () => {
    authenticateJWT.mockImplementation((req, res, next) => {
      req.user = { username: "anotheruser" };
      next();
    });

    const response = await request(app).get("/profile/user/testuser");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("You are not authorized to view this profile");
  });
});
