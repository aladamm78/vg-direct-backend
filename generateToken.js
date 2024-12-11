const jwt = require('jsonwebtoken');

// Replace this with your actual secret key used in the backend
const SECRET_KEY = process.env.SECRET_KEY || 'b17b092199f992ad177f27d8a2ab3f2567a1f975a49dcb5a42c2ad1f798ee057e6742a6f6a742fea85ec5cbead950ce9ac65a1e0935ad76256f1e61055f9ebb8';

// Payload for the token
const payload = {
  username: 'testuser2',
  user_id: 28, // Replace with the desired user ID
};

// Generate the token
const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });

console.log('Generated Token:', token);
