// backend/routes/deals.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import the auth middleware

module.exports = (pool) => {
    // @route   POST /api/deals
    // @desc    Create a new deal
    // @access  Private
    router.post('/', auth, async (req, res) => {
        const { deal_name, amount, customer_id, stage } = req.body;
        const user_id = req.user.id; // Get the user ID from the request object

        try {
            const newDeal = await pool.query(
                `INSERT INTO Deals (deal_name, amount, customer_id, stage, user_id)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [deal_name, amount, customer_id, stage, user_id] // Add user_id to the query
            );
            res.status(201).json({ msg: 'Deal created successfully', deal: newDeal.rows[0] });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET /api/deals
    // @desc    Get all deals for the logged-in user
    // @access  Private
    router.get('/', auth, async (req, res) => {
        const user_id = req.user.id; // Get the user ID from the request object

        try {
            const allDeals = await pool.query('SELECT * FROM Deals WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
            res.json(allDeals.rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET /api/deals/:id
    // @desc    Get a single deal by ID for the logged-in user
    // @access  Private
    router.get('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id;

        try {
            const deal = await pool.query(
                'SELECT * FROM Deals WHERE deal_id = $1 AND user_id = $2',
                [id, user_id]
            );

            if (deal.rows.length === 0) {
                return res.status(404).json({ msg: 'Deal not found or not authorized' });
            }

            res.json(deal.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   PUT /api/deals/:id
    // @desc    Update a deal by ID for the logged-in user
    // @access  Private
    router.put('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id; // Get the user ID from the request object
        const { deal_name, amount, stage } = req.body;

        try {
            const updatedDeal = await pool.query(
                `UPDATE Deals
                 SET deal_name = $1, amount = $2, stage = $3, updated_at = NOW()
                 WHERE deal_id = $4 AND user_id = $5
                 RETURNING *`,
                [deal_name, amount, stage, id, user_id] // Add user_id to the WHERE clause
            );

            if (updatedDeal.rows.length === 0) {
                return res.status(404).json({ msg: 'Deal not found or not authorized' });
            }

            res.json({ msg: 'Deal updated successfully', deal: updatedDeal.rows[0] });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   DELETE /api/deals/:id
    // @desc    Delete a deal by ID for the logged-in user
    // @access  Private
    router.delete('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id; // Get the user ID from the request object

        try {
            const result = await pool.query('DELETE FROM Deals WHERE deal_id = $1 AND user_id = $2 RETURNING *', [id, user_id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ msg: 'Deal not found or not authorized' });
            }

            res.json({ msg: 'Deal deleted successfully' });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    return router;
};