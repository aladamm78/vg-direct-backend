const jwt = require('jsonwebtoken');

// Replace this with your actual secret key used in the backend
const SECRET_KEY = process.env.SECRET_KEY || 'b17b092199f992ad177f27d8a2ab3f2567a1f975a49dcb5a42c2ad1f798ee057e6742a6f6a742fea85ec5cbead950ce9ac65a1e0935ad76256f1e61055f9ebb8';

describe('JWT Token Tests', () => {
  let token;

  test('should generate a valid token', () => {
    const payload = { username: 'testuser2', user_id: 28 };
    token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });

    expect(typeof token).toBe('string');
    console.log('Generated Token:', token);
  });

  test('should verify a valid token', () => {
    const decoded = jwt.verify(token, SECRET_KEY);

    expect(decoded.username).toBe('testuser2');
    expect(decoded.user_id).toBe(28);
    console.log('Decoded Token:', decoded);
  });

  test('should fail verification for an invalid token', () => {
    const invalidToken = 'invalid.token.here';
    expect(() => jwt.verify(invalidToken, SECRET_KEY)).toThrow('invalid token');
  });

  test('should fail verification for an expired token', () => {
    const expiredToken = jwt.sign(
      { username: 'testuser2', user_id: 28 },
      SECRET_KEY,
      { expiresIn: '-1s' } // Immediate expiry
    );

    expect(() => jwt.verify(expiredToken, SECRET_KEY)).toThrow('jwt expired');
  });
});
