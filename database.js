const Database = require('better-sqlite3');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
require('fs').mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'birds.db'));
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    subscription_tier TEXT NOT NULL DEFAULT 'Free',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS birds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    species TEXT,
    band_number TEXT,
    gender TEXT DEFAULT 'unknown',
    dob TEXT,
    mutation TEXT,
    color TEXT,
    photo_url TEXT,
    sire_id INTEGER,
    dam_id INTEGER,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sire_id) REFERENCES birds(id) ON DELETE SET NULL,
    FOREIGN KEY (dam_id) REFERENCES birds(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS pairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sire_id INTEGER NOT NULL,
    dam_id INTEGER NOT NULL,
    pair_date TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sire_id) REFERENCES birds(id) ON DELETE CASCADE,
    FOREIGN KEY (dam_id) REFERENCES birds(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS clutches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pair_id INTEGER NOT NULL,
    lay_date TEXT,
    hatch_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pair_id) REFERENCES pairs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS eggs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    clutch_id INTEGER NOT NULL,
    egg_number INTEGER,
    outcome TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (clutch_id) REFERENCES clutches(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    type TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tier TEXT NOT NULL DEFAULT 'Free',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_birds_user_id ON birds(user_id);
  CREATE INDEX IF NOT EXISTS idx_pairs_user_id ON pairs(user_id);
  CREATE INDEX IF NOT EXISTS idx_clutches_user_id ON clutches(user_id);
  CREATE INDEX IF NOT EXISTS idx_eggs_user_id ON eggs(user_id);
  CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
`);

module.exports = db;
