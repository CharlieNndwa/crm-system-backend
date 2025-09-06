// index.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Import the auth routes AND pass the pool to it
const authRoutes = require('./routes/auth')(pool);
app.use('/api/auth', authRoutes);

// Import the customers routes AND pass the pool to it
const customersRoutes = require('./routes/customers')(pool);
app.use('/api/customers', customersRoutes);

// Import the deals routes AND pass the pool to it
const dealsRoutes = require('./routes/deals')(pool);
app.use('/api/deals', dealsRoutes);

// Import the tasks routes AND pass the pool to it
const tasksRoutes = require('./routes/tasks')(pool);
app.use('/api/tasks', tasksRoutes);

// Import the employees routes AND pass the pool to it
const employeesRoutes = require('./routes/employees')(pool);
app.use('/api/employees', employeesRoutes);

// Import the inventory routes AND pass the pool to it
const inventoryRoutes = require('./routes/inventory')(pool);
app.use('/api/inventory', inventoryRoutes);

// Import the invoices routes AND pass the pool to it
const invoicesRoutes = require('./routes/invoices')(pool);
app.use('/api/invoices', invoicesRoutes);

// Import the payments routes AND pass the pool to it
const paymentsRoutes = require('./routes/payments')(pool);
app.use('/api/payments', paymentsRoutes);

// Import the dashboard routes
const dashboardRoutes = require('./routes/dashboard')(pool);
app.use('/api/dashboard', dashboardRoutes);

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
    } else {
        console.log('Successfully connected to the PostgreSQL database.');
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('CRM Backend is running!');
});

// At the very end of the file
module.exports = app;