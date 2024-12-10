const request = require('supertest');
const jwt = require('jsonwebtoken');
const express = require('express');
const authenticateJWT = require('./middleware/authenticateJWT');

const SECRET_KEY = process.env.SECRET_KEY || 'b17b092199f992ad177f27d8a2ab3f2567a1f975a49dcb5a42c2ad1f798ee057e6742a6f6a742fea85ec5cbead950ce9ac65a1e0935ad76256f1e61055f9ebb8';

// Create a test app
const app = express();
app.use(express.json());

// Protected route
app.get('/protected', authenticateJWT, (req, res) => {
  res.status(200).json({ message: 'Access granted', user: req.user });
});

// Test cases
describe('authenticateJWT Middleware', () => {
  let validToken;
  let expiredToken;

  beforeAll(() => {
    // Generate a valid token
    validToken = jwt.sign({ username: 'testuser', isAdmin: false }, SECRET_KEY, { expiresIn: '1h' });
    console.log('Generated Valid Token:', validToken);

    // Generate an expired token
    expiredToken = jwt.sign({ username: 'testuser', isAdmin: false }, SECRET_KEY, { expiresIn: '-1h' });
    console.log('Generated Expired Token:', expiredToken);
  });

  test('should allow access with a valid token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${validToken}`);

    console.log('Validating Token:', validToken);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Access granted');
    expect(res.body).toHaveProperty('user.username', 'testuser');
  });

  test('should deny access without a token', async () => {
    const res = await request(app).get('/protected');
    console.log('No token provided for this request.');
    expect(res.statusCode).toBe(401);
  });

  test('should deny access with an invalid token', async () => {
    const invalidToken = 'invalid.token.here';
    console.log('Testing with Invalid Token:', invalidToken);

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${invalidToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('should deny access with an expired token', async () => {
    console.log('Testing with Expired Token:', expiredToken);

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.statusCode).toBe(403);
  });
});