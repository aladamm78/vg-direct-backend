const request = require('supertest');
const app = require('./server');  // Import your app from server.js

describe('Server Tests', () => {
  // Test for the "/api/games" route
  it('should fetch games from the RAWG API', async () => {
    const response = await request(app).get('/api/games').query({ search: 'Zelda', page: 1, page_size: 10 });
    
    expect(response.status).toBe(200);  // Expect status code 200
    expect(response.body).toHaveProperty('results');  // Expect the response to contain a 'results' property
    expect(Array.isArray(response.body.results)).toBe(true);  // Ensure 'results' is an array
  });

  // Test for the "/api/games/:id" route
  it('should fetch game details for a specific game ID', async () => {
    const gameId = 4200;  // Keep it as a number
    const response = await request(app).get(`/api/games/${gameId}`);
  
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('rawg_id', gameId);  // Expecting number now
    expect(response.body).toHaveProperty('title');
    expect(response.body).toHaveProperty('description');
  });

  // Test for the 404 route
  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown-route');
    expect(response.status).toBe(404);  // Expect status code 404
    expect(response.body).toHaveProperty('error', 'Route not found');  // Ensure error message is returned
  });
});

