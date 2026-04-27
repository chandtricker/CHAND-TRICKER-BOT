const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra');

const dbPath = path.join(__dirname, 'botdata', 'database.sqlite');
fs.ensureDirSync(path.dirname(dbPath));

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    exp INTEGER DEFAULT 0,
    money INTEGER DEFAULT 0,
    banned INTEGER DEFAULT 0,
    banReason TEXT,
    data TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    name TEXT,
    approved INTEGER DEFAULT 0,
    banned INTEGER DEFAULT 0,
    banReason TEXT,
    settings TEXT DEFAULT '{}',
    data TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS currencies (
    id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0,
    bank INTEGER DEFAULT 0,
    exp INTEGER DEFAULT 0,
    dailyStreak INTEGER DEFAULT 0,
    lastDaily TEXT,
    lastWork TEXT,
    transactions TEXT DEFAULT '[]'
  );
`);

try {
  db.exec(`ALTER TABLE currencies ADD COLUMN exp INTEGER DEFAULT 0`);
} catch (e) {
}

module.exports = db;
