// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Added the jsonwebtoken import
const auth = require('../middleware/auth');
require('dotenv').config();
const { sendPasswordResetEmail } = require('../services/emailService');

module.exports = (pool) => {
    // @route   POST /api/auth/register
    // @desc    Register a new user
    // @access  Public
    router.post('/register', async (req, res) => {
        const { email, password, username } = req.body; // Added username

        try {
            // Check if the user already exists
            const userExists = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
            if (userExists.rows.length > 0) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Save the new user to the database with the hashed password and username
            const newUser = await pool.query(
                'INSERT INTO Users (email, password, username) VALUES ($1, $2, $3) RETURNING user_id, email, username, created_at',
                [email, hashedPassword, username] // Added username to the insert query
            );

            res.status(201).json({ msg: 'User registered successfully', user: newUser.rows[0] });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   POST /api/auth/login
    // @desc    Authenticate user & get token
    // @access  Public
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;

        try {
            // Check if user exists
            const user = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
            if (user.rows.length === 0) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            // Check if password is correct
            const isMatch = await bcrypt.compare(password, user.rows[0].password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            // Return a JSON Web Token (JWT)
            const payload = {
                user: {
                    id: user.rows[0].user_id,
                },
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET /api/auth/protected
    // @desc    A sample protected route
    // @access  Private
    router.get('/protected', auth, (req, res) => {
        res.json({ msg: `Welcome, user ${req.user.id}. You have access to this private route.` });
    });

    // @route   GET /api/auth/user
    // @desc    Get user details (name) by token
    // @access  Private
    router.get('/user', auth, async (req, res) => {
        try {
            const user = await pool.query(
                'SELECT user_id, username, email FROM Users WHERE user_id = $1',
                [req.user.id]
            );
            res.json(user.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   POST /api/auth/forgot-password
    // @desc    Request a password reset email
    // @access  Public
    router.post('/forgot-password', async (req, res) => {
        const { email } = req.body;
        try {
            const user = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
            if (user.rows.length === 0) {
                return res.status(400).json({ msg: 'User with that email does not exist' });
            }

            const resetToken = jwt.sign({ id: user.rows[0].user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour

            await pool.query(
                'UPDATE Users SET reset_token = $1, reset_token_expiry = $2 WHERE user_id = $3',
                [resetToken, tokenExpiry, user.rows[0].user_id]
            );

            await sendPasswordResetEmail(email, resetToken);

            res.status(200).json({ msg: 'Password reset link sent to your email.' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   POST /api/auth/reset-password/:token
// @desc    Reset password using a token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await pool.query(
            'SELECT * FROM Users WHERE user_id = $1 AND reset_token = $2 AND reset_token_expiry > NOW()',
            [decoded.id, token]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid or expired token.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query(
            'UPDATE Users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $2',
            [hashedPassword, user.rows[0].user_id]
        );

        res.json({ msg: 'Password has been successfully reset.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

    return router;
};