require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const boardsRouter = require('./ROUTES/boards');
const adminRouter = require('./ROUTES/admin');
const authRouter = require('./ROUTES/auth');
const resultsRouter = require('./ROUTES/results');

const app = express();
const PORT = process.env.PORT || 3000;

// Auto-seed the database if it doesn't exist
const dbPath = path.join(__dirname, 'DATA/boards.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY, brand TEXT, model TEXT, category TEXT,
    ability_level TEXT, riding_style TEXT, flex INTEGER, shape TEXT,
    profile TEXT, min_weight REAL, max_weight REAL, sizes TEXT,
    width TEXT, preferred_feel TEXT, edge_hold TEXT, powder_friendly INTEGER,
    tags TEXT, description TEXT, full_description TEXT, why_recommended TEXT,
    price REAL, image_url TEXT, affiliate_url TEXT
  )    
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )    
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS saved_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    inputs TEXT NOT NULL,
    results TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )    
`);

const boardCount = db.prepare('SELECT COUNT(*) as count FROM boards').get();
if (boardCount.count === 0) {
    const boards = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'DATA/boards.json'), 'utf8')
    );
    const insert = db.prepare(`
      INSERT INTO boards VALUES (
        @id, @brand, @model, @category, @ability_level, @riding_style,
        @flex, @shape, @profile, @min_weight, @max_weight, @sizes,
        @width, @preferred_feel, @edge_hold, @powder_friendly, @tags,
        @description, @full_description, @why_recommended, @price,
        @image_url, @affiliate_url
      )      
    `);
    for (const board of boards) {
        insert.run({
            ...board,
            sizes: JSON.stringify(board.sizes),
            preferred_feel: JSON.stringify(board.preferred_feel),
            tags: JSON.stringify(board.tags),
            powder_friendly: board.powder_friendly ? 1 : 0,
        });
    }
    console.log(`Seeded ${boards.length} boards into database`);
}

db.close();

// Parses incoming JSON request bodies
app.use(express.json());

// Serves the CLIENT folder as static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..', 'CLIENT')));

// ROUTES
app.use('/api/boards', boardsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/results', resultsRouter);

app.listen(PORT, () => {
    console.log(`SnowboardR server running at http://localhost:${PORT}`);
});
