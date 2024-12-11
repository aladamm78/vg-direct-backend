const request = require("supertest");
const express = require("express");
const userRouter = require("./user");
const User = require("../models/user");
const authenticateJWT = require("../middleware/authenticateJWT");

jest.mock("../models/user");
jest.mock("../middleware/authenticateJWT", () => jest.fn((req, res, next) => next()));

const app = express();
app.use(express.json());
app.use("/user", userRouter);

describe("User API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /:username - should fetch user profile", async () => {
    authenticateJWT.mockImplementation((req, res, next) => {
      req.user = { username: "testuser" };
      next();
    });

    const mockUser = { username: "testuser", email: "test@example.com", created_at: "2024-12-11" };

    User.findOne.mockResolvedValue(mockUser);

    const response = await request(app).get("/user/testuser");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUser);
    expect(User.findOne).toHaveBeenCalledWith("testuser");
  });

  test("PUT /:username - should update user profile", async () => {
    authenticateJWT.mockImplementation((req, res, next) => {
      req.user = { username: "testuser" };
      next();
    });

    const mockUpdatedUser = { username: "newuser", email: "new@example.com", created_at: "2024-12-11" };

    User.update.mockResolvedValue(mockUpdatedUser);

    const response = await request(app).put("/user/testuser").send({ email: "new@example.com" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUpdatedUser);
    expect(User.update).toHaveBeenCalledWith("testuser", { email: "new@example.com" });
  });
});
