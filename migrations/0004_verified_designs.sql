ALTER TABLE designs ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE designs ADD COLUMN instruction_pdf_key TEXT;

CREATE INDEX IF NOT EXISTS designs_verified_gallery_idx
  ON designs(is_verified, status, approved_at);
