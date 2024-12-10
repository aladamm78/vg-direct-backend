require('dotenv').config({ path: '.env.test' }); // Ensure the test environment uses the correct .env
const request = require('supertest');
const jwt = require('jsonwebtoken');
const express = require('express');
const ratingsRouter = require('../routes/ratings.js');
const db = require('../db'); // Mock database connection
const axios = require('axios');

// Mock database and axios
jest.mock('../db', () => ({
  query: jest.fn(),
}));
jest.mock('axios');

// Setup Express App
const app = express();
app.use(express.json());
app.use('/api/ratings', ratingsRouter);

const SECRET_KEY = process.env.SECRET_KEY || 'b17b092199f992ad177f27d8a2ab3f2567a1f975a49dcb5a42c2ad1f798ee057e6742a6f6a742fea85ec5cbead950ce9ac65a1e0935ad76256f1e61055f9ebb8';
const baseURL = "https://vg-direct-backend-1.onrender.com"; // Use the Rendered Backend

// Helper function to generate a valid token
const generateToken = (userPayload) =>
  jwt.sign(userPayload, SECRET_KEY, { expiresIn: '1h' });

describe('Ratings Router', () => {
  let validToken;
  let invalidToken = 'invalid.token.here';
  let expiredToken;

  beforeAll(() => {
    validToken = generateToken({ username: 'testuser', user_id: 1 });
    expiredToken = jwt.sign({ username: 'testuser', user_id: 1 }, SECRET_KEY, { expiresIn: '-1h' });

    // Mock axios.get for game fetching
    axios.get.mockImplementation((url) => {
      if (url.includes(`${baseURL}/api/games/123`)) {
        return Promise.resolve({ data: { game_id: 1 } });
      }
      return Promise.reject(new Error('Not Found'));
    });
  });

  test('POST /api/ratings - Success', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ game_id: 1, user_id: 1, score: 8 }],
    });

    const res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ game_id: 123, score: 8 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('rating');
    expect(res.body.rating.score).toBe(8);
  });

  test('POST /api/ratings - Missing Token', async () => {
    const res = await request(app).post('/api/ratings').send({ game_id: 123, score: 8 });

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/ratings - Invalid Token', async () => {
    const res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${invalidToken}`)
      .send({ game_id: 123, score: 8 });

    expect(res.statusCode).toBe(403);
  });

  test('GET /api/ratings/:game_id/average-rating - Success', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ average_rating: 7.5 }] });

    const res = await request(app).get('/api/ratings/123/average-rating');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('averageRating', 7.5);
  });
});
