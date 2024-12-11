const { createComment, createReply, getCommentsByPostId, getCommentsByUserId } = require('./commentModel');
const pool = require('../db'); // Mock the database pool

jest.mock('../db');

describe('commentModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('should create a new comment', async () => {
      const mockComment = {
        comment_id: 1,
        post_id: 10,
        user_id: 5,
        content: 'This is a test comment',
        created_at: '2024-12-10T00:00:00Z',
      };

      pool.query.mockResolvedValueOnce({ rows: [mockComment] });

      const result = await createComment(10, 5, 'This is a test comment');

      expect(result).toEqual(mockComment);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO comments'),
        [10, 5, 'This is a test comment']
      );
    });
  });

  describe('createReply', () => {
    it('should create a reply to a comment', async () => {
      const mockReply = {
        comment_id: 2,
        post_id: 10,
        user_id: 5,
        content: 'This is a test reply',
        parent_comment_id: 1,
        created_at: '2024-12-10T00:00:00Z',
      };

      pool.query.mockResolvedValueOnce({ rows: [mockReply] });

      const result = await createReply(10, 5, 'This is a test reply', 1);

      expect(result).toEqual(mockReply);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO comments'),
        [10, 5, 'This is a test reply', 1]
      );
    });
  });

  describe('getCommentsByPostId', () => {
    it('should fetch all comments for a specific post', async () => {
      const mockComments = [
        { comment_id: 1, content: 'Comment 1', user_id: 5, username: 'user1', created_at: '2024-12-10T00:00:00Z' },
        { comment_id: 2, content: 'Comment 2', user_id: 6, username: 'user2', created_at: '2024-12-10T01:00:00Z' },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockComments });

      const result = await getCommentsByPostId(10);

      expect(result).toEqual(mockComments);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT c.comment_id'), [10]);
    });
  });

  describe('getCommentsByUserId', () => {
    it('should fetch all comments made by a user', async () => {
      const mockComments = [
        { comment_id: 1, content: 'User comment', post_title: 'Post 1', created_at: '2024-12-10T00:00:00Z' },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockComments });

      const result = await getCommentsByUserId(5);

      expect(result).toEqual(mockComments);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT c.comment_id'), [5]);
    });
  });
});
