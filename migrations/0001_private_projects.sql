CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  design_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_order',
  shopify_order_id TEXT,
  order_number TEXT,
  order_email_hash TEXT,
  ordered_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS projects_order_lookup_idx
  ON projects(order_number, order_email_hash);

CREATE INDEX IF NOT EXISTS projects_design_idx
  ON projects(design_id);

CREATE TABLE IF NOT EXISTS project_access_tokens (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS project_access_tokens_project_idx
  ON project_access_tokens(project_id);

CREATE TABLE IF NOT EXISTS project_lookup_attempts (
  fingerprint TEXT NOT NULL,
  window_start TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (fingerprint, window_start)
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  received_at TEXT NOT NULL
);
