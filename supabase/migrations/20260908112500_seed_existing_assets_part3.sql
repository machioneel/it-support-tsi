/*
# Existing asset register — part 3

27 more assets (23 laptops, 4 phones), continuing the series:
TSI-PHN-010..013 and TSI-LTP-139..161.

Depends on 20260908112000_extend_asset_vocabulary_2.sql for condition 'poor'
and company JIT.

STATUS MAPPING — refined
------------------------
Parts 1 and 2 assumed "Active" always meant an asset was in someone's hands.
This batch shows three "Active" rows with no holder at all, so the rule now
keys off the holder column as well:

    "Active"       + holder    -> in_use       (someone is using it)
    "Active"       + no holder -> active       (in service, but nobody holds it)
    "In Storage"               -> active
    "Under Repair"             -> maintenance

That keeps the register self-consistent: nothing is ever 'in_use' with no
assignment behind it, which is what the Assigned/Unassigned filter and the
dashboard counters rely on. TSI-LTP-138 in part 2 was corrected to match.

The three holderless "Active" rows here are TSI-LTP-150, TSI-LTP-157 and
TSI-LTP-154 (the last one is Under Repair, so it becomes maintenance).

OTHER NOTES
-----------
- "PC Custom" (TSI-LTP-151) is filed under category "laptop" in the source. Kept
  as written rather than silently reclassified to desktop.
- Asset names are preserved verbatim, including "Asus Go 14/15".
*/

DO $$
DECLARE
  co_tsi uuid;
  co_dms uuid;
  co_jit uuid;
BEGIN
  SELECT id INTO co_tsi FROM companies WHERE company_name = 'PT. TSI Sertifikasi Internasional';
  SELECT id INTO co_dms FROM companies WHERE company_name = 'PT. Dharma Mitra Solusi';
  SELECT id INTO co_jit FROM companies WHERE company_name = 'PT. Jasa Instrumentasi Teknologi';

  IF co_tsi IS NULL OR co_dms IS NULL OR co_jit IS NULL THEN
    RAISE EXCEPTION 'Perusahaan belum lengkap. Jalankan 20260907140000_set_companies.sql dan 20260908112000_extend_asset_vocabulary_2.sql lebih dulu.';
  END IF;

  INSERT INTO assets (
    asset_tag, asset_name, category, asset_type,
    brand, model, serial_number,
    condition, status, company_id, location,
    purchase_cost, purchase_date
  )
  VALUES
    -- ---------------------------------------------------------- Phones
    ('TSI-PHN-010', 'Redmi 13', 'phone', 'Hardware', 'Redmi', '13', NULL, 'good', 'in_use', co_tsi, 'Ad Premier',  2000000, '2024-10-15'),
    ('TSI-PHN-011', 'Redmi A3', 'phone', 'Hardware', 'Redmi', 'A3', NULL, 'good', 'in_use', co_tsi, 'Ad Premier',  1465650, '2024-10-10'),
    ('TSI-PHN-012', 'Redmi A3', 'phone', 'Hardware', 'Redmi', 'A3', NULL, 'good', 'active', co_tsi, 'Pondok Cabe', 1465650, '2024-10-10'),
    ('TSI-PHN-013', 'Redmi A3', 'phone', 'Hardware', 'Redmi', 'A3', NULL, 'good', 'in_use', co_tsi, 'Ad Premier',  1465650, '2024-10-10'),

    -- ---------------------------------------------------------- Laptops
    ('TSI-LTP-139', 'Lenovo ThinkPad L13',    'laptop', 'Hardware', 'Lenovo', 'ThinkPad L13',    'R910F4FE',        'good', 'in_use',      co_dms, 'Ad Premier',  7880000, '2024-10-08'),
    ('TSI-LTP-140', 'Lenovo Thinkpad T470s',  'laptop', 'Hardware', 'Lenovo', 'Thinkpad T470s',  'PC0SBA8B',        'good', 'in_use',      co_tsi, 'Ad Premier',  3949000, NULL),
    ('TSI-LTP-141', 'Asus M1403Q',            'laptop', 'Hardware', 'Asus',   'M1403Q',          'NBN0CV5C93345B',  'good', 'in_use',      co_tsi, 'Ad Premier',  9799000, '2022-12-30'),
    ('TSI-LTP-142', 'Asus M1403Q',            'laptop', 'Hardware', 'Asus',   'M1403Q',          'N8N0CV05V547326', 'good', 'in_use',      co_tsi, 'Ad Premier',  9799000, '2022-12-30'),
    ('TSI-LTP-143', 'Asus A416JAO',           'laptop', 'Hardware', 'Asus',   'A416JAO',         NULL,              'good', 'in_use',      co_tsi, 'Ad Premier', 10254750, '2021-03-10'),
    ('TSI-LTP-144', 'Lenovo T490s',           'laptop', 'Hardware', 'Lenovo', 'T490s',           NULL,              'good', 'in_use',      co_tsi, 'Mobile',         NULL, NULL),
    ('TSI-LTP-145', 'ASUS Vivobook Go 14',    'laptop', 'Hardware', 'Asus',   'Vivobook Go 14',  'R8N0CV22J522356', 'good', 'in_use',      co_tsi, 'Ad Premier',  4900000, '2024-11-05'),
    ('TSI-LTP-146', 'Asus X415EA',            'laptop', 'Hardware', 'Asus',   'X415EA',          'M8N0CV14X11833A', 'good', 'in_use',      co_tsi, 'Ad Premier',  8500000, '2018-01-04'),
    ('TSI-LTP-147', 'Asus M1403Q',            'laptop', 'Hardware', 'Asus',   'M1403Q',          'NCN0CV079552500', 'good', 'in_use',      co_tsi, 'Ad Premier',  9799000, NULL),
    ('TSI-LTP-148', 'Asus UX363EA',           'laptop', 'Hardware', 'Asus',   'UX363EA',         NULL,              'good', 'in_use',      co_tsi, 'Ad Premier', 15468000, '2022-06-28'),
    ('TSI-LTP-149', 'Lenovo V14-ADA',         'laptop', 'Hardware', 'Lenovo', 'V14-ADA',         'PF20JY55',        'good', 'active',      co_tsi, 'Ad Premier',  8000000, '2018-01-13'),
    ('TSI-LTP-150', 'Asus A407U',             'laptop', 'Hardware', 'Asus',   'A407U',           'PF2EYK4K',        'good', 'active',      co_tsi, 'Ad Premier',  6000000, '2018-01-03'),
    ('TSI-LTP-151', 'PC Custom',              'laptop', 'Hardware', NULL,     'PC Custom',       NULL,              'good', 'in_use',      co_tsi, 'Ad Premier',  6000000, '2022-11-01'),
    ('TSI-LTP-152', 'Asus X412FAC',           'laptop', 'Hardware', 'Asus',   'X412FAC',         'L8N0CV08J943336', 'good', 'in_use',      co_dms, 'Ad Premier',  9799000, NULL),
    ('TSI-LTP-153', 'Asus Go 14/15',          'laptop', 'Hardware', 'Asus',   'Go 14/15',        'S7N0CV047115279', 'good', 'in_use',      co_tsi, 'Ad Premier',  9945400, '2025-01-22'),
    ('TSI-LTP-154', 'Asus UX363EA',           'laptop', 'Hardware', 'Asus',   'UX363EA',         'M8N0CX00H36831C', 'good', 'maintenance', co_tsi, 'Ad Premier',     NULL, NULL),
    ('TSI-LTP-155', 'Asus A416JAO',           'laptop', 'Hardware', 'Asus',   'A416JAO',         NULL,              'good', 'in_use',      co_tsi, 'Ad Premier',  8927800, '2021-09-09'),
    ('TSI-LTP-156', 'Asus Go 14',             'laptop', 'Hardware', 'Asus',   'Go 14',           'R8N0CV22J890351', 'good', 'in_use',      co_tsi, 'Ad Premier',  7899000, '2024-01-08'),
    ('TSI-LTP-157', 'Lenovo Ideapad Slim 3',  'laptop', 'Hardware', 'Lenovo', 'Ideapad Slim 3',  NULL,              'good', 'active',      co_tsi, 'Ad Premier',  8187400, '2024-05-17'),
    ('TSI-LTP-158', 'Lenovo Ideapad Flex 5',  'laptop', 'Hardware', 'Lenovo', 'Ideapad Flex 5',  NULL,              'poor', 'in_use',      co_dms, 'Ad Premier',  8000000, NULL),
    ('TSI-LTP-159', 'Asus UX461',             'laptop', 'Hardware', 'Asus',   'UX461',           'J1N0CX17F02204E', 'good', 'in_use',      co_jit, 'Ad Premier', 18000000, NULL),
    ('TSI-LTP-160', 'Lenovo Thinkpad T470s',  'laptop', 'Hardware', 'Lenovo', 'Thinkpad T470s',  'PC-0WJ1J3',       'good', 'in_use',      co_dms, 'Ad Premier',  3949000, '2024-01-11'),
    ('TSI-LTP-161', 'Lenovo Yoga 7 2 in 1',   'laptop', 'Hardware', 'Lenovo', 'Yoga 7 2 in 1',   NULL,              'good', 'in_use',      co_tsi, 'Ad Premier', 24976000, '2024-12-23')
  ON CONFLICT (asset_tag) DO NOTHING;

  RAISE NOTICE 'Bagian 3 terpasang. Total baris di tabel assets: %', (SELECT count(*) FROM assets);
END $$;


/*
# Penugasan bagian 3 (opsional)

Same caveat as the earlier parts: the spreadsheet carries no handover date, so
each match is stamped with TODAY and should be corrected afterwards from the
asset's Edit form.

Assets with no holder in the sheet (TSI-PHN-012, TSI-LTP-149, 150, 154, 157) are
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
      ('TSI-PHN-010', 'Amelia Sakinah'),
      ('TSI-PHN-011', 'Karl'),
      ('TSI-PHN-013', 'Putri Fajrin'),
      ('TSI-LTP-139', 'Ergy Refian'),
      ('TSI-LTP-140', 'Erina Chandra Putri'),
      ('TSI-LTP-141', 'Fachmi Arya Pangestu'),
      ('TSI-LTP-142', 'Fajriatin'),
      ('TSI-LTP-143', 'Jasmine Diva Shafira'),
      ('TSI-LTP-144', 'Moes'),
      ('TSI-LTP-145', 'Febri'),
      ('TSI-LTP-146', 'Febri Iga Mahesti'),
      ('TSI-LTP-147', 'Indra Wahyudi'),
      ('TSI-LTP-148', 'Josef Septiardi'),
      ('TSI-LTP-151', 'Titi Nurhayati'),
      ('TSI-LTP-152', 'Lutfi'),
      ('TSI-LTP-153', 'M. Gilang Bangkit Abdillah'),
      ('TSI-LTP-155', 'Ergy Refian'),
      ('TSI-LTP-156', 'Mercyana Barbara'),
      ('TSI-LTP-158', 'Fauzan Fieryandi'),
      ('TSI-LTP-159', 'Nilman'),
      ('TSI-LTP-160', 'Novi Indriyanti'),
      ('TSI-LTP-161', 'Nungky Awang Chandra')
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

  RAISE NOTICE 'Penugasan bagian 3 dibuat: %. Tidak ditemukan di tabel employees: %',
    matched, COALESCE(array_to_string(missing, ', '), '-');
END $$;
