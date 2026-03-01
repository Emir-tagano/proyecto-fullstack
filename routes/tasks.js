const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Middleware to verify token for all task routes
router.use(verifyToken);

// Validation middleware for tasks
const taskCreateValidation = [
    body('title').notEmpty().withMessage('Title is required').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
];

const taskUpdateValidation = [
    body('title').optional().notEmpty().withMessage('Title can not be empty').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
];

// Get all tasks for current user (with pagination and filtering)
router.get('/', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, completed } = req.query;
        const query = { user: req.userId };

        if (completed !== undefined) {
            query.completed = completed === 'true';
        }

        const tasks = await Task.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Task.countDocuments(query);

        res.json({
            tasks,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalTasks: count
        });
    } catch (err) {
        next(err);
    }
});

// Admin Route: Get all tasks from ALL users (Demonstrating specific permissions)
router.get('/admin/all', isAdmin, async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const tasks = await Task.find()
            .populate('user', 'username')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Task.countDocuments();

        res.json({
            tasks,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalTasks: count
        });
    } catch (err) {
        next(err);
    }
});

// Create task
router.post('/', taskCreateValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const task = new Task({
            title: req.body.title,
            user: req.userId
        });
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
});

// Update task
router.put('/:id', taskUpdateValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, completed } = req.body;
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (completed !== undefined) updateData.completed = completed;

        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            updateData,
            { new: true }
        );
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (err) {
        next(err);
    }
});

// Delete task
router.delete('/:id', async (req, res, next) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

