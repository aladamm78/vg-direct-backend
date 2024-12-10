const pool = require('../db');

// Function to create a new comment
async function createComment(post_id, user_id, content) {
  const result = await pool.query(
    `INSERT INTO comments (post_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING comment_id, post_id, user_id, content, created_at`,
    [post_id, user_id, content]
  );

  return result.rows[0];
}

// Function to create a reply to a specific comment
async function createReply(post_id, user_id, content, parent_comment_id) {
  const result = await pool.query(
    `INSERT INTO comments (post_id, user_id, content, parent_comment_id)
     VALUES ($1, $2, $3, $4)
     RETURNING comment_id, post_id, user_id, content, parent_comment_id, created_at`,
    [post_id, user_id, content, parent_comment_id]
  );

  return result.rows[0];
}

// Function to fetch all comments for a specific post
async function getCommentsByPostId(post_id) {
  const result = await pool.query(
    `SELECT c.comment_id, c.parent_comment_id, c.content, c.user_id, c.created_at, u.username
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.user_id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [post_id]
  );

  return result.rows;
}

// Function to fetch all comments made by a specific user
async function getCommentsByUserId(user_id) {
  const result = await pool.query(
    `SELECT c.comment_id, c.post_id, c.parent_comment_id, c.content, c.created_at, fp.title AS post_title
     FROM comments c
     LEFT JOIN forum_posts fp ON c.post_id = fp.post_id
     WHERE c.user_id = $1
     ORDER BY c.created_at DESC`,
    [user_id]
  );

  return result.rows;
}


module.exports = {
  createComment,
  createReply,
  getCommentsByPostId,
  getCommentsByUserId,
};
