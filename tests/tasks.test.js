const request = require('supertest');
const { expect } = require('chai');
const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Create a small express app for testing
const app = express();
app.use(express.json());
app.use('/api/tasks', require('../routes/tasks'));
app.use(require('../middleware/errorHandler'));

describe('Tasks API', () => {
    let token;
    let userId;
    let taskId;

    before(async () => {
        // Connect to a test database or use existing
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test_db');
        }

        // Setup a test user
        await User.deleteMany({});
        await Task.deleteMany({});

        const user = new User({
            username: 'testuser',
            password: 'password123',
            role: 'user'
        });
        const savedUser = await user.save();
        userId = savedUser._id;

        token = jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET || 'secretkey');
    });

    after(async () => {
        await mongoose.connection.close();
    });

    it('should create a new task', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Important Task' });

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('title', 'Important Task');
        taskId = res.body._id;
    });

    it('should fail to create task without title', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('errors');
    });

    it('should get user tasks with pagination', async () => {
        const res = await request(app)
            .get('/api/tasks')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('tasks');
        expect(res.body.tasks).to.be.an('array');
        expect(res.body).to.have.property('totalTasks', 1);
    });

    it('should update a task', async () => {
        const res = await request(app)
            .put(`/api/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ completed: true });

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('completed', true);
    });

    it('should delete a task', async () => {
        const res = await request(app)
            .delete(`/api/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('message', 'Task deleted');
    });
});
