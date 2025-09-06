// backend/routes/employees.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (pool) => {
    // @route   POST /api/employees
    // @desc    Create a new employee for the logged-in user
    // @access  Private
    router.post('/', auth, async (req, res) => {
        const { first_name, last_name, email, job_title, department, phone, hire_date } = req.body;
        const user_id = req.user.id;

        try {
            const newEmployee = await pool.query(
                `INSERT INTO Employees (first_name, last_name, email, job_title, department, phone, hire_date, user_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [first_name, last_name, email, job_title, department, phone, hire_date, user_id]
            );
            res.status(201).json({ msg: 'Employee created successfully', employee: newEmployee.rows[0] });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET /api/employees
    // @desc    Get all employees for the logged-in user
    // @access  Private
    router.get('/', auth, async (req, res) => {
        const user_id = req.user.id;

        try {
            const allEmployees = await pool.query('SELECT * FROM Employees WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
            res.json(allEmployees.rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   PUT /api/employees/:id
    // @desc    Update an employee by ID for the logged-in user
    // @access  Private
    router.put('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id;
        const { first_name, last_name, email, job_title, department, phone, hire_date } = req.body;
        
        try {
            const updatedEmployee = await pool.query(
                `UPDATE Employees
                 SET first_name = $1, last_name = $2, email = $3, job_title = $4, department = $5, phone = $6, hire_date = $7, updated_at = NOW()
                 WHERE employee_id = $8 AND user_id = $9
                 RETURNING *`,
                [first_name, last_name, email, job_title, department, phone, hire_date, id, user_id]
            );

            if (updatedEmployee.rows.length === 0) {
                return res.status(404).json({ msg: 'Employee not found or not authorized' });
            }

            res.json({ msg: 'Employee updated successfully', employee: updatedEmployee.rows[0] });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   DELETE /api/employees/:id
    // @desc    Delete an employee by ID for the logged-in user
    // @access  Private
    router.delete('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id;

        try {
            const result = await pool.query('DELETE FROM Employees WHERE employee_id = $1 AND user_id = $2 RETURNING *', [id, user_id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ msg: 'Employee not found or not authorized' });
            }

            res.json({ msg: 'Employee deleted successfully' });
            
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    return router;
};