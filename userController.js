const User = require('../models/user'); // Import the User model

// Controller to get user data
const getUserInfo = async (req, res) => {
  const { user_id } = req.params;

  try {
    const user = await User.findOne(user_id);  
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Controller to update user info
const updateUserInfo = async (req, res) => {
  const { user_id } = req.params;
  const { email, password } = req.body;

  try {
    const updatedUser = await User.update(user_id, { email, password });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUserInfo, updateUserInfo };
