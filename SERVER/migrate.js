const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'DATA/boards.db'));

// Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )    
`);

// Saved results table
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

console.log('Tables created successfully');
db.close();