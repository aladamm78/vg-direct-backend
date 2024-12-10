const jwt = require('jsonwebtoken');

// Replace this with your actual secret key used in the backend
const SECRET_KEY = 'your-secret-key';

// Payload for the token
const payload = {
  username: 'testuser',
  user_id: 1, // Replace with the desired user ID
};

// Generate the token
const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });

console.log('Generated Token:', token);
