const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');
const User = require('../models/user'); 
const bcrypt = require('bcrypt');


// Middleware to authenticate user requests
router.use(authenticateJWT);

// GET route to fetch user profile by username
router.get('/:username', async (req, res, next) => {
  try {
    const username = req.params.username;

    // Check if the authenticated user matches the requested username
    if (req.user.username !== username) {
      return res.status(403).json({ error: 'You are not authorized to view this profile' });
    }

    // Fetch the user details using the findOne method
    const user = await User.findOne(username); // Make sure findOne is correctly implemented in the model
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return only username, email, and creation date (no profile picture)
    res.json({
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    });
  } catch (err) {
    next(err); // Pass the error to the next middleware
  }
});

// PUT route to update user profile
router.put('/:username', async (req, res, next) => {
  try {
    const username = req.params.username;
    const { email, password, newUsername } = req.body;

    if (req.user.username !== username) {
      return res.status(403).json({ error: 'You are not authorized to update this profile' });
    }

    const updatedUser = await User.update(username, { email, password, newUsername });

    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
