const request = require('supertest');
const { expect } = require('chai');
const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/tasks', require('../routes/tasks'));
app.use(require('../middleware/errorHandler'));

describe('Security and Authorization Tests', () => {
    let user1Token, user2Token;
    let user1Id, user2Id;
    let taskOfUser1;

    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test_db');
        }

        await User.deleteMany({});
        await Task.deleteMany({});

        // Create User 1
        const u1 = new User({ username: 'user1', password: 'password', role: 'user' });
        const savedU1 = await u1.save();
        user1Id = savedU1._id;
        user1Token = jwt.sign({ id: user1Id, role: 'user' }, process.env.JWT_SECRET || 'secretkey');

        // Create User 2
        const u2 = new User({ username: 'user2', password: 'password', role: 'user' });
        const savedU2 = await u2.save();
        user2Id = savedU2._id;
        user2Token = jwt.sign({ id: user2Id, role: 'user' }, process.env.JWT_SECRET || 'secretkey');

        // Task for User 1
        const t1 = new Task({ title: 'User 1 Task', user: user1Id });
        taskOfUser1 = await t1.save();
    });

    after(async () => {
        await mongoose.connection.close();
    });

    it('should NOT allow user 2 to delete user 1 task', async () => {
        const res = await request(app)
            .delete(`/api/tasks/${taskOfUser1._id}`)
            .set('Authorization', `Bearer ${user2Token}`);

        expect(res.status).to.equal(404); // Should not find it or not allow it

        // Verify task still exists
        const exists = await Task.findById(taskOfUser1._id);
        expect(exists).to.not.be.null;
    });

    it('should NOT allow access without token', async () => {
        const res = await request(app).get('/api/tasks');
        expect(res.status).to.equal(403);
    });

    it('should NOT allow regular user to access admin route', async () => {
        const res = await request(app)
            .get('/api/tasks/admin/all')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.status).to.equal(403);
        expect(res.body.message).to.equal('Require Admin Role!');
    });
});
