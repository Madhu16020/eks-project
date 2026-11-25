const express = require("express");
const { Pool } = require('pg');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'cloudops',
    user: process.env.DB_USER || 'cloudops_user',
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 30000,
    max: 10
});

let startupComplete = false;

// Startup probe
app.get('/health/startup', (req, res) => {
    if (!startupComplete) {
        return res.status(503).json({ status: 'starting' });
    }

    res.status(200).json({ status: 'started' });
});

// Liveness probe - checks whether the process is alive
app.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
});

// Readiness probe - checks database connectivity
app.get('/health/ready', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'ready' });
    } catch (error) {
        console.error('Readiness check failed:', error.message);
        res.status(503).json({ status: 'not ready' });
    }
});

// Application information
app.get('/api', (req, res) => {
    res.json({
        application: 'CloudOps 3-Tier Application',
        version: '1.0.0',
        status: 'running'
    });
});

// Get employees
app.get('/api/employees', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM employees ORDER BY id'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Fetch employees failed:', error.message);
        res.status(500).json({ error: 'Unable to fetch employees' });
    }
});

// Add employee
app.post('/api/employees', async (req, res) => {
    const { name, email, department } = req.body;

    if (!name || !email || !department) {
        return res.status(400).json({
            error: 'Name, email and department are required'
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO employees (name, email, department)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, email, department]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create employee failed:', error.message);

        if (error.code === '23505') {
            return res.status(409).json({ error: 'Email already exists' });
        }

        res.status(500).json({ error: 'Unable to create employee' });
    }
});

// Update employee
app.put('/api/employees/:id', async (req, res) => {
    const { name, email, department } = req.body;

    if (!name || !email || !department) {
        return res.status(400).json({
            error: 'Name, email and department are required'
        });
    }

    try {
        const result = await pool.query(
            `UPDATE employees
             SET name = $1, email = $2, department = $3
             WHERE id = $4
             RETURNING *`,
            [name, email, department, req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update employee failed:', error.message);
        res.status(500).json({ error: 'Unable to update employee' });
    }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM employees WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Delete employee failed:', error.message);
        res.status(500).json({ error: 'Unable to delete employee' });
    }
});

const server = app.listen(PORT, '0.0.0.0', () => {
    startupComplete = true;
    console.log(`Backend listening on port ${PORT}`);
});

// Graceful shutdown
async function shutdown(signal) {
    console.log(`${signal} received. Shutting down...`);

    server.close(async () => {
        try {
            await pool.end();
            console.log('Database pool closed');
            process.exit(0);
        } catch (error) {
            console.error('Shutdown error:', error.message);
            process.exit(1);
        }
    });

    setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
