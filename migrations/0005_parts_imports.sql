CREATE TABLE IF NOT EXISTS parts_imports (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending_order' CHECK (status IN ('pending_order', 'ordered')),
  source_filename TEXT,
  total_pieces INTEGER NOT NULL,
  flat_pieces INTEGER NOT NULL,
  raised_pieces INTEGER NOT NULL,
  color_lines INTEGER NOT NULL,
  ignored_lines INTEGER NOT NULL DEFAULT 0,
  ignored_pieces INTEGER NOT NULL DEFAULT 0,
  unsupported_json TEXT NOT NULL DEFAULT '[]',
  charge_blocks INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  shopify_order_id TEXT,
  order_number TEXT,
  order_email_hash TEXT,
  ordered_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS parts_import_lines (
  id TEXT PRIMARY KEY,
  import_id TEXT NOT NULL,
  piece_type TEXT NOT NULL CHECK (piece_type IN ('98138', '4073')),
  bricklink_color_id INTEGER NOT NULL,
  color_name TEXT NOT NULL,
  warehouse_code TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY (import_id) REFERENCES parts_imports(id) ON DELETE CASCADE,
  UNIQUE (import_id, sku)
);

CREATE TABLE IF NOT EXISTS parts_import_access_tokens (
  id TEXT PRIMARY KEY,
  import_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  FOREIGN KEY (import_id) REFERENCES parts_imports(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parts_imports_status_created ON parts_imports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parts_imports_order_number ON parts_imports(order_number);
CREATE INDEX IF NOT EXISTS idx_parts_import_lines_import ON parts_import_lines(import_id);
