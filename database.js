const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mycare.db');

db.serialize(() => {
    // Create patients table
    db.run(`
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT,
            age INTEGER,
            gender TEXT,
            complaint TEXT,
            vitals TEXT,
            triageLevel INTEGER,
            queueNumber INTEGER,
            doctor TEXT,
            status TEXT DEFAULT 'awaiting-triage'
        )
    `);

    // Create staff table
    db.run(`
        CREATE TABLE IF NOT EXISTS staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            role TEXT,
            specialization TEXT,
            status TEXT,
            queue INTEGER
        )
    `);
});

module.exports = db;