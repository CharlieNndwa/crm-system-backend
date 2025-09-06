// backend/routes/tasks.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (pool) => {
    // @route   POST /api/tasks
    // @desc    Create a new task for the logged-in user
    // @access  Private
    router.post('/', auth, async (req, res) => {
        const { task_name, description, due_date, status, assigned_to, customer_id, deal_id } = req.body;
        const user_id = req.user.id;

        try {
            const newTask = await pool.query(
                `INSERT INTO Tasks (task_name, description, due_date, status, assigned_to, customer_id, deal_id, user_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [task_name, description, due_date, status, assigned_to, customer_id, deal_id, user_id]
            );
            res.status(201).json({ msg: 'Task created successfully', task: newTask.rows[0] });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET /api/tasks
    // @desc    Get all tasks for the logged-in user
    // @access  Private
    router.get('/', auth, async (req, res) => {
        const user_id = req.user.id;

        try {
            const allTasks = await pool.query('SELECT * FROM Tasks WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
            res.json(allTasks.rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET /api/tasks/:id
    // @desc    Get a single task by ID for the logged-in user
    // @access  Private
    router.get('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id;

        try {
            const task = await pool.query('SELECT * FROM Tasks WHERE task_id = $1 AND user_id = $2', [id, user_id]);
            if (task.rows.length === 0) {
                return res.status(404).json({ msg: 'Task not found or not authorized' });
            }
            res.json(task.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   PUT /api/tasks/:id
    // @desc    Update a task by ID for the logged-in user
    // @access  Private
    router.put('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id;
        const { task_name, description, due_date, status, assigned_to, customer_id, deal_id } = req.body;
        
        try {
            const updatedTask = await pool.query(
                `UPDATE Tasks
                 SET task_name = $1, description = $2, due_date = $3, status = $4, assigned_to = $5, customer_id = $6, deal_id = $7, updated_at = NOW()
                 WHERE task_id = $8 AND user_id = $9
                 RETURNING *`,
                [task_name, description, due_date, status, assigned_to, customer_id, deal_id, id, user_id]
            );
            if (updatedTask.rows.length === 0) {
                return res.status(404).json({ msg: 'Task not found or not authorized' });
            }
            res.json({ msg: 'Task updated successfully', task: updatedTask.rows[0] });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   DELETE /api/tasks/:id
    // @desc    Delete a task by ID for the logged-in user
    // @access  Private
    router.delete('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id;

        try {
            const result = await pool.query('DELETE FROM Tasks WHERE task_id = $1 AND user_id = $2 RETURNING *', [id, user_id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ msg: 'Task not found or not authorized' });
            }
            res.json({ msg: 'Task deleted successfully' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    return router;
};