// backend/routes/invoices.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (pool) => {
    // @route   POST /api/invoices
    // @desc    Create a new invoice for the logged-in user
    // @access  Private
    router.post('/', auth, async (req, res) => {
        const { customer_id, deal_id, invoice_number, issue_date, due_date, amount_due } = req.body;
        const user_id = req.user.id; // Get the user ID from the request object

        try {
            const newInvoice = await pool.query(
                `INSERT INTO Invoices (customer_id, deal_id, invoice_number, issue_date, due_date, amount_due, user_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [customer_id, deal_id, invoice_number, issue_date, due_date, amount_due, user_id] // Add user_id to the query
            );
            res.status(201).json({ msg: 'Invoice created successfully', invoice: newInvoice.rows[0] });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET /api/invoices
    // @desc    Get all invoices for the logged-in user
    // @access  Private
    router.get('/', auth, async (req, res) => {
        const user_id = req.user.id; // Get the user ID from the request object

        try {
            const allInvoices = await pool.query('SELECT * FROM Invoices WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
            res.json(allInvoices.rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET /api/invoices/:id
    // @desc    Get a single invoice by ID for the logged-in user
    // @access  Private
    router.get('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id; // Get the user ID from the request object

        try {
            const invoice = await pool.query('SELECT * FROM Invoices WHERE invoice_id = $1 AND user_id = $2', [id, user_id]);
            if (invoice.rows.length === 0) {
                return res.status(404).json({ msg: 'Invoice not found or not authorized' });
            }
            res.json(invoice.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   PUT /api/invoices/:id
    // @desc    Update an invoice by ID for the logged-in user
    // @access  Private
    router.put('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id; // Get the user ID from the request object
        const { status, amount_due } = req.body;

        try {
            const updatedInvoice = await pool.query(
                `UPDATE Invoices
                 SET status = $1, amount_due = $2, updated_at = NOW()
                 WHERE invoice_id = $3 AND user_id = $4
                 RETURNING *`,
                [status, amount_due, id, user_id] // Add user_id to the WHERE clause
            );
            if (updatedInvoice.rows.length === 0) {
                return res.status(404).json({ msg: 'Invoice not found or not authorized' });
            }
            res.json({ msg: 'Invoice updated successfully', invoice: updatedInvoice.rows[0] });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   DELETE /api/invoices/:id
    // @desc    Delete an invoice by ID for the logged-in user
    // @access  Private
    router.delete('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id; // Get the user ID from the request object

        try {
            const result = await pool.query('DELETE FROM Invoices WHERE invoice_id = $1 AND user_id = $2 RETURNING *', [id, user_id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ msg: 'Invoice not found or not authorized' });
            }
            res.json({ msg: 'Invoice deleted successfully' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    return router;
};