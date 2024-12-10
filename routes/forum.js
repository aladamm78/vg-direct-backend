const express = require("express");
const pool = require("../db"); 
const commentModel = require("../models/commentModel"); // Ensure model is imported
const router = express.Router();

// Get all forum posts
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
             COALESCE(ARRAY_AGG(DISTINCT g.name), '{}') AS tags, 
             COUNT(c.comment_id) AS comment_count
      FROM forum_posts p
      LEFT JOIN forum_post_genres fpg ON p.post_id = fpg.post_id
      LEFT JOIN genres g ON fpg.genre_id = g.genre_id
      LEFT JOIN comments c ON p.post_id = c.post_id
      GROUP BY p.post_id
      ORDER BY COUNT(c.comment_id) DESC, p.created_at DESC;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching forum posts:", error.message);
    res.status(500).send("Server error");
  }
});

// Create a new forum post
router.post("/", async (req, res) => {
  const { user_id, game_id, title, body, genreIds } = req.body;
  try {
    // Create the forum post first
    const postResult = await pool.query(
      `INSERT INTO forum_posts (user_id, game_id, title, body)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, game_id, title, body]
    );

    const postId = postResult.rows[0].post_id;

    // Add genres to the forum_post_genres table
    if (genreIds && genreIds.length > 0) {
      const values = genreIds.map((genreId) => `(${postId}, ${genreId})`).join(",");
      await pool.query(
        `INSERT INTO forum_post_genres (post_id, genre_id) VALUES ${values}`
      );
    }

    res.status(201).json(postResult.rows[0]);
  } catch (error) {
    console.error("Error creating forum post:", error.message);
    res.status(500).send("Server error");
  }
});

// Search forum posts by title or body
router.get("/search", async (req, res) => {
  const { query } = req.query;
  try {
    const result = await pool.query(
      `SELECT p.*, COUNT(c.comment_id) AS comment_count
       FROM forum_posts p
       LEFT JOIN comments c ON p.post_id = c.post_id
       WHERE p.title ILIKE $1 OR p.body ILIKE $1
       GROUP BY p.post_id
       ORDER BY COUNT(c.comment_id) DESC, p.created_at DESC`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error searching forum posts:", error.message);
    res.status(500).send("Server error");
  }
});

// Filter forum posts by genre
router.get("/filter-by-genre", async (req, res) => {
  const { genre } = req.query;
  try {
    const result = await pool.query(
      `SELECT p.*, COUNT(c.comment_id) AS comment_count
       FROM forum_posts p
       LEFT JOIN comments c ON p.post_id = c.post_id
       LEFT JOIN forum_post_genres fpg ON p.post_id = fpg.post_id
       LEFT JOIN genres g ON fpg.genre_id = g.genre_id
       WHERE g.name = $1
       GROUP BY p.post_id
       ORDER BY COUNT(c.comment_id) DESC, p.created_at DESC`,
      [genre]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error filtering posts by genre:", error.message);
    res.status(500).send("Server error");
  }
});

// Get a forum post by its title, including tags and comments
router.get("/title/:title", async (req, res) => {
  const { title } = req.params;

  try {
    const forumPostResult = await pool.query(
      `SELECT p.*, 
              COALESCE(ARRAY_AGG(DISTINCT g.name), '{}') AS tags
       FROM forum_posts p
       LEFT JOIN forum_post_genres fpg ON p.post_id = fpg.post_id
       LEFT JOIN genres g ON fpg.genre_id = g.genre_id
       WHERE p.title = $1
       GROUP BY p.post_id`,
      [title]
    );

    const forumPost = forumPostResult.rows[0];

    if (!forumPost) {
      return res.status(404).json({ error: "Forum post not found" });
    }

    const comments = await commentModel.getCommentsByPostId(forumPost.post_id);

    res.json({ post: forumPost, comments });
  } catch (error) {
    console.error("Error fetching forum post:", error.message);
    res.status(500).send("Server error");
  }
});

// Route: Fetch forums created by a specific user
router.get("/created-by/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    // Query forums created by the user
    const result = await pool.query(
      `SELECT p.*, 
              COALESCE(ARRAY_AGG(DISTINCT g.name), '{}') AS tags, 
              COUNT(c.comment_id) AS comment_count
       FROM forum_posts p
       LEFT JOIN forum_post_genres fpg ON p.post_id = fpg.post_id
       LEFT JOIN genres g ON fpg.genre_id = g.genre_id
       LEFT JOIN comments c ON p.post_id = c.post_id
       WHERE p.user_id = $1
       GROUP BY p.post_id
       ORDER BY p.created_at DESC`,
      [user_id]
    );

    // Return an empty array if no forums are found
    if (result.rows.length === 0) {
      return res.status(200).json([]); // Respond with an empty array
    }

    res.json(result.rows); // Respond with the list of forums
  } catch (error) {
    console.error("Error fetching forums by user:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all comments for a specific forum post
router.get("/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  try {
    const comments = await commentModel.getCommentsByPostId(postId);
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error.message);
    res.status(500).send("Server error");
  }
});

// Get all replies for a specific comment
router.get("/:postId/comments/:commentId/replies", async (req, res) => {
  const { postId, commentId } = req.params;
  try {
    const replies = await commentModel.getRepliesByCommentId(postId, commentId);
    res.json(replies);
  } catch (error) {
    console.error("Error fetching replies:", error.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
