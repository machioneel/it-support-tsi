/*
# Existing asset register — part 4

27 more assets (25 laptops, 2 phones), continuing the series:
TSI-PHN-014..015 and TSI-LTP-162..186.

No vocabulary migration is needed this time — "Retired" already maps onto the
existing 'retired' status.

Status rule is the one settled on in part 3:
    "Active" + holder    -> in_use
    "Active" + no holder -> active
    "In Storage"         -> active
    "Retired"            -> retired

FOUR THINGS THAT NEEDED A DECISION
----------------------------------
1. DUPLICATE SERIAL. "Lenovo Thinkpad T14" (TSI-LTP-166) carries serial
   PF2EYK4K in the sheet — the same serial already recorded for "Asus A407U"
   (TSI-LTP-150, part 3). Two machines cannot share one serial, and the column
   is UNIQUE, so inserting both as written would abort the whole batch.
   The asset is loaded with serial_number = NULL and the earlier row is left
   untouched. Fill in the correct serial once it is known — the sheet does not
   say which of the two is wrong.

2. NO COMPANY. "PC Custom punya Noval" (TSI-LTP-171) has an empty Company cell.
   company_id is nullable, so it is stored as NULL rather than being guessed at.

3. INCOMPLETE ROW. "Thinkpad X390" (TSI-LTP-186) has only a category, a cost and
   a purchase date — no status, asset type, condition, company or location.
   asset_type is NOT NULL, so it is set to 'Hardware', which every other laptop
   in the register uses. Status and condition fall back to active / good. Please
   confirm those three inferred values.

4. BRAND. Where the brand is not written in the asset name but the product line
   makes it unambiguous, it is filled in: Thinkpad -> Lenovo, Vivobook -> Asus,
   Mac Mini -> Apple. "PC Custom" and "PC Custom punya Noval" get no brand at all.
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
    ('TSI-PHN-014', 'Samsung A20s', 'phone', 'Hardware', 'Samsung', 'A20s', NULL, 'good',      'in_use', co_tsi, 'Ad Premier',    NULL, NULL),
    ('TSI-PHN-015', 'Poco C75',     'phone', 'Hardware', 'Poco',    'C75',  NULL, 'excellent', 'in_use', co_tsi, 'Ad Premier', 1949000, '2024-12-05'),

    -- ---------------------------------------------------------- Laptops
    ('TSI-LTP-162', 'Asus X415',                 'laptop', 'Hardware', 'Asus',    'X415',                 'M7N0CV17B548295', 'good',      'in_use',  co_tsi, 'Ad Premier',   9973150, '2022-03-17'),
    ('TSI-LTP-163', 'Apple Mac Mini',            'laptop', 'Hardware', 'Apple',   'Mac Mini',             'RG4J2MFCJ9',      'good',      'in_use',  co_dms, 'Ad Premier',  13476500, '2023-10-31'),
    ('TSI-LTP-164', 'PC Custom',                 'laptop', 'Hardware', NULL,      'PC Custom',            NULL,              'good',      'in_use',  co_tsi, 'Ad Premier',   6000000, '2021-02-22'),
    ('TSI-LTP-165', 'Asus Vivobook 14x M1403QA', 'laptop', 'Hardware', 'Asus',    'Vivobook 14x M1403QA', 'R1N0CV084293030', 'good',      'in_use',  co_tsi, 'Ad Premier',   9951400, '2023-02-13'),
    -- serial PF2EYK4K omitted: already used by TSI-LTP-150, see note 1 above
    ('TSI-LTP-166', 'Lenovo Thinkpad T14',       'laptop', 'Hardware', 'Lenovo',  'Thinkpad T14',         NULL,              'good',      'active',  co_tsi, 'Ad Premier',   5665000, '2024-05-29'),
    ('TSI-LTP-167', 'Asus Go 14/15',             'laptop', 'Hardware', 'Asus',    'Go 14/15',             'RBN0CV02W517452', 'good',      'in_use',  co_tsi, 'Ad Premier',   9917200, '2024-08-02'),
    ('TSI-LTP-168', 'Dell Latitude 3440',        'laptop', 'Hardware', 'Dell',    'Latitude 3440',        'JRGGMX3',         'good',      'in_use',  co_tsi, 'Ad Premier',   8274200, '2024-05-29'),
    ('TSI-LTP-169', 'Lenovo V14 ADA',            'laptop', 'Hardware', 'Lenovo',  'V14 ADA',              'PF20J27F',        'good',      'retired', co_tsi, 'Pondok Cabe',  8000000, NULL),
    ('TSI-LTP-170', 'Asus Vivobook K3400PA',     'laptop', 'Hardware', 'Asus',    'Vivobook K3400PA',     'MCN0CX07R450493', 'good',      'in_use',  co_tsi, 'Ad Premier',  10267300, '2022-09-15'),
    -- company cell empty in the source, see note 2 above
    ('TSI-LTP-171', 'PC Custom punya Noval',     'laptop', 'Hardware', NULL,      'PC Custom',            NULL,              'good',      'active',  NULL,   'Ad Premier',  15000000, '2021-10-04'),
    ('TSI-LTP-172', 'Mini PC BMAX',              'laptop', 'Hardware', 'BMAX',    'Mini PC',              NULL,              'good',      'in_use',  co_tsi, 'Ad Premier',   5528100, '2024-10-15'),
    ('TSI-LTP-173', 'Asus Go 14',                'laptop', 'Hardware', 'Asus',    'Go 14',                'S4N0CV10K825164', 'good',      'in_use',  co_tsi, 'Ad Premier',   9977500, '2024-12-10'),
    ('TSI-LTP-174', 'Asus M1403Q',               'laptop', 'Hardware', 'Asus',    'M1403Q',               'N8N0CV06R60732A', 'good',      'in_use',  co_tsi, 'Ad Premier',   9799000, '2022-12-30'),
    ('TSI-LTP-175', 'Vivobook A416JA',           'laptop', 'Hardware', 'Asus',    'Vivobook A416JA',      'M9N0CX10N376378', 'good',      'in_use',  co_cis, 'Mobile',       9499000, NULL),
    ('TSI-LTP-176', 'Asus Expertbook P1',        'laptop', 'Hardware', 'Asus',    'Expertbook P1',        'T6NXCV18X617262', 'excellent', 'in_use',  co_tsi, 'Ad Premier',  12135067, '2025-01-28'),
    ('TSI-LTP-177', 'Asus Expertbook L1400CDAY', 'laptop', 'Hardware', 'Asus',    'Expertbook L1400CDAY', 'N6NXCV01418022G', 'good',      'in_use',  co_tsi, 'Ad Premier',   5899000, '2022-08-07'),
    ('TSI-LTP-178', 'Lenovo Thinkpad X13 Yoga',  'laptop', 'Hardware', 'Lenovo',  'Thinkpad X13 Yoga',    'R910FN83',        'good',      'in_use',  co_tsi, 'Ad Premier',   7000000, '2024-12-19'),
    ('TSI-LTP-179', 'Asus TP410U',               'laptop', 'Hardware', 'Asus',    'TP410U',               NULL,              'poor',      'active',  co_tsi, 'Ad Premier',   8500000, '2018-01-04'),
    ('TSI-LTP-180', 'HP Probook 440 G8',         'laptop', 'Hardware', 'HP',      'Probook 440 G8',       '5CD2195TB3',      'excellent', 'in_use',  co_dms, 'Ad Premier',   7799000, '2026-03-26'),
    ('TSI-LTP-181', 'HP ProBook 440 G8',         'laptop', 'Hardware', 'HP',      'ProBook 440 G8',       '5CD229BL61',      'good',      'in_use',  co_tsi, 'Pondok Cabe',  8800000, '2025-05-07'),
    ('TSI-LTP-182', 'HP ProBook 440 G8',         'laptop', 'Hardware', 'HP',      'ProBook 440 G8',       NULL,              'good',      'in_use',  co_tsi, 'Ad Premier',   8800000, '2025-05-07'),
    ('TSI-LTP-183', 'Lenovo Thinkpad t480',      'laptop', 'Hardware', 'Lenovo',  'Thinkpad t480',        'PF1NPKS3',        'good',      'in_use',  co_tsi, 'Pondok Cabe',  5500000, '2019-02-20'),
    ('TSI-LTP-184', 'Lenovo Thinkpad t480s',     'laptop', 'Hardware', 'Lenovo',  'Thinkpad t480s',       'PC-15NRXM',       'good',      'in_use',  co_tsi, 'Ad Premier',   5000000, '2025-06-04'),
    ('TSI-LTP-185', 'Dell 5420',                 'laptop', 'Hardware', 'Dell',    '5420',                 '3JNJDB3',         'good',      'in_use',  co_dms, 'Ad Premier',   8800000, '2025-06-04'),
    -- status / asset_type / condition / company / location all blank in the source, see note 3
    ('TSI-LTP-186', 'Thinkpad X390',             'laptop', 'Hardware', 'Lenovo',  'Thinkpad X390',        NULL,              'good',      'active',  NULL,   NULL,           5899000, '2024-05-14')
  ON CONFLICT (asset_tag) DO NOTHING;

  RAISE NOTICE 'Bagian 4 terpasang. Total baris di tabel assets: %', (SELECT count(*) FROM assets);
END $$;


/*
# Penugasan bagian 4 (opsional)

Same caveat as the earlier parts: the spreadsheet has no handover date, so each
match is stamped with TODAY and should be corrected afterwards.

Assets with no holder in the sheet — TSI-LTP-166, 169, 171, 179 and 186 — are
absent from this list.
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
      ('TSI-PHN-014', 'Balqis Ima Khariyah'),
      ('TSI-PHN-015', 'Fauziah Rahmah'),
      ('TSI-LTP-162', 'Nyoman Tutwuri Haryanto'),
      ('TSI-LTP-163', 'Panji Gumelar'),
      ('TSI-LTP-164', 'Putri Fajrin'),
      ('TSI-LTP-165', 'Rabial Pratama'),
      ('TSI-LTP-167', 'Rudi'),
      ('TSI-LTP-168', 'Shara Septi'),
      ('TSI-LTP-170', 'Muhammad Kifli'),
      ('TSI-LTP-172', 'Titi Nurhayati'),
      ('TSI-LTP-173', 'Yayuk Sri Rejeki'),
      ('TSI-LTP-174', 'Yunia Afriani Rachman'),
      ('TSI-LTP-175', 'Erick Novi'),
      ('TSI-LTP-176', 'Balqis Ima Khariyah'),
      ('TSI-LTP-177', 'Fauziah Rahmah'),
      ('TSI-LTP-178', 'Ikrima Al-Muhajir'),
      ('TSI-LTP-180', 'Suryadi'),
      ('TSI-LTP-181', 'Fauzan Fieryandi'),
      ('TSI-LTP-182', 'Derri Widardi'),
      ('TSI-LTP-183', 'Ilham Mulya Putra Setiawan'),
      ('TSI-LTP-184', 'Nurlaela Ramli'),
      ('TSI-LTP-185', 'Elieser Tampubolon')
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

  RAISE NOTICE 'Penugasan bagian 4 dibuat: %. Tidak ditemukan di tabel employees: %',
    matched, COALESCE(array_to_string(missing, ', '), '-');
END $$;
