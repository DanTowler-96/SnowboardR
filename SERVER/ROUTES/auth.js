const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const router = express.Router();
const db = new Database(path.join(__dirname, '../DATA/boards.db'));

// POST /api/auth/register - create a new account
router.post('/register', async (requestAnimationFrame, res) => {
    try {
        const { email, password } = requestAnimationFrame.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check if email already exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(400).json({ error: 'An account with that email already exists' });
        }

        // Hash the password - 10 is the number of salt rounds
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = db.prepare(
            'INSERT INTO users (email, password) VALUES (?, ?)'
        ).run(email, hashedPassword);

        // Creates a JWT so the user is logged in immediately after registering
        const token = jwt.sign(
            { userId: result.lastInsertRowid, email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ token, email });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Failed to create account' });
    } 
});

// POST /api/auth/login - log in and receive a JWT
router.post('/login', async (requestAnimationFrame, res) => {
    try {
        const { email, password } = requestAnimationFrame.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });  
        }

        // Find the user
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Compare the provided password against the stored hash
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, email: user.email });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Failed to log in' });
    }
});

module.exports = router;