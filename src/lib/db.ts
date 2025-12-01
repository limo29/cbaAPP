import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'cba.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS territories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    polygon TEXT NOT NULL, -- JSON string of [lat, lng][]
    route_geometry TEXT, -- JSON string of [lat, lng][] (polyline)
    driver_name TEXT
  );

  CREATE TABLE IF NOT EXISTS trees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    first_name TEXT,
    address TEXT NOT NULL,
    zip TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    payment_method TEXT,
    note TEXT,
    lat REAL,
    lng REAL,
    territory_id INTEGER,
    status TEXT DEFAULT 'open', -- open, collected, not_found
    sequence INTEGER DEFAULT 0,
    FOREIGN KEY (territory_id) REFERENCES territories(id)
  );
  
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    target_date TEXT,
    responsible TEXT,
    is_completed INTEGER DEFAULT 0
  );
`);

// Migration: Add route_geometry column if it doesn't exist
try {
  const columns = db.prepare("PRAGMA table_info(territories)").all() as any[];
  const hasRouteGeometry = columns.some(col => col.name === 'route_geometry');
  if (!hasRouteGeometry) {
    db.prepare("ALTER TABLE territories ADD COLUMN route_geometry TEXT").run();
  }

  const hasDriverName = columns.some(col => col.name === 'driver_name');
  if (!hasDriverName) {
    db.prepare("ALTER TABLE territories ADD COLUMN driver_name TEXT").run();
  }

  // Trees migrations
  const treeColumns = db.prepare("PRAGMA table_info(trees)").all() as any[];
  const treeFields = ['first_name', 'zip', 'city', 'email', 'payment_method'];

  for (const field of treeFields) {
    if (!treeColumns.some(col => col.name === field)) {
      db.prepare(`ALTER TABLE trees ADD COLUMN ${field} TEXT`).run();
    }
  }

} catch (e) {
  console.error("Migration failed:", e);
}

export default db;
