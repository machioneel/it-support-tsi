/*
# IT Asset Management Schema

Creates the `assets` register plus supporting ITAM tables. The app already queries
`assets` (src/lib/useAssets.ts) but the table does not exist yet, so the IT Assets
page currently renders empty — this migration is what makes it work.

Depends on: 20260907064000_split_users_employees.sql (already applied)
  `asset_assignments.employee_id` references `employees(id)` — assets are held by
  company employees, not by IT staff.

1. New Tables
- `assets`                  : core asset register
- `asset_assignments`       : which employee currently holds which asset
- `asset_maintenance_logs`  : service history
- `asset_documents`         : invoices, warranty scans, photos

2. Conventions followed from the existing schema
- `gen_random_uuid()` (pgcrypto, already installed) rather than uuid-ossp
- `timestamptz` everywhere — the system timezone is Asia/Jakarta
- `company_id uuid REFERENCES companies(id)` rather than a free-text company name
- RLS with anon + authenticated policies (no-auth app, anon key only)

3. RLS is NOT optional here
This database has an event trigger `public.ensure_rls` that runs on every
CREATE TABLE in `public` and enables row level security automatically. A new table
therefore starts with RLS ON and ZERO policies, which makes every anon query return
an empty result with no error. The policies in section 8 are what make these tables
readable at all.
*/

-- ============================================================
-- 1. Enums  (no CREATE TYPE IF NOT EXISTS in Postgres)
-- ============================================================
DO $$
BEGIN
  CREATE TYPE asset_status AS ENUM ('active', 'in_use', 'maintenance', 'retired', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE asset_condition AS ENUM ('good', 'fair', 'damaged');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE assignment_status AS ENUM ('assigned', 'returned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. assets
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  asset_tag       text UNIQUE NOT NULL,
  asset_name      text NOT NULL,
  asset_image     text,

  category        text NOT NULL,
  asset_type      text NOT NULL,

  brand           text,
  model           text,
  serial_number   text UNIQUE,

  condition       asset_condition NOT NULL DEFAULT 'good',
  status          asset_status    NOT NULL DEFAULT 'active',

  company_id      uuid REFERENCES companies(id) ON DELETE SET NULL,
  location        text,

  purchase_cost   numeric(14,2),
  purchase_date   date,

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 3. asset_assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS asset_assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  asset_id      uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  employee_id   uuid REFERENCES employees(id) ON DELETE SET NULL,

  assigned_date timestamptz NOT NULL DEFAULT now(),
  returned_date timestamptz,

  status        assignment_status NOT NULL DEFAULT 'assigned',
  notes         text,

  created_at    timestamptz DEFAULT now()
);

-- An asset can only be held by one employee at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_assignment_per_asset
  ON asset_assignments(asset_id) WHERE status = 'assigned';

-- A returned assignment must carry a return date, and an active one must not.
ALTER TABLE asset_assignments DROP CONSTRAINT IF EXISTS asset_assignments_return_check;
ALTER TABLE asset_assignments
  ADD CONSTRAINT asset_assignments_return_check
  CHECK (
    (status = 'assigned' AND returned_date IS NULL) OR
    (status = 'returned' AND returned_date IS NOT NULL)
  );

-- ============================================================
-- 4. asset_maintenance_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS asset_maintenance_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  asset_id            uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,

  description         text,
  cost                numeric(14,2),

  performed_at        timestamptz DEFAULT now(),
  next_maintenance_at timestamptz,

  created_at          timestamptz DEFAULT now()
);

-- ============================================================
-- 5. asset_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS asset_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  asset_id    uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,

  file_url    text NOT NULL,
  file_type   text,

  uploaded_at timestamptz DEFAULT now()
);

-- ============================================================
-- 6. Indexes
--    asset_tag and serial_number already have unique indexes from their
--    UNIQUE constraints — a second plain index on them would be redundant.
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_assets_status         ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_company_id     ON assets(company_id);
CREATE INDEX IF NOT EXISTS idx_assets_category       ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_created_at     ON assets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assignments_asset     ON asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employee  ON asset_assignments(employee_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_asset     ON asset_maintenance_logs(asset_id);

CREATE INDEX IF NOT EXISTS idx_documents_asset       ON asset_documents(asset_id);

-- ============================================================
-- 7. updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_assets ON assets;
CREATE TRIGGER set_updated_at_assets
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. RLS (anon + authenticated — no-auth app, same as every other table)
--    Required: ensure_rls has already switched RLS on for these tables.
-- ============================================================
ALTER TABLE assets                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_assignments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_documents        ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['assets', 'asset_assignments', 'asset_maintenance_logs', 'asset_documents']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon_select_%1$s" ON %1$I', t);
    EXECUTE format('CREATE POLICY "anon_select_%1$s" ON %1$I FOR SELECT TO anon, authenticated USING (true)', t);

    EXECUTE format('DROP POLICY IF EXISTS "anon_insert_%1$s" ON %1$I', t);
    EXECUTE format('CREATE POLICY "anon_insert_%1$s" ON %1$I FOR INSERT TO anon, authenticated WITH CHECK (true)', t);

    EXECUTE format('DROP POLICY IF EXISTS "anon_update_%1$s" ON %1$I', t);
    EXECUTE format('CREATE POLICY "anon_update_%1$s" ON %1$I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t);

    EXECUTE format('DROP POLICY IF EXISTS "anon_delete_%1$s" ON %1$I', t);
    EXECUTE format('CREATE POLICY "anon_delete_%1$s" ON %1$I FOR DELETE TO anon, authenticated USING (true)', t);
  END LOOP;
END $$;

-- ============================================================
-- 9. Storage bucket for asset images and documents
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-files', 'asset-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_upload_asset_files" ON storage.objects;
CREATE POLICY "anon_upload_asset_files" ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'asset-files');

DROP POLICY IF EXISTS "anon_read_asset_files" ON storage.objects;
CREATE POLICY "anon_read_asset_files" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'asset-files');

DROP POLICY IF EXISTS "anon_delete_asset_files" ON storage.objects;
CREATE POLICY "anon_delete_asset_files" ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'asset-files');
