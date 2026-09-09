/*
# Existing asset register — part 5 (final)

22 assets (12 laptops, 10 phones), continuing the series:
TSI-PHN-016..025 and TSI-LTP-187..198.

No vocabulary migration needed — every status, condition and company in this
batch already exists.

Status rule as settled in part 3:
    "Active" + holder    -> in_use
    "Active" + no holder -> active
    "In Storage"         -> active
    "Retired"            -> retired

ONE ROW DELIBERATELY LEFT OUT
-----------------------------
The sheet's "Asus V16 Gaming" (serial T7N0CV19W787316, Rp 20.011.000,
18/08/2026) is the asset already in the database as TSI-LTP-001. Re-inserting it
under a new tag would hit the UNIQUE index on serial_number and abort the whole
batch, so it is skipped. That is why 23 spreadsheet rows produce 22 inserts.

Its holder differs between the two records — the sheet says "Yayuk Sri Rejeki",
the existing assignment says "Yayuk TSI". Worth reconciling.
*/

DO $$
DECLARE
  co_tsi uuid;
  co_dms uuid;
BEGIN
  SELECT id INTO co_tsi FROM companies WHERE company_name = 'PT. TSI Sertifikasi Internasional';
  SELECT id INTO co_dms FROM companies WHERE company_name = 'PT. Dharma Mitra Solusi';

  IF co_tsi IS NULL OR co_dms IS NULL THEN
    RAISE EXCEPTION 'Perusahaan belum lengkap. Jalankan 20260907140000_set_companies.sql lebih dulu.';
  END IF;

  INSERT INTO assets (
    asset_tag, asset_name, category, asset_type,
    brand, model, serial_number,
    condition, status, company_id, location,
    purchase_cost, purchase_date
  )
  VALUES
    -- ---------------------------------------------------------- Phones
    ('TSI-PHN-016', 'Infinix Hot Smart 10', 'phone', 'Hardware', 'Infinix', 'Hot Smart 10', NULL, 'excellent', 'in_use', co_tsi, 'Ad Premier', 1542300, '2026-03-17'),
    ('TSI-PHN-017', 'Infinix Hot Smart 10', 'phone', 'Hardware', 'Infinix', 'Hot Smart 10', NULL, 'excellent', 'in_use', co_tsi, 'Ad Premier', 1542300, '2026-03-17'),
    ('TSI-PHN-018', 'Infinix Hot Smart 10', 'phone', 'Hardware', 'Infinix', 'Hot Smart 10', NULL, 'excellent', 'in_use', co_tsi, 'Ad Premier', 1542300, '2026-03-17'),
    ('TSI-PHN-019', 'Infinix Hot Smart 10', 'phone', 'Hardware', 'Infinix', 'Hot Smart 10', NULL, 'excellent', 'in_use', co_tsi, 'Ad Premier', 1542300, '2026-03-17'),
    ('TSI-PHN-020', 'Infinix Hot Smart 10', 'phone', 'Hardware', 'Infinix', 'Hot Smart 10', NULL, 'excellent', 'in_use', co_tsi, 'Ad Premier', 1542300, '2026-03-17'),
    ('TSI-PHN-021', 'Poco M7',              'phone', 'Hardware', 'Poco',    'M7',           NULL, 'excellent', 'in_use', co_tsi, 'Ad Premier', 3813900, '2026-08-27'),
    ('TSI-PHN-022', 'iPhone 11',            'phone', 'Hardware', 'Apple',   'iPhone 11',    NULL, 'good',      'in_use', co_tsi, 'Ad Premier',    NULL, NULL),
    ('TSI-PHN-023', 'Xiaomi 13',            'phone', 'Hardware', 'Xiaomi',  '13',           NULL, 'good',      'in_use', co_tsi, 'Ad Premier', 2000000, '2024-10-15'),
    ('TSI-PHN-024', 'Xiaomi 13',            'phone', 'Hardware', 'Xiaomi',  '13',           NULL, 'good',      'in_use', co_tsi, 'Ad Premier', 2000000, '2024-10-15'),
    ('TSI-PHN-025', 'Realme 6 Pro',         'phone', 'Hardware', 'Realme',  '6 Pro',        NULL, 'good',      'in_use', co_tsi, 'Ad Premier', 2000000, '2021-04-10'),

    -- ---------------------------------------------------------- Laptops
    ('TSI-LTP-187', 'Asus Vivobook X407UB',      'laptop', 'Hardware', 'Asus',   'Vivobook X407UB',   'J4N0GR04N210178', 'good',      'retired', co_tsi, 'Pondok Cabe',     NULL, NULL),
    ('TSI-LTP-188', 'Lenovo Ideapad Flex 5',     'laptop', 'Hardware', 'Lenovo', 'Ideapad Flex 5',    NULL,              'poor',      'retired', co_tsi, 'Pondok Cabe', 10000000, NULL),
    ('TSI-LTP-189', 'Asus x441n',                'laptop', 'Hardware', 'Asus',   'x441n',             'HBN0CV15L54247G', 'fair',      'retired', co_tsi, 'Pondok Cabe',  5000000, '2017-10-25'),
    ('TSI-LTP-190', 'Asus Vivobook A442U',       'laptop', 'Hardware', 'Asus',   'Vivobook A442U',    'J3N0CV10E76213A', 'fair',      'retired', co_tsi, 'Pondok Cabe',     NULL, NULL),
    ('TSI-LTP-191', 'Lenovo Thinkpad T14 Gen 4', 'laptop', 'Hardware', 'Lenovo', 'Thinkpad T14 Gen 4', NULL,             'excellent', 'in_use',  co_tsi, 'Ad Premier',  15020100, '2026-06-18'),
    ('TSI-LTP-192', 'Dell Latitude 7440',        'laptop', 'Hardware', 'Dell',   'Latitude 7440',     'J9DWQV3',         'good',      'in_use',  co_dms, 'Pondok Cabe',  8000000, '2026-07-09'),
    ('TSI-LTP-193', 'Lenovo Thinkpad L480',      'laptop', 'Hardware', 'Lenovo', 'Thinkpad L480',     'PF1EH7SX',        'good',      'active',  co_tsi, 'Ad Premier',   3220250, '2026-05-07'),
    ('TSI-LTP-194', 'Lenovo Thinkpad L480',      'laptop', 'Hardware', 'Lenovo', 'Thinkpad L480',     'PF1QL0CH',        'good',      'in_use',  co_tsi, 'Ad Premier',   3220250, '2026-05-07'),
    ('TSI-LTP-195', 'Lenovo Thinkpad E14 Gen 6', 'laptop', 'Hardware', 'Lenovo', 'Thinkpad E14 Gen 6', 'PF5G35R5',       'excellent', 'in_use',  co_tsi, 'Mobile',      14924100, '2026-04-28'),
    ('TSI-LTP-196', 'Dell 3410',                 'laptop', 'Hardware', 'Dell',   '3410',              '91MK963',         'good',      'in_use',  co_dms, 'Pondok Cabe',     NULL, '2020-10-22'),
    ('TSI-LTP-197', 'Lenovo Thinkpad X1 Carbon', 'laptop', 'Hardware', 'Lenovo', 'Thinkpad X1 Carbon', 'PF1G633B',       'good',      'in_use',  co_tsi, 'Ad Premier',      NULL, NULL),
    ('TSI-LTP-198', 'Lenovo ideapad slim 1',     'laptop', 'Hardware', 'Lenovo', 'ideapad slim 1',    'MP2C82BQ',        'good',      'in_use',  co_tsi, 'Ad Premier',      NULL, '2023-03-31')
  ON CONFLICT (asset_tag) DO NOTHING;

  RAISE NOTICE 'Bagian 5 terpasang. Total baris di tabel assets: %', (SELECT count(*) FROM assets);
END $$;


/*
# Penugasan bagian 5 (opsional)

Same caveat as the earlier parts: no handover date in the source, so each match
is stamped with TODAY and should be corrected afterwards.

The four Retired assets and TSI-LTP-193 (In Storage) have no holder and are
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
      ('TSI-PHN-016', 'Masria yuliana'),
      ('TSI-PHN-017', 'Dian Mutiara Sari'),
      ('TSI-PHN-018', 'Eva Marliya Sari'),
      ('TSI-PHN-019', 'Angga Rachmatilah'),
      ('TSI-PHN-020', 'Diki Rustiawan'),
      ('TSI-PHN-021', 'Josef Septiardi'),
      ('TSI-PHN-022', 'Nabilah Ulfah'),
      ('TSI-PHN-023', 'Amelia Sakinah'),
      ('TSI-PHN-024', 'Annisa Rizki Ramadhani'),
      ('TSI-PHN-025', 'Titi Nurhayati'),
      ('TSI-LTP-191', 'Diara Putri'),
      ('TSI-LTP-192', 'Irvan'),
      ('TSI-LTP-194', 'Neneng Lisah'),
      ('TSI-LTP-195', 'Kartika Suryaningrum'),
      ('TSI-LTP-196', 'riris'),
      ('TSI-LTP-197', 'Umi Fadillah'),
      ('TSI-LTP-198', 'Putri Fajrin')
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

  RAISE NOTICE 'Penugasan bagian 5 dibuat: %. Tidak ditemukan di tabel employees: %',
    matched, COALESCE(array_to_string(missing, ', '), '-');
END $$;
