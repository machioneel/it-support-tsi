/*
# Existing asset register — part 2

24 more assets from the inventory spreadsheet, continuing where
20260908110500_seed_existing_assets.sql left off. Tags carry on the same series:
TSI-PHN-009 and TSI-LTP-116..138.

Same conventions as part 1: "Active" -> in_use, "In Storage" -> active, brand and
model split off the asset name, blank serial numbers stored as NULL.

TWO THINGS TO CHECK
-------------------
1. "Lenovo Thinkpad Yoga X380" (TSI-LTP-138) is marked Active but has no holder.
   Part 3 of the register turned out to contain more rows like it, so the status
   rule was refined there: "Active" with no holder loads as 'active', not
   'in_use'. This row follows that rule, so nothing is ever 'in_use' without an
   assignment behind it.

2. Six employee names were cut off by the column width in the source. Part 5 of
   the register later showed three of them in full, and those are now complete:
       Angga Rachmatilah       (TSI-LTP-122)  — was already complete
       Annisa Rizki Ramadhani  (TSI-PHN-009, TSI-LTP-123)
       Kartika Suryaningrum    (TSI-LTP-134)

   Three are still truncated and are stored exactly as far as they were
   readable. They will NOT match anyone in `employees`, so the assignment block
   reports them as not found rather than guessing at the rest of the name:
       Nilkham Aditya Pra…   (TSI-LTP-117)
       Cahyo Dwi Pradan…     (TSI-LTP-126)
       Kokok Surya Nusan…    (TSI-LTP-136)

"Macbook Air M1" is the one row whose brand is not in its name; it is recorded
as Apple.
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
    -- ---------------------------------------------------------- Phone
    ('TSI-PHN-009', 'Redmi 13', 'phone', 'Hardware', 'Redmi', '13', NULL, 'good', 'in_use', co_tsi, 'Ad Premier', 2000000, '2024-10-15'),

    -- ---------------------------------------------------------- Laptops
    ('TSI-LTP-116', 'Asus X407UF',                 'laptop', 'Hardware', 'Asus',   'X407UF',              'JBN0GR04U572466', 'good', 'in_use', co_tsi, 'Ad Premier',   8000000, '2018-01-12'),
    ('TSI-LTP-117', 'Lenovo Thinkpad L14',         'laptop', 'Hardware', 'Lenovo', 'Thinkpad L14',        'PF3K94XR',        'good', 'in_use', co_tsi, 'Mobile',       9805900, '2024-04-30'),
    ('TSI-LTP-118', 'Lenovo Ideapad Slim 1',       'laptop', 'Hardware', 'Lenovo', 'Ideapad Slim 1',      'MP2DZV7V',        'good', 'in_use', co_tsi, 'Ad Premier',   5899000, '2023-10-18'),
    ('TSI-LTP-119', 'Lenovo T490s',                'laptop', 'Hardware', 'Lenovo', 'T490s',               NULL,              'good', 'in_use', co_cis, 'Surabaya',     4000000, NULL),
    ('TSI-LTP-120', 'Asus M1403QA',                'laptop', 'Hardware', 'Asus',   'M1403QA',             NULL,              'good', 'in_use', co_tsi, 'Ad Premier',   9999000, '2023-05-25'),
    ('TSI-LTP-121', 'ASUS VIVOBOOK 14X',           'laptop', 'Hardware', 'Asus',   'Vivobook 14X',        'N8N0CV06P15932F', 'good', 'in_use', co_tsi, 'Ad Premier',   9951400, '2023-03-03'),
    ('TSI-LTP-122', 'Asus Vivobook Flip 14',       'laptop', 'Hardware', 'Asus',   'Vivobook Flip 14',    'MCN0LPKKR0AB52B', 'good', 'in_use', co_tsi, 'Ad Premier',  11099999, '2022-07-07'),
    ('TSI-LTP-123', 'Asus Vivobook Flip TM420UA',  'laptop', 'Hardware', 'Asus',   'Vivobook Flip TM420UA', NULL,            'good', 'in_use', co_tsi, 'Ad Premier',  11099000, '2022-12-30'),
    ('TSI-LTP-124', 'Lenovo Ideapad Slim 3',       'laptop', 'Hardware', 'Lenovo', 'Ideapad Slim 3',      'PF4BZ9X0',        'good', 'in_use', co_dms, 'Ad Premier',  10046100, '2024-04-30'),
    ('TSI-LTP-125', 'Macbook Air M1',              'laptop', 'Hardware', 'Apple',  'Macbook Air M1',      'HXJM2M3L1WFV',    'good', 'in_use', co_dms, 'Ad Premier',  15952000, '2024-02-15'),
    ('TSI-LTP-126', 'Asus X415',                   'laptop', 'Hardware', 'Asus',   'X415',                'M1N0CX05Z845028', 'good', 'in_use', co_tsi, 'Ad Premier',  10108850, '2022-02-21'),
    ('TSI-LTP-127', 'Asus F415EA',                 'laptop', 'Hardware', 'Asus',   'F415EA',              'M9N0CV09Z518372', 'good', 'in_use', co_tsi, 'Ad Premier',   9994000, '2024-02-12'),
    ('TSI-LTP-128', 'Asus L1400CDA',               'laptop', 'Hardware', 'Asus',   'L1400CDA',            'N7NXCV00F28226B', 'good', 'in_use', co_tsi, 'Ad Premier',   5899000, '2022-08-07'),
    ('TSI-LTP-129', 'Lenovo Thinkpad T490s',       'laptop', 'Hardware', 'Lenovo', 'Thinkpad T490s',      'PC-1JJK6C',       'good', 'in_use', co_tsi, 'Pondok Cabe',  5790000, '2024-05-17'),
    ('TSI-LTP-130', 'Asus UX461U',                 'laptop', 'Hardware', 'Asus',   'UX461U',              'J1N0CX20V538054', 'good', 'in_use', co_tsi, 'Ad Premier',  18000000, '2018-01-22'),
    ('TSI-LTP-131', 'Lenovo Ideapad Slim 1',       'laptop', 'Hardware', 'Lenovo', 'Ideapad Slim 1',      NULL,              'good', 'in_use', co_tsi, 'Ad Premier',   9397000, '2022-10-28'),
    ('TSI-LTP-132', 'Asus Go 14',                  'laptop', 'Hardware', 'Asus',   'Go 14',               'S4N0CV02N690148', 'good', 'in_use', co_tsi, 'Ad Premier',   9996200, '2024-10-10'),
    ('TSI-LTP-133', 'Lenovo Thinkpad X390',        'laptop', 'Hardware', 'Lenovo', 'Thinkpad X390',       'PF41PEZN',        'good', 'in_use', co_tsi, 'Ad Premier',   5899000, '2024-05-14'),
    ('TSI-LTP-134', 'Asus UX363EA',                'laptop', 'Hardware', 'Asus',   'UX363EA',             'J5N0CV00138818F', 'good', 'in_use', co_tsi, 'Ad Premier',  14981600, '2022-11-08'),
    ('TSI-LTP-135', 'Lenovo Thinkpad T470s',       'laptop', 'Hardware', 'Lenovo', 'Thinkpad T470s',      'PC0U04VE',        'good', 'in_use', co_tsi, 'Ad Premier',   3949000, NULL),
    ('TSI-LTP-136', 'Asus UX363EA',                'laptop', 'Hardware', 'Asus',   'UX363EA',             'N2N0CX08725907B', 'good', 'in_use', co_tsi, 'Ad Premier',  18299000, '2022-06-28'),
    ('TSI-LTP-137', 'LENOVO IdeaPad Slim 3',       'laptop', 'Hardware', 'Lenovo', 'IdeaPad Slim 3',      'PF53XSFF',        'good', 'in_use', co_tsi, 'Ad Premier',   9942800, '2025-04-15'),
    ('TSI-LTP-138', 'Lenovo Thinkpad Yoga X380',   'laptop', 'Hardware', 'Lenovo', 'Thinkpad Yoga X380',  NULL,              'good', 'active', co_tsi, 'Pondok Cabe',  5000000, NULL)
  ON CONFLICT (asset_tag) DO NOTHING;

  RAISE NOTICE 'Bagian 2 terpasang. Total baris di tabel assets: %', (SELECT count(*) FROM assets);
END $$;


/*
# Penugasan bagian 2 (opsional)

Same caveat as part 1: the spreadsheet has no handover date, so every match is
stamped with TODAY. Correct them afterwards from each asset's Edit form.

TSI-LTP-138 has no holder in the sheet and so is absent from this list.
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
      ('TSI-PHN-009', 'Annisa Rizki Ramadhani'),
      ('TSI-LTP-116', 'Titi Nurhayati'),
      ('TSI-LTP-117', 'Nilkham Aditya Pra'),   -- nama terpotong di sumber
      ('TSI-LTP-118', 'Amelia Sakinah'),
      ('TSI-LTP-119', 'Ardian'),
      ('TSI-LTP-120', 'Ananda Pratiwi'),
      ('TSI-LTP-121', 'Andrio Biko'),
      ('TSI-LTP-122', 'Angga Rachmatilah'),
      ('TSI-LTP-123', 'Annisa Rizki Ramadhani'),
      ('TSI-LTP-124', 'Ashif An Nafi'),
      ('TSI-LTP-125', 'Ayu Armadani'),
      ('TSI-LTP-126', 'Cahyo Dwi Pradan'),     -- nama terpotong di sumber
      ('TSI-LTP-127', 'Dewi'),
      ('TSI-LTP-128', 'Cindy Anatasya'),
      ('TSI-LTP-129', 'Ajit Mahendra'),
      ('TSI-LTP-130', 'Dian Mutiara Sari'),
      ('TSI-LTP-131', 'Dhea Sasqia'),
      ('TSI-LTP-132', 'Didiet Poerdiono'),
      ('TSI-LTP-133', 'Diki Rustiawan'),
      ('TSI-LTP-134', 'Kartika Suryaningrum'),
      ('TSI-LTP-135', 'Dinda Febriani Putri'),
      ('TSI-LTP-136', 'Kokok Surya Nusan'),    -- nama terpotong di sumber
      ('TSI-LTP-137', 'Kurnia Asyura')
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

  RAISE NOTICE 'Penugasan bagian 2 dibuat: %. Tidak ditemukan di tabel employees: %',
    matched, COALESCE(array_to_string(missing, ', '), '-');
END $$;
