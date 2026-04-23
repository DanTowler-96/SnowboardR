const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const router = express.Router();

const db = new Database(path.join(__dirname, '../DATA/boards.db'));

// Middleware - blocks requests without correct API key
function requireApiKey(req, res, next) {
    const key = req.headers['x-api-key'];
    if (!key || key !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: 'Unauthorised' });
    }
    next();
}

// Apply the API key check to every route in this file
router.use(requireApiKey);

// POST /api/admin/boards - add a new board
router.post('/boards', (req, res) => {
    try {
        const board = req.body;

        const insert = db.prepare(`
          INSERT INTO boards VALUES (
            @id, @brand, @model, @category, @ability_level, @riding_style,
            @flex, @shape, @profile, @min_weight, @max_weight, @sizes,
            @width, @preferred_feel, @edge_hold, @powder_friendly, @tags,
            @description, @full_description, @why_recommended, @price,
            @image_url, @affiliate_url
          )    
        `);

        insert.run({
            ...board,
            sizes: JSON.stringify(board.sizes),
            preferred_feel: JSON.stringify(board.preferred_feel),
            tags: JSON.stringify(board.tags),
            powder_friendly: board.powder_friendly ? 1 : 0,
        });

        res.status(201).json({ message: 'Board added successfully' });
    } catch (err) {
        console.error('Failed to add board:', err);
        res.status(500).json({ error: 'Failed to add board' });
    }
});

// PUT /api/admin/boards/:id - update an existing board
router.put('/boards/:id', (req, res) => {
    try {
        const board = req.body;
        const { id } = req.params;
        
        const update = db.prepare(`
          UPDATE boards SET
            brand = @brand,
            model = @model,
            category = @category,
            ability_level = @ability_level,
            riding_style = @riding_style,
            flex = @flex,
            shape = @shape,
            profile = @profile,
            min_weight = @min_weight,
            max_weight = @max_weight,
            sizes = @sizes,
            width = @width,
            preferred_feel = @preferred_feel,
            edge_hold = @edge_hold,
            powder_friendly = @powder_friendly,
            tags = @tags,
            description = @description,
            full_description = @full_description,
            why_recommended = @why_recommended,
            price = @price,
            image_url = @image_url,
            affiliate_url = @affiliate_url
          WHERE id = @id      
        `);

        const result = update.run({
            ...board,
            id,
            sizes: JSON.stringify(board.sizes),
            preferred_feel: JSON.stringify(board.preferred_feel),
            tags: JSON.stringify(board.tags),
            powder_friendly: board.powder_friendly ? 1 : 0,
        });

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Board not found' });
        }

        res.json({ message: 'Board updated successfully' });
    } catch (err) {
        console.error('Failed to update board:', err);
        res.status(500).json({ error: 'Failed to update board' });
    }
});

// DELETE /api/admin/boards/:id - delete a board
router.delete('/boards/:id', (req, res) => {
    try {
        const { id } = req.params;

        const result = db.prepare('DELETE FROM boards WHERE id = @id').run({ id });

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Board not found' });
        }

        res.json({ message: 'Board deleted successfully' });
    } catch (err) {
        console.error('Failed to delete board:', err);
        res.status(500).json({ error: 'Failed to delete board' });
    }
});

module.exports = router;