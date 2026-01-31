const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'No token provided' });

    // Format: "Bearer <token>"
    const bearer = token.split(' ');
    const tokenVal = bearer[1];

    jwt.verify(tokenVal, process.env.JWT_SECRET || 'secretkey', (err, decoded) => {
        if (err) return res.status(500).json({ message: 'Failed to authenticate token' });
        req.userId = decoded.id;
        next();
    });
};

router.use(verifyToken);

// Get all tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.userId });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create task
router.post('/', async (req, res) => {
    try {
        const task = new Task({
            title: req.body.title,
            user: req.userId
        });
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update task
router.put('/:id', async (req, res) => {
    try {
        const { title } = req.body;
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            { title },
            { new: true }
        );
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete task
router.delete('/:id', async (req, res) => {
    try {
        await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
