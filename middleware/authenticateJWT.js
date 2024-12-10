const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'b17b092199f992ad177f27d8a2ab3f2567a1f975a49dcb5a42c2ad1f798ee057e6742a6f6a742fea85ec5cbead950ce9ac65a1e0935ad76256f1e61055f9ebb8';



console.log("SECRET_KEY in middleware:", SECRET_KEY);

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization header:", authHeader);
  
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