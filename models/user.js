const db = require('../db'); // Adjust path to your database connection or ORM
require('dotenv').config();
const bcrypt = require('bcrypt'); 

class User {
  // Method to find a user by username
  static async findOne(username) {
    try {
      // Verify the format of the input
      if (typeof username !== 'string' || username.trim() === '') {
        throw new Error('Invalid username format. Username must be a non-empty string.');
      }

      console.log(`Attempting to find user with username: ${username}`);

      const result = await db.query(
        'SELECT user_id, username, email, password_hash, created_at FROM users WHERE username = $1',
        [username]
      );

      console.log(`Database query executed. Rows returned: ${JSON.stringify(result.rows)}`);

      if (result.rows.length === 0) {
        console.error(`User with username '${username}' not found.`);
        throw new Error(`User with username '${username}' not found`);
      }

      const user = result.rows[0];
      console.log(`User found: ${JSON.stringify(user)}`);

      return user;
    } catch (err) {
      console.error("Error fetching user data:", err.message);
      throw new Error(`Error fetching user data: ${err.message}`);
    }
  }

  // Method to update a user's profile
  static async update(username, data) {
    try {
      const { email, password, newUsername } = data;
  
      // Validate fields
      if (newUsername && typeof newUsername !== 'string') {
        throw new Error('Invalid username format. Must be a string.');
      }
  
      if (email && typeof email !== 'string') {
        throw new Error('Invalid email format. Must be a string.');
      }
  
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Invalid email format. Please provide a valid email address.');
      }
  
      let password_hash = null;
      if (password) {
        const saltRounds = 10;
        password_hash = await bcrypt.hash(password, saltRounds);
      }
  
      // Build dynamic query
      const fields = [];
      const values = [];
      let queryIndex = 1;
  
      if (newUsername) {
        fields.push(`username = $${queryIndex++}`);
        values.push(newUsername);
      }
  
      if (email) {
        fields.push(`email = $${queryIndex++}`);
        values.push(email);
      }
  
      if (password_hash) {
        fields.push(`password_hash = $${queryIndex++}`);
        values.push(password_hash);
      }
  
      if (fields.length === 0) {
        throw new Error('No fields to update. Please provide at least one field to update.');
      }
  
      values.push(username);
  
      const query = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE username = $${queryIndex}
        RETURNING user_id, username, email, created_at;
      `;
  
      const result = await db.query(query, values);
  
      if (result.rows.length === 0) {
        throw new Error(`User with username '${username}' not found.`);
      }
  
      return result.rows[0];
    } catch (err) {
      throw new Error(`Error updating user: ${err.message}`);
    }
  }
  

}

module.exports = User;
