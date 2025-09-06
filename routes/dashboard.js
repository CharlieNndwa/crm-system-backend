// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (pool) => {
    // @route   GET /api/dashboard
    // @desc    Get aggregated data for the dashboard widgets
    // @access  Private
    router.get('/', auth, async (req, res) => {
        try {
            const user_id = req.user.id;

            // Fetch total counts for summary widgets, filtered by user_id
            const customersCount = await pool.query('SELECT COUNT(*) FROM Customers WHERE user_id = $1', [user_id]);
            const dealsCount = await pool.query('SELECT COUNT(*) FROM Deals WHERE user_id = $1', [user_id]);
            const employeesCount = await pool.query('SELECT COUNT(*) FROM Employees WHERE user_id = $1', [user_id]);
            const inventoryCount = await pool.query('SELECT COUNT(*) FROM Inventory WHERE user_id = $1', [user_id]);

            // Deals by stage aggregation, filtered by user_id
            const dealsByStage = await pool.query(`
                SELECT stage, COUNT(*) as count
                FROM Deals
                WHERE user_id = $1
                GROUP BY stage
                ORDER BY count DESC
            `, [user_id]);

            // Invoices by status aggregation, filtered by user_id
            const invoicesByStatus = await pool.query(`
                SELECT status, COUNT(*) as count
                FROM Invoices
                WHERE user_id = $1
                GROUP BY status
                ORDER BY count DESC
            `, [user_id]);

            // Low stock inventory count, filtered by user_id
            const lowStockCount = await pool.query(`
                SELECT COUNT(*) FROM Inventory WHERE user_id = $1 AND stock_quantity < 10
            `, [user_id]);

            // Recent tasks (limit to 5), filtered by user_id
            const recentTasks = await pool.query(`
                SELECT task_id, task_name, status, due_date
                FROM Tasks
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 5
            `, [user_id]);

            res.json({
                customersCount: parseInt(customersCount.rows[0].count),
                dealsCount: parseInt(dealsCount.rows[0].count),
                employeesCount: parseInt(employeesCount.rows[0].count),
                inventoryCount: parseInt(inventoryCount.rows[0].count),
                dealsByStage: dealsByStage.rows.map(row => ({
                    stage: row.stage,
                    count: parseInt(row.count)
                })),
                invoicesByStatus: invoicesByStatus.rows.map(row => ({
                    status: row.status,
                    count: parseInt(row.count)
                })),
                lowStockCount: parseInt(lowStockCount.rows[0].count),
                recentTasks: recentTasks.rows,
            });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    return router;
};