const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'mysecretkey'; // Use environment variable for security


console.log("SECRET_KEY in middleware:", SECRET_KEY);

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
        console.log("JWT verification error:", err);
        return res.sendStatus(403); // Forbidden
      }
      
      console.log("Authenticated user from token:", user);
      req.user = user; // Add user info to request object
      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};

module.exports = authenticateJWT;