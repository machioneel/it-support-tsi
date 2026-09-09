/*
# Asset document metadata

`asset_documents` could store a file but not say what the file *is*. Signed
handover and return forms (BAST) need to be told apart from invoices and warranty
scans, and a stored file with no original name is unusable in a list.

Adds:
- `file_name` : the original upload name, shown in the UI
- `category`  : what kind of document it is

Runs after 20260907120000_create_assets_schema.sql, which creates the table.
Safe to re-run.
*/

ALTER TABLE asset_documents ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE asset_documents ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Lainnya';

-- Keep the category list closed so the filter and badges stay meaningful.
ALTER TABLE asset_documents DROP CONSTRAINT IF EXISTS asset_documents_category_check;
ALTER TABLE asset_documents
  ADD CONSTRAINT asset_documents_category_check
  CHECK (category IN (
    'BAST Serah Terima',
    'BAST Pengembalian',
    'Invoice',
    'Garansi',
    'Lainnya'
  ));

CREATE INDEX IF NOT EXISTS idx_documents_category ON asset_documents(category);
