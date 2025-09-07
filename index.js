// index.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Whitelist of allowed origins for both local and Vercel deployments
const whitelist = [
    'http://localhost:3000',
    'https://crm-system-8750v82iu-charlie-oreobugs-projects.vercel.app'
];

// CORS options to dynamically check the request origin
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// PostgreSQL connection pool
// This is the updated section. It now uses a single connection string URL.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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