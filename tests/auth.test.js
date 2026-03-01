const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const authRoutes = require('../routes/auth');
const User = require('../models/User');

app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
    before(async () => {
        // Connect to a test database
        const url = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/test_db';
        await mongoose.connect(url);
        await User.deleteMany({}); // Ensure clean state
    });

    after(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                password: 'password123'
            });
        expect(res.status).to.equal(201);
        expect(res.body.message).to.equal('User created');
    });

    it('should not register user with same username', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                password: 'password456'
            });
        expect(res.status).to.equal(400);
    });

    it('should login a user and return a token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'testuser',
                password: 'password123'
            });
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('token');
        expect(res.body).to.have.property('role', 'user');
    });
});
