const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const { scoreAllBoards, recommendSize } = require('../scoringEngine');

const router = express.Router();

// Open a connection to the Database
const db = new Database(path.join(__dirname, '../DATA/boards.db'));

// Helper - converts a raw database row back into the shape the scoring engine expects
function parseBoard(row) {
    return {
        ...row,
        sizes: JSON.parse(row.sizes),
        preferred_feel: JSON.parse(row.preferred_feel),
        tags: JSON.parse(row.tags),
        powder_friendly: row.powder_friendly === 1,
    };
}

// GET/api/boards - returns all boards
router.get('/', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM boards').all();
        res.json(rows.map(parseBoard));
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to load boards' });
    }
});

// POST /api/find-boards - scores and ranks boards against user inputs
router.post('/find', (req, res) => {
    try {
        const userInputs = req.body;
        const { budget } = userInputs;

        const rows = db.prepare('SELECT * FROM boards').all();
        const boards = rows.map(parseBoard);

        let results = scoreAllBoards(userInputs, boards).map(result => ({
            ...result,
            recommendedSize: recommendSize(
                userInputs.heightCm,
                userInputs.weightKg,
                result.board.sizes
            ),
        }));

        if (budget) {
            const withinBudget = results.filter(r => r.board.price <= budget);
            if (withinBudget.length === 0) {
                results = results
                  .sort((a, b) => a.board.price - b.board.price)
                  .slice(0, 3)
                  .map(r => ({ ...r, overBudget: true}));
            } else {
                results = withinBudget;
            }
        }

        res.json(results);
    }   catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to score boards' });
    }
});

module.exports = router;