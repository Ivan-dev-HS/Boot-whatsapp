export const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id TEXT NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (list_id, normalized_name)
);

CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store TEXT NOT NULL,
  product_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  price REAL NOT NULL,
  unit TEXT,
  url TEXT,
  scraped_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_offers_store_scraped_at ON offers (store, scraped_at);
CREATE INDEX IF NOT EXISTS idx_offers_normalized_name ON offers (normalized_name);
`;
