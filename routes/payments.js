// backend/routes/payments.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (pool) => {
    // @route   POST /api/payments
    // @desc    Create a new payment for an invoice
    // @access  Private
    router.post('/', auth, async (req, res) => {
        const { invoice_id, payment_date, amount_paid, payment_method, transaction_id } = req.body;
        const user_id = req.user.id;

        try {
            // First, verify that the invoice belongs to the current user
            const invoiceCheck = await pool.query(
                'SELECT * FROM Invoices WHERE invoice_id = $1 AND user_id = $2',
                [invoice_id, user_id]
            );

            if (invoiceCheck.rows.length === 0) {
                return res.status(403).json({ msg: 'Invoice not found or you are not authorized to add a payment to it' });
            }

            const newPayment = await pool.query(
                `INSERT INTO Payments (invoice_id, payment_date, amount_paid, payment_method, transaction_id, user_id)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [invoice_id, payment_date, amount_paid, payment_method, transaction_id, user_id]
            );
            res.status(201).json({ msg: 'Payment created successfully', payment: newPayment.rows[0] });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET /api/payments/invoice/:id
    // @desc    Get all payments for a specific invoice, filtered by user
    // @access  Private
    router.get('/invoice/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id;

        try {
            // Verify that the invoice belongs to the current user
            const invoiceCheck = await pool.query(
                'SELECT * FROM Invoices WHERE invoice_id = $1 AND user_id = $2',
                [id, user_id]
            );
            if (invoiceCheck.rows.length === 0) {
                return res.status(403).json({ msg: 'Invoice not found or you are not authorized to view its payments' });
            }

            // Retrieve payments for that invoice
            const payments = await pool.query('SELECT * FROM Payments WHERE invoice_id = $1 ORDER BY payment_date DESC', [id]);
            res.json(payments.rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   DELETE /api/payments/:id
    // @desc    Delete a payment by ID for the logged-in user
    // @access  Private
    router.delete('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id;

        try {
            // Check if the payment belongs to the current user
            const result = await pool.query('DELETE FROM Payments WHERE payment_id = $1 AND user_id = $2 RETURNING *', [id, user_id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ msg: 'Payment not found or not authorized' });
            }
            res.json({ msg: 'Payment deleted successfully' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    return router;
};