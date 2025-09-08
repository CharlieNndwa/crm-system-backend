// backend/routes/customers.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import the auth middleware

module.exports = (pool) => {
    // @route   POST /api/customers
    // @desc    Create a new customer
    // @access  Private
    router.post('/', auth, async (req, res) => {
        const { first_name, last_name, email, phone, company } = req.body;
        const user_id = req.user.id; // Get the user ID from the request object

        try {
            const newCustomer = await pool.query(
                `INSERT INTO Customers (first_name, last_name, email, phone, company, user_id)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [first_name, last_name, email, phone, company, user_id] // Add user_id to the query
            );
            res.status(201).json({ msg: 'Customer created successfully', customer: newCustomer.rows[0] });
        } catch (err) {
            console.error(err.message);
            // Check for a unique constraint violation error code (23505 for PostgreSQL)
            if (err.code === '23505') {
                return res.status(409).json({ msg: 'A customer with this email already exists.' });
            }
            res.status(500).send('Server Error');
        }
    });

    // @route   GET /api/customers
    // @desc    Get all customers for the logged-in user
    // @access  Private
    router.get('/', auth, async (req, res) => {
        const user_id = req.user.id; // Get the user ID from the request object

        try {
            const allCustomers = await pool.query('SELECT * FROM Customers WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
            res.json(allCustomers.rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET /api/customers/:id
    // @desc    Get a single customer by ID for the logged-in user
    // @access  Private
    router.get('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id;

        try {
            const customer = await pool.query(
                'SELECT * FROM Customers WHERE customer_id = $1 AND user_id = $2',
                [id, user_id]
            );

            if (customer.rows.length === 0) {
                return res.status(404).json({ msg: 'Customer not found or not authorized' });
            }

            res.json(customer.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   PUT /api/customers/:id
    // @desc    Update a customer by ID for the logged-in user
    // @access  Private
    router.put('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id; // Get the user ID from the request object
        const { first_name, last_name, email, phone, company } = req.body;

        try {
            const updatedCustomer = await pool.query(
                `UPDATE Customers
                 SET first_name = $1, last_name = $2, email = $3, phone = $4, company = $5, updated_at = NOW()
                 WHERE customer_id = $6 AND user_id = $7
                 RETURNING *`,
                [first_name, last_name, email, phone, company, id, user_id] // Add user_id to the WHERE clause
            );

            if (updatedCustomer.rows.length === 0) {
                return res.status(404).json({ msg: 'Customer not found or not authorized' });
            }

            res.json({ msg: 'Customer updated successfully', customer: updatedCustomer.rows[0] });
        } catch (err) {
            console.error(err.message);
            // Check for a unique constraint violation error code (23505 for PostgreSQL)
            if (err.code === '23505') {
                return res.status(409).json({ msg: 'A customer with this email already exists.' });
            }
            res.status(500).send('Server Error');
        }
    });

    // @route   DELETE /api/customers/:id
    // @desc    Delete a customer by ID for the logged-in user
    // @access  Private
    router.delete('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id; // Get the user ID from the request object

        try {
            const result = await pool.query(
                'DELETE FROM Customers WHERE customer_id = $1 AND user_id = $2 RETURNING *',
                [id, user_id] // Add user_id to the WHERE clause
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ msg: 'Customer not found or not authorized' });
            }

            res.json({ msg: 'Customer deleted successfully' });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    return router;
};