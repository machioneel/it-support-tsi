/*
# Existing asset register

23 assets transcribed from the inventory spreadsheet.

Depends on:
  20260907120000_create_assets_schema.sql   (assets table)
  20260907140000_set_companies.sql          (the two PTs)
  20260908110000_extend_asset_vocabulary.sql (condition 'excellent', company CIS)

Decisions worth knowing about, because the spreadsheet and the schema do not
line up one to one:

1. STATUS. The sheet uses "Active" and "In Storage". In the sheet, "Active"
   always has a holder and "In Storage" never does, so they map onto the schema
   by meaning rather than by name:
       "Active"     -> in_use  (held by an employee)
       "In Storage" -> active  (in stock, available)
   Flip this if the intent was different.

2. ASSET TAG. The sheet has no tag column, so tags are generated here:
   TSI-PHN-0xx for phones and TSI-LTP-1xx for laptops. The 100 series avoids
   colliding with TSI-LTP-001, which already exists.

3. BRAND / MODEL. The sheet has neither; both are split off the asset name
   (e.g. "Samsung A03s" -> brand Samsung, model A03s).

4. Empty serial numbers are stored as NULL, not '', because a unique index
   would reject a second empty string.

5. Asset names are kept exactly as written, including "Lenovo Thinkpadd T470s".

ON CONFLICT DO NOTHING makes this safe to re-run and stops it from overwriting
anything already entered by hand.
*/

DO $$
DECLARE
  co_tsi uuid;
  co_dms uuid;
  co_cis uuid;
BEGIN
  SELECT id INTO co_tsi FROM companies WHERE company_name = 'PT. TSI Sertifikasi Internasional';
  SELECT id INTO co_dms FROM companies WHERE company_name = 'PT. Dharma Mitra Solusi';
  SELECT id INTO co_cis FROM companies WHERE company_name = 'PT. Chandra Inovasi Solusindo';

  IF co_tsi IS NULL OR co_dms IS NULL OR co_cis IS NULL THEN
    RAISE EXCEPTION 'Perusahaan belum lengkap. Jalankan 20260907140000_set_companies.sql dan 20260908110000_extend_asset_vocabulary.sql lebih dulu.';
  END IF;

  INSERT INTO assets (
    asset_tag, asset_name, category, asset_type,
    brand, model, serial_number,
    condition, status, company_id, location,
    purchase_cost, purchase_date
  )
  VALUES
    -- ---------------------------------------------------------- Phones
    ('TSI-PHN-001', 'Samsung A03s',  'phone', 'Hardware', 'Samsung', 'A03s',   NULL, 'good', 'in_use', co_tsi, 'Ad Premier',  1500000, '2022-10-24'),
    ('TSI-PHN-002', 'Samsung A03s',  'phone', 'Hardware', 'Samsung', 'A03s',   NULL, 'good', 'active', co_tsi, 'Pondok Cabe', 1500000, '2022-10-24'),
    ('TSI-PHN-003', 'Poco M3 Pro',   'phone', 'Hardware', 'Poco',    'M3 Pro', NULL, 'good', 'in_use', co_dms, 'Pondok Cabe', 2550300, '2022-06-09'),
    ('TSI-PHN-004', 'Poco M6',       'phone', 'Hardware', 'Poco',    'M6',     NULL, 'good', 'in_use', co_tsi, 'Ad Premier',  1949000, '2024-12-05'),
    ('TSI-PHN-005', 'Redmi A3',      'phone', 'Hardware', 'Redmi',   'A3',     NULL, 'good', 'in_use', co_tsi, 'Ad Premier',  1465650, '2024-10-10'),
    ('TSI-PHN-006', 'Samsung A03s',  'phone', 'Hardware', 'Samsung', 'A03s',   NULL, 'good', 'in_use', co_tsi, 'Ad Premier',  1500000, '2022-10-24'),
    ('TSI-PHN-007', 'Samsung A03',   'phone', 'Hardware', 'Samsung', 'A03',    NULL, 'good', 'in_use', co_tsi, 'Ad Premier',  1500000, '2020-04-02'),
    ('TSI-PHN-008', 'Redmi A3',      'phone', 'Hardware', 'Redmi',   'A3',     NULL, 'good', 'in_use', co_tsi, 'Ad Premier',  1465650, '2024-10-10'),

    -- ---------------------------------------------------------- Laptops
    ('TSI-LTP-101', 'Lenovo Ideapad Pro 5',     'laptop', 'Hardware', 'Lenovo', 'Ideapad Pro 5',       'YX07Q7XM',        'excellent', 'in_use', co_tsi, 'Ad Premier',  14800000, '2026-04-06'),
    ('TSI-LTP-102', 'HP Probook 440 G8',        'laptop', 'Hardware', 'HP',     'Probook 440 G8',      '5CD229BKZS',      'good',      'in_use', co_tsi, 'Ad Premier',   8800000, '2025-05-07'),
    ('TSI-LTP-103', 'Lenovo Thinkpad X390',     'laptop', 'Hardware', 'Lenovo', 'Thinkpad X390',       'PC1EZCQK',        'good',      'in_use', co_tsi, 'Ad Premier',   5899000, '2024-05-14'),
    ('TSI-LTP-104', 'Dell Latitude 3420',       'laptop', 'Hardware', 'Dell',   'Latitude 3420',       '2NKVFX3',         'excellent', 'in_use', co_dms, 'Pondok Cabe',  7994300, '2026-03-25'),
    ('TSI-LTP-105', 'Lenovo V14 G4',            'laptop', 'Hardware', 'Lenovo', 'V14 G4',              'PF5Z4JKH',        'excellent', 'active', co_tsi, 'Ad Premier',   7951700, '2026-01-29'),
    ('TSI-LTP-106', 'ASUS EXPERTBOOK L1400CDA', 'laptop', 'Hardware', 'Asus',   'Expertbook L1400CDA', 'N5NXCV15T737220', 'good',      'in_use', co_tsi, 'Mobile',       5000000, '2021-01-13'),
    ('TSI-LTP-107', 'Asus Vivobook X407UF',     'laptop', 'Hardware', 'Asus',   'Vivobook X407UF',     'J9N0GR014576368', 'good',      'in_use', co_tsi, 'Ad Premier',      NULL, NULL),
    ('TSI-LTP-108', 'Lenovo Ideapad Slim 3',    'laptop', 'Hardware', 'Lenovo', 'Ideapad Slim 3',      'PF435KM',         'good',      'in_use', co_tsi, 'Ad Premier',   9499000, '2022-08-21'),
    ('TSI-LTP-109', 'Lenovo Ideapad Slim 3',    'laptop', 'Hardware', 'Lenovo', 'Ideapad Slim 3',      NULL,              'good',      'in_use', co_tsi, 'Ad Premier',   9691300, '2022-01-12'),
    ('TSI-LTP-110', 'Lenovo Thinkpadd T470s',   'laptop', 'Hardware', 'Lenovo', 'Thinkpadd T470s',     'PC0RWKAN',        'fair',      'in_use', co_tsi, 'Ad Premier',   3949000, '2024-01-11'),
    ('TSI-LTP-111', 'Lenovo Ideapad Gaming 3',  'laptop', 'Hardware', 'Lenovo', 'Ideapad Gaming 3',    'MP2KE7G5',        'good',      'in_use', co_dms, 'Mobile',      10999000, '2023-10-18'),
    ('TSI-LTP-112', 'Asus M1403QA',             'laptop', 'Hardware', 'Asus',   'M1403QA',             'NBN0CV05D448457', 'good',      'in_use', co_dms, 'Pondok Cabe',  9999000, '2023-05-25'),
    ('TSI-LTP-113', 'Asus Go 14',               'laptop', 'Hardware', 'Asus',   'Go 14',               'S4N0CV096913165', 'good',      'in_use', co_tsi, 'Mobile',       9956400, '2025-01-17'),
    ('TSI-LTP-114', 'Lenovo V14-G2-ITL',        'laptop', 'Hardware', 'Lenovo', 'V14-G2-ITL',          'PF3DVJJR',        'good',      'in_use', co_tsi, 'Ad Premier',   8349400, '2022-09-15'),
    ('TSI-LTP-115', 'Asus Expertbook L1400CDA', 'laptop', 'Hardware', 'Asus',   'Expertbook L1400CDA', NULL,              'good',      'in_use', co_cis, 'Surabaya',     5899000, '2022-08-07')
  ON CONFLICT (asset_tag) DO NOTHING;

  RAISE NOTICE 'Aset terpasang. Total baris di tabel assets: %', (SELECT count(*) FROM assets);
END $$;


/*
# Penugasan (opsional)

The spreadsheet names a holder for 21 of the 23 assets, but it has no handover
date — and asset_assignments.assigned_date is what the depreciation-era reports
and the BAST document read.

This block therefore stamps the handover as TODAY for every match, which is
almost certainly wrong for assets bought in 2022. Correct each one afterwards
from the asset's Edit form ("Tanggal Serah Terima"), or skip this block and
assign them by hand.

Employees are matched on exact full_name. Anyone not found in `employees` is
reported and skipped rather than guessed at.
*/

DO $$
DECLARE
  pair       record;
  v_asset_id uuid;
  v_emp_id   uuid;
  matched    int := 0;
  missing    text[] := '{}';
BEGIN
  FOR pair IN
    SELECT * FROM (VALUES
      ('TSI-PHN-001', 'Mercyana Barbara'),
      ('TSI-PHN-003', 'Panji Gumelar'),
      ('TSI-PHN-004', 'Diara Putri'),
      ('TSI-PHN-005', 'Nurlaela Ramli'),
      ('TSI-PHN-006', 'Rika N.'),
      ('TSI-PHN-007', 'Dhea Sasqia'),
      ('TSI-PHN-008', 'Ajit Mahendra'),
      ('TSI-LTP-101', 'Jeffry. Y'),
      ('TSI-LTP-102', 'Eky Fikriansyah'),
      ('TSI-LTP-103', 'Aditiya'),
      ('TSI-LTP-104', 'Desy Yuningsih'),
      ('TSI-LTP-106', 'Prabu Setiawan'),
      ('TSI-LTP-107', 'Masria yuliana'),
      ('TSI-LTP-108', 'Abella Resa'),
      ('TSI-LTP-109', 'Adi Supriyatna'),
      ('TSI-LTP-110', 'Salsa Aulia'),
      ('TSI-LTP-111', 'Adian Rizki'),
      ('TSI-LTP-112', 'Afifudin'),
      ('TSI-LTP-113', 'Ahmad Fadilah'),
      ('TSI-LTP-114', 'Nabilah Ulfah'),
      ('TSI-LTP-115', 'Ani Susanti')
    ) AS t(asset_tag, employee_name)
  LOOP
    SELECT id INTO v_asset_id FROM assets    WHERE asset_tag = pair.asset_tag;
    SELECT id INTO v_emp_id   FROM employees WHERE full_name = pair.employee_name;

    IF v_asset_id IS NULL OR v_emp_id IS NULL THEN
      missing := missing || pair.employee_name;
      CONTINUE;
    END IF;

    -- The partial unique index allows only one open assignment per asset.
    IF EXISTS (SELECT 1 FROM asset_assignments WHERE asset_id = v_asset_id AND status = 'assigned') THEN
      CONTINUE;
    END IF;

    INSERT INTO asset_assignments (asset_id, employee_id, status)
    VALUES (v_asset_id, v_emp_id, 'assigned');

    matched := matched + 1;
  END LOOP;

  RAISE NOTICE 'Penugasan dibuat: %. Tidak ditemukan di tabel employees: %',
    matched, COALESCE(array_to_string(missing, ', '), '-');
END $$;
