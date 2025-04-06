const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');

let mongoServer;
let agent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  agent = request.agent(app);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Sell Page - Secure Route Access', () => {
  it('should redirect unauthenticated user to login page when accessing /items/new', async () => {
    const res = await agent.get('/items/new');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/users/login');
  });

  it('should reject incomplete item form data (no auth required)', async () => {
    const res = await agent.post('/items')
      .type('form')
      .send({
        title: '', // missing required fields
        condition: '',
        category: '',
        price: '',
        details: ''
      });

    // Should redirect due to isLoggedIn middleware
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/users/login');
  });
});
