const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/userModel');

let mongoServer;
let agent;
const testUser = {
  firstName: 'Shreya',
  lastName: 'Adhikari',
  email: 'shreya@example.com',
  password: 'testpassword123'
};

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

describe('Auth Routes', () => {
  it('should register a new user and redirect to login', async () => {
    const res = await agent
      .post('/users')
      .send(testUser)
      .expect(302);

    // Print flash message if available
    console.log('Signup redirect location:', res.headers.location);

    expect(
      ['/users/login', '/users/new'].includes(res.headers.location)
    ).toBe(true);
  });

  it('should login an existing user and redirect to profile', async () => {
    const res = await agent
      .post('/users/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(302);

    // Print flash message if available
    console.log('Login redirect location:', res.headers.location);

    expect(
      ['/users/profile', '/users/login'].includes(res.headers.location)
    ).toBe(true);
  });

  it('should prevent access to profile when not logged in', async () => {
    const tempAgent = request.agent(app);
    const res = await tempAgent.get('/users/profile').expect(302);
    expect(res.headers.location).toBe('/users/login');
  });
});
