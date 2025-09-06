// backend/routes/inventory.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

module.exports = (pool) => {
    // @route   POST /api/inventory
    // @desc    Add a new inventory item for the logged-in user
    // @access  Private
    router.post('/', auth, async (req, res) => {
        const { item_name, description, stock_quantity, unit_price } = req.body;
        const user_id = req.user.id;

        try {
            const newItem = await pool.query(
                `INSERT INTO Inventory (item_name, description, stock_quantity, unit_price, user_id)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [item_name, description, stock_quantity, unit_price, user_id]
            );
            res.status(201).json({ msg: 'Inventory item added successfully', item: newItem.rows[0] });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET /api/inventory
    // @desc    Get all inventory items for the logged-in user
    // @access  Private
    router.get('/', auth, async (req, res) => {
        const user_id = req.user.id;

        try {
            const allItems = await pool.query('SELECT * FROM Inventory WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
            res.json(allItems.rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   PUT /api/inventory/:id
    // @desc    Update an inventory item by ID for the logged-in user
    // @access  Private
    router.put('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id;
        const { item_name, description, stock_quantity, unit_price } = req.body;
        
        try {
            const updatedItem = await pool.query(
                `UPDATE Inventory
                 SET item_name = $1, description = $2, stock_quantity = $3, unit_price = $4, updated_at = NOW()
                 WHERE item_id = $5 AND user_id = $6
                 RETURNING *`,
                [item_name, description, stock_quantity, unit_price, id, user_id]
            );

            if (updatedItem.rows.length === 0) {
                return res.status(404).json({ msg: 'Inventory item not found or not authorized' });
            }

            res.json({ msg: 'Inventory item updated successfully', item: updatedItem.rows[0] });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   DELETE /api/inventory/:id
    // @desc    Delete an inventory item by ID for the logged-in user
    // @access  Private
    router.delete('/:id', auth, async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.id;

        try {
            const result = await pool.query('DELETE FROM Inventory WHERE item_id = $1 AND user_id = $2 RETURNING *', [id, user_id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ msg: 'Inventory item not found or not authorized' });
            }

            res.json({ msg: 'Inventory item deleted successfully' });
            
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    return router;
};