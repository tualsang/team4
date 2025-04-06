const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/userModel');
const Item = require('../models/itemModel');
const bcrypt = require('bcryptjs');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Item.deleteMany({});
});

describe('Cart Functionality Tests', () => {
  let agent, user, item;

  beforeEach(async () => {
    agent = request.agent(app);
    user = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
    });
    await user.save();
    await agent
      .post('/users/login')
      .send({ email: 'test@example.com', password: 'password123' });
    item = new Item({
      title: 'Test Item',
      condition: 'New',
      price: 99.99,
      category: 'Electronics',
      seller: user._id,
    });
    await item.save();
  });

  test('✅ Add item to cart successfully', async () => {
    const res = await agent.post(`/users/cart/${item._id}/add`);
    expect(res.headers.location).toBe('/users/cart');
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.cart).toHaveLength(1);
    expect(updatedUser.cart[0].item.toString()).toBe(item._id.toString());
  });

  test('❌ Prevent duplicate items in cart', async () => {
    await agent.post(`/users/cart/${item._id}/add`);
    const res = await agent.post(`/users/cart/${item._id}/add`);
    expect(res.headers.location).toBe('/users/cart');
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.cart).toHaveLength(1);
  });

  test('✅ Remove item from cart', async () => {
    await agent.post(`/users/cart/${item._id}/add`);
    const res = await agent.post(`/users/cart/${item._id}/remove`);
    expect(res.headers.location).toBe('/users/cart');
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.cart).toHaveLength(0);
  });

  test('✅ Purchase items successfully', async () => {
    await agent.post(`/users/cart/${item._id}/add`);
    const res = await agent.post('/users/cart/purchase');
    expect(res.headers.location).toBe('/users/cart');
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.cart).toHaveLength(0);
  });

  test('❌ Prevent purchase with empty cart', async () => {
    const res = await agent.post('/users/cart/purchase');
    expect(res.headers.location).toBe('/users/cart');
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.cart).toHaveLength(0);
  });

  test('✅ View cart displays correct items and total price', async () => {
    await agent.post(`/users/cart/${item._id}/add`);
    const res = await agent.get('/users/cart');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Test Item');
    expect(res.text).toContain('99.99');
  });

  test('❌ Redirect unauthenticated user from cart actions', async () => {
    const unauthenticatedAgent = request.agent(app);
    const addRes = await unauthenticatedAgent.post(`/users/cart/${item._id}/add`);
    expect(addRes.headers.location).toBe('/users/login');
    const viewRes = await unauthenticatedAgent.get('/users/cart');
    expect(viewRes.headers.location).toBe('/users/login');
  });

  test('❌ Handle invalid item IDs gracefully', async () => {
    const res = await agent.post('/users/cart/invalid-id/add');
    expect(res.status).toBe(500);
  });

  test('❌ Handle adding non-existent item gracefully', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await agent.post(`/users/cart/${fakeId}/add`);
    expect(res.headers.location).toBe('/users/cart');
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.cart).toHaveLength(1);
  });
});
