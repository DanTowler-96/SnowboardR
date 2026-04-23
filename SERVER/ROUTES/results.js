const express = require('express');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const router = express.Router();
const db = new Database(path.join(__dirname, '../DATA/boards.db'));

// Middleware - verifies the JWT on every request to this router
function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1]; // expects "Bearer <token>"

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // makes userID available in route handlers
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
// Apply auth check to every route in this file
router.use(requireAuth);

// POST /api/results - save quiz results
router.post('/', (req, res) => {
    try {
        const { inputs, results } = req.body;

        if (!inputs || !results) {
            return res.status(400).json({ error: 'inputs and results ar required' });
        }

        db.prepare(
            'INSERT INTO saved_results (user_id, inputs, results) VALUES (?, ?, ?)'
        ).run(req.user.userId, JSON.stringify(inputs), JSON.stringify(results));

        res.status(201).json({ message: 'Results saved successfully' });
    } catch (err) {
        console.error('Save results error:', err);
        res.status(500).json({ error: 'Failed to save results' });
    }
});

// GET /api/results - get all saved results for the logged in user
router.get('/', (req, res) => {
    try {
        const rows = db.prepare(
            'SELECT * FROM saved_results WHERE user_id = ? ORDER BY created_at DESC'
        ).all(req.user.userId);

        const results = rows.map(row => ({
            id: row.id,
            inputs: JSON.parse(row.inputs),
            results: JSON.parse(row.results),
            created_at: row.created_at,
        }));

        res.json(results);
    } catch (err) {
        console.error('Get results error:', err);
        res.status(500).json({ error: 'Failed to retrieve results' });
    }
});

module.exports = router;