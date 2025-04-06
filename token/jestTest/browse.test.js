const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Item = require('../models/itemModel');
const User = require('../models/userModel');

let mongoServer;
let agent;
let sellerId;

const sampleItems = [
  {
    title: 'Wireless Mouse',
    condition: 'New',
    price: 25.99,
    category: 'Electronics',
    details: 'Brand new wireless mouse with ergonomic design.',
    image: '/uploads/mouse.jpg'
  },
  {
    title: 'JavaScript Book',
    condition: 'Used',
    price: 10.5,
    category: 'Books',
    details: 'Used but in good condition.',
    image: '/uploads/book.jpg'
  },
  {
    title: 'T-shirt',
    condition: 'New',
    price: 15,
    category: 'Clothing',
    details: '100% cotton',
    image: '/uploads/shirt.jpg'
  }
];

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  agent = request.agent(app);

  const seller = new User({
    firstName: 'Test',
    lastName: 'Seller',
    email: 'seller@example.com',
    password: 'password123'
  });
  await seller.save();
  sellerId = seller._id;

  for (const item of sampleItems) {
    const newItem = new Item({ ...item, seller: sellerId });
    await newItem.save();
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Browse Page', () => {
  test('should display all items', async () => {
    const res = await agent.get('/items');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Wireless Mouse');
    expect(res.text).toContain('JavaScript Book');
    expect(res.text).toContain('T-shirt');
  });

  test('should filter by category', async () => {
    const res = await agent.get('/items?category=Books');
    expect(res.status).toBe(200);
    expect(res.text).toContain('JavaScript Book');
    expect(res.text).not.toContain('Wireless Mouse');
  });

  test('should filter by condition', async () => {
    const res = await agent.get('/items?condition=New');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Wireless Mouse');
    expect(res.text).toContain('T-shirt');
    expect(res.text).not.toContain('JavaScript Book');
  });

  test('should sort by price descending', async () => {
    const res = await agent.get('/items?sort=desc');
    expect(res.status).toBe(200);
    const mouseIndex = res.text.indexOf('Wireless Mouse');
    const bookIndex = res.text.indexOf('JavaScript Book');
    expect(mouseIndex).toBeLessThan(bookIndex); // higher priced item appears first
  });

  test('should search by keyword', async () => {
    const res = await agent.get('/items?keyword=shirt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('T-shirt');
    expect(res.text).not.toContain('JavaScript Book');
  });
});
