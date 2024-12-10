const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');
const commentModel = require('../models/commentModel');

// Route to post a comment on a forum post
router.post('/comments', authenticateJWT, async (req, res, next) => {
  try {
    const { post_id, content } = req.body;
    const user_id = req.user.user_id;

    // Validate input
    if (!post_id || !content) {
      return res.status(400).json({ error: 'post_id and content are required.' });
    }

    // Create a new comment
    const newComment = await commentModel.createComment(post_id, user_id, content);

    return res.status(201).json(newComment);
  } catch (err) {
    console.error('Error posting comment:', err.message);
    next(err);
  }
});

// Route to post a reply to a specific comment
router.post('/comments/reply', authenticateJWT, async (req, res, next) => {
  try {
    const { post_id, content, parent_comment_id } = req.body;
    const user_id = req.user.user_id;

    // Validate input
    if (!post_id || !content || !parent_comment_id) {
      return res.status(400).json({ error: 'post_id, content, and parent_comment_id are required.' });
    }

    // Create a new reply
    const newReply = await commentModel.createReply(post_id, user_id, content, parent_comment_id);

    return res.status(201).json(newReply);
  } catch (err) {
    console.error('Error posting reply:', err.message);
    next(err);
  }
});

// Route to fetch all comments and replies for a forum post
router.get('/comments/:post_id', async (req, res, next) => {
  try {
    const { post_id } = req.params;

    // Fetch all comments for the given post
    const comments = await commentModel.getCommentsByPostId(post_id);

    // Nest replies under their respective parent comments
    const nestedComments = [];
    const commentMap = {};

    // Build a map of comments for nesting
    comments.forEach((comment) => {
      comment.replies = []; // Initialize an empty replies array
      commentMap[comment.comment_id] = comment;

      if (comment.parent_comment_id) {
        // Add reply to its parent comment
        commentMap[comment.parent_comment_id]?.replies.push(comment);
      } else {
        // Top-level comment
        nestedComments.push(comment);
      }
    });

    return res.json(nestedComments);
  } catch (err) {
    console.error('Error fetching comments:', err.message);
    next(err);
  }
});

// Route to fetch all comments made by a specific user
router.get('/comments/user/:user_id', async (req, res, next) => {
  try {
    const { user_id } = req.params;

    // Validate input
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required.' });
    }

    // Fetch all comments made by the user
    const userComments = await commentModel.getCommentsByUserId(user_id);

    return res.json(userComments);
  } catch (err) {
    console.error('Error fetching user comments:', err.message);
    next(err);
  }
});

module.exports = router;
