const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Creates the database file at SERVER/DATA/boards.db
const db = new Database(path.join(__dirname, 'DATA/boards.db'));

// Read boards.json
const boards = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'DATA/boards.json'), 'utf8')
);

// Create the boards table
db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    brand TEXT,
    model TEXT,
    category TEXT,
    ability_level TEXT,
    riding_style TEXT,
    flex INTEGER,
    shape TEXT,
    profile TEXT,
    min_weight REAL,
    max_weight REAL,
    sizes TEXT,
    width TEXT,
    preferred_feel TEXT,
    edge_hold TEXT,
    powder_friendly INTEGER,
    tags TEXT,
    description TEXT,
    full_description TEXT,
    why_recommended TEXT,
    price REAL,
    image_url TEXT,
    affiliate_url TEXT
  )
`);

// Clear existing data so we can re-run safely
db.prepare('DELETE FROM boards').run();

// Insert each boards
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
        // Arrays can't be stored directly in SQLite - convert to JSON strings
        sizes: JSON.stringify(board.sizes),
        preferred_feel: JSON.stringify(board.preferred_feel),
        tags: JSON.stringify(board.tags),
        powder_friendly: board.powder_friendly ? 1 : 0,
    });
}

console.log(`Seeded ${boards.length} boards into boards.db`);
db.close();