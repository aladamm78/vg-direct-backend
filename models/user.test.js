const User = require('./user');
const db = require('../db'); // Mock the database

jest.mock('../db');

describe('User Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return user data for a valid username', async () => {
      const mockUser = {
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        created_at: '2024-12-10T00:00:00Z',
      };

      db.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await User.findOne('testuser');

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT user_id'),
        ['testuser']
      );
    });

    it('should throw an error if username is not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(User.findOne('nonexistentuser')).rejects.toThrow('User with username \'nonexistentuser\' not found');
    });

    it('should throw an error for invalid username format', async () => {
      await expect(User.findOne('')).rejects.toThrow('Invalid username format');
    });
  });

  describe('update', () => {
    it('should update user details and return the updated user', async () => {
      const mockUpdatedUser = {
        user_id: 1,
        username: 'newuser',
        email: 'newemail@example.com',
        created_at: '2024-12-10T00:00:00Z',
      };

      db.query.mockResolvedValueOnce({ rows: [mockUpdatedUser] });

      const result = await User.update('olduser', { newUsername: 'newuser', email: 'newemail@example.com' });

      expect(result).toEqual(mockUpdatedUser);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.any(Array)
      );
    });

    it('should throw an error if no fields are provided to update', async () => {
      await expect(User.update('testuser', {})).rejects.toThrow('No fields to update');
    });

    it('should throw an error if user is not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(User.update('nonexistentuser', { email: 'newemail@example.com' })).rejects.toThrow('User with username \'nonexistentuser\' not found');
    });
  });
});
