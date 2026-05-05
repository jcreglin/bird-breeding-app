const Database = require('better-sqlite3');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
require('fs').mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'birds.db'));
db.pragma('foreign_keys = ON');

function columnExists(table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);
}

function addColumn(table, column, sqlType) {
  if (!columnExists(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${sqlType}`);
  }
}

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
    unique_id TEXT,
    name TEXT NOT NULL,
    species TEXT,
    band_number TEXT,
    cage_number TEXT,
    clutch_number TEXT,
    gender TEXT DEFAULT 'unknown',
    dob TEXT,
    mutation TEXT,
    color TEXT,
    genotype TEXT,
    phenotype TEXT,
    breeding_status TEXT,
    breeding_line TEXT,
    show_quality TEXT,
    estimated_value REAL,
    acquired_date TEXT,
    sold_date TEXT,
    purchase_price REAL,
    sale_price REAL,
    photo_url TEXT,
    notes TEXT,
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

  CREATE TABLE IF NOT EXISTS cages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    cage_number TEXT NOT NULL,
    location TEXT,
    size TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS species (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    scientific_name TEXT,
    banding_period TEXT,
    incubation_days TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    color TEXT NOT NULL,
    band_text TEXT,
    band_number TEXT NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_birds_user_id ON birds(user_id);
  CREATE INDEX IF NOT EXISTS idx_pairs_user_id ON pairs(user_id);
  CREATE INDEX IF NOT EXISTS idx_clutches_user_id ON clutches(user_id);
  CREATE INDEX IF NOT EXISTS idx_eggs_user_id ON eggs(user_id);
  CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
  CREATE INDEX IF NOT EXISTS idx_cages_user_id ON cages(user_id);
  CREATE INDEX IF NOT EXISTS idx_species_user_id ON species(user_id);
  CREATE INDEX IF NOT EXISTS idx_bands_user_id ON bands(user_id);
`);

addColumn('birds', 'unique_id', 'TEXT');
addColumn('birds', 'cage_number', 'TEXT');
addColumn('birds', 'clutch_number', 'TEXT');
addColumn('birds', 'genotype', 'TEXT');
addColumn('birds', 'phenotype', 'TEXT');
addColumn('birds', 'breeding_status', 'TEXT');
addColumn('birds', 'breeding_line', 'TEXT');
addColumn('birds', 'show_quality', 'TEXT');
addColumn('birds', 'estimated_value', 'REAL');
addColumn('birds', 'acquired_date', 'TEXT');
addColumn('birds', 'sold_date', 'TEXT');
addColumn('birds', 'purchase_price', 'REAL');
addColumn('birds', 'sale_price', 'REAL');
addColumn('birds', 'notes', 'TEXT');
addColumn('species', 'show_in_dropdown', 'INTEGER NOT NULL DEFAULT 0');

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_birds_user_band_unique
  ON birds(user_id, band_number)
  WHERE band_number IS NOT NULL AND band_number <> '';

  CREATE UNIQUE INDEX IF NOT EXISTS idx_birds_user_unique_id_unique
  ON birds(user_id, unique_id)
  WHERE unique_id IS NOT NULL AND unique_id <> '';

  CREATE UNIQUE INDEX IF NOT EXISTS idx_cages_user_cage_number_unique
  ON cages(user_id, cage_number);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_species_user_name_unique
  ON species(user_id, name);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_bands_user_band_number_unique
  ON bands(user_id, band_number);
`);

module.exports = db;
