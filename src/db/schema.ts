export const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (chat_id, normalized_name)
);

CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store TEXT NOT NULL,
  product_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  price REAL NOT NULL,
  unit TEXT,
  valid_until TEXT,
  url TEXT,
  scraped_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_offers_store_scraped_at ON offers (store, scraped_at);
CREATE INDEX IF NOT EXISTS idx_offers_normalized_name ON offers (normalized_name);

-- Marca que una oferta concreta ya se ha avisado a un chat para un producto
-- de su lista, para no repetir la misma alerta cada dia.
CREATE TABLE IF NOT EXISTS sent_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  store TEXT NOT NULL,
  offer_signature TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (chat_id, product_id, offer_signature)
);
`;
