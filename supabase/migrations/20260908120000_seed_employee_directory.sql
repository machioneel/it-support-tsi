/*
# Employee directory — the whole sheet (A–Y)

84 people, replacing the placeholder rows that seed.sql put in `employees`
('Cindy', 'Dewi', 'Adi JIT', 'Aditya TSI', ...).

THREE THINGS THIS MIGRATION DOES
--------------------------------
1. Adds `employees.location`, because the sheet carries a location per person and
   there was nowhere to put it. Nullable text, same shape as `assets.location`.
   The Employee page does not display it yet — it is stored, not shown.

2. Retires 'Group5p'. It is not a company of its own — those 11 people belong to
   PT. TSI Sertifikasi Internasional, so the code resolves to that row and no
   fifth company is created. An earlier revision of this file did register it, so
   a database that ran that version is cleaned up here.

   The four real companies are PT. TSI Sertifikasi Internasional,
   PT. Dharma Mitra Solusi, PT. Chandra Inovasi Solusindo (CIS) and
   PT. Jasa Instrumentasi Teknologi (JIT).

3. Loads the 84 people. Each row takes one of three paths, and the run reports
   which:
       - a row with the same name exists -> updated in place
       - a placeholder row already holds that email -> renamed to the real
         person ("adopted"), so any ticket pointing at it keeps its reporter
       - otherwise -> inserted

   Adoption matters because seed.sql's dummy employees own the tickets it also
   created. Deleting and re-inserting would strip those tickets of their
   reporter; renaming keeps the link intact. Every adoption is printed at the
   end so you can check the pairing.

COLUMNS FROM THE SHEET THAT ARE NOT STORED
------------------------------------------
"Status" is Employee for everyone, and that distinction already lives in the
users/employees split. "Assets Assigned" is not copied either: it belongs to
`asset_assignments`, and duplicating it here would give you two answers that can
disagree — though it is a useful cross-check against the assignment blocks in
20260908110500..113500.

"Access Level" is Standard User for all but one: Nungky Awang Chandra is marked
Power User. There is no column for it, and more to the point employees do not log
into the dashboard at all — only rows in `users` do. If Power User is meant to
grant dashboard access, that person belongs in `users` as a Technician or Admin,
not here. Left as a plain employee until you say otherwise.

EMAIL RULE
----------
Where the sheet left Email blank, the address is <first name>@tsicertification.co.id
as you specified — 73 of the 84. The eleven the sheet supplied are used verbatim,
including the ones that do not follow the rule (fadillah@ for Ahmad Fadilah,
ajid@ for Ajit Mahendra, ella@ for Nurlaela Ramli, desi@dharmamitra.id for Desy
Yuningsih, jasmine@dharmamitra.id for Jasmine Diva Shafira).

Four derived addresses could not follow the rule. `employees.email` is UNIQUE, so
a collision is not a style question — the second insert would simply fail:

  Febri                        febri@              (single name, keeps the plain form)
  Febri Iga Mahesti            febri.iga@          collides with Febri
  Kartika sari                 kartika.sari@       collide with each other, so
  Kartika Suryaningrum         kartika.suryaningrum@   neither takes the plain form
  M. Gilang Bangkit Abdillah   gilang@             "M." is an initial, not a name

  Picking a winner between two colleagues would have been the arbitrary part, so
  where both have a second name both get one. Change any of these if the real
  mailbox differs — gilang@ in particular is a guess, though seed.sql's dummy
  'Gilang TSI' sits on that same address, which is why it is adopted below.

JUDGEMENT CALLS — please check
------------------------------
a. Four people cannot be stored as the sheet has them, because
   `employees.company_id` is a single NOT NULL foreign key:

       Alya     no company at all  -> TSI, on the strength of her email domain
       Nilman   no company at all  -> TSI
       riris    no company at all  -> TSI
       Tika     no company at all  -> TSI

   Nilman, riris and Tika are blank in almost every column — no department, no
   location, and no Status or Access Level either, which every other row has.
   They look like unfinished entries rather than people missing one field, so
   TSI here is a placeholder to make them storable, not a claim. One hint worth
   noting: riris holds a Dell 3410, and that asset is registered to
   PT. Dharma Mitra Solusi in 20260908113500 — so DMS may well be the right
   answer for her.

   Kurnia Asyura has the opposite problem: two companies (TSI and Group5p). She
   takes the first of them, TSI.

b. Eleven people hold more than one department. `division` is a single text
   column, so they are stored joined by ", " rather than losing a department:
       Angga Rachmatilah       Executive, Sales & Marketing
       Annisa Rizki Ramadhani  Executive, Product Development
       Desy Yuningsih          Admin, Tender, Consultant
       Jeffry. Y               Executive, Operations
       Josef Septiardi         Executive, Sales & Marketing
       Kartika Suryaningrum    Executive, ISPO
       Kokok Surya Nusantara   Executive, Tata Kelola
       Kurnia Asyura           Executive, Finance
       Lutfi                   Consultant, Auditor
       Nilkham Aditya Prakash  HR/GA, Legal, Training
       Shara Septi             Digital Marketing, Sales & Marketing
   The Employee page splits on the comma, so each of them is filterable under
   every division they hold.

c. Six people have no department (Alya, Ardian, Kartika sari, Nilman, riris,
   Tika); they get the column default 'Lainnya'. Eight have no location
   (Afifudin, Alya, Ardian, Irvan, Kartika sari, Nilman, riris, Tika); theirs
   is NULL.

AFTERWARDS
----------
The asset assignment blocks in 20260908110500..113500 matched on employee name
against the placeholder rows, so most of them reported "not found". Re-run those
DO blocks once this migration has been applied and the real names exist.

This settles every name the asset register had truncated:
    "Cahyo Dwi Pradan…"   is Cahyo Dwi Pradana
    "Kokok Surya Nusan…"  is Kokok Surya Nusantara
    "Nilkham Aditya Pra…" is Nilkham Aditya Prakash
Fix those three literals in 20260908111000_seed_existing_assets_part2.sql, or
their assignments will keep reporting "not found".

Seven seed.sql placeholders are claimed by nobody in the sheet and will still be
sitting in the table afterwards: 'Arya', 'Nia', 'Abel', 'Lisah TSI', 'Biko TSI',
'Elisier', 'Fadil'. Most look like the same people the sheet spells out in full —
'Biko TSI' beside Andrio Biko, 'Elisier' beside Elieser Tampubolon, 'Lisah TSI'
beside Neneng Lisah, 'Abel' beside Abella Resa — but their addresses differ, so
nothing is merged automatically. Sort them out now that the directory is
complete; some of them own seeded tickets, so check before deleting.

Safe to re-run: every path is an upsert keyed on name or email.
*/

-- ============================================================
-- 1. Somewhere to put the sheet's Location column
-- ============================================================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS location text;

-- ============================================================
-- 2. Retire 'Group5p' if an earlier run of this file created it
--    Group5p resolves to PT. TSI Sertifikasi Internasional in the lookup below,
--    so no row of its own is needed. Reassign every reference before deleting:
--    users, employees and tickets all CASCADE from companies, so deleting the
--    row first would take those people and their tickets with it.
-- ============================================================
DO $$
DECLARE
  v_group5p uuid;
  v_tsi     uuid;
BEGIN
  SELECT id INTO v_group5p FROM companies WHERE company_name = 'Group5p';
  IF v_group5p IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO v_tsi FROM companies WHERE company_name = 'PT. TSI Sertifikasi Internasional';
  IF v_tsi IS NULL THEN
    RAISE EXCEPTION 'PT. TSI Sertifikasi Internasional tidak ditemukan; jalankan 20260907140000_set_companies.sql lebih dulu.';
  END IF;

  UPDATE employees SET company_id = v_tsi WHERE company_id = v_group5p;
  UPDATE users     SET company_id = v_tsi WHERE company_id = v_group5p;
  UPDATE tickets   SET company_id = v_tsi WHERE company_id = v_group5p;
  UPDATE assets    SET company_id = v_tsi WHERE company_id = v_group5p;

  DELETE FROM companies WHERE id = v_group5p;

  RAISE NOTICE 'Group5p dihapus, isinya dipindahkan ke PT. TSI Sertifikasi Internasional.';
END $$;

-- ============================================================
-- 3. The directory
-- ============================================================
DO $$
DECLARE
  r          record;
  v_company  uuid;
  v_existing uuid;
  v_old_name text;
  n_inserted int := 0;
  n_updated  int := 0;
  n_adopted  int := 0;
  adoptions  text[] := '{}';
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- name,                         division,                            email,                                        location,      company
      -- --------------------------------------------------------------------- A–D
      ('Abella Resa',                 'Finance',                           'abella@tsicertification.co.id',              'Ad Premier',  'TSI'),
      ('Adi Supriyatna',              'Product Development',               'adi@tsicertification.co.id',                 'Ad Premier',  'TSI'),
      ('Adian Rizki',                 'IT',                                'adian@tsicertification.co.id',               'Mobile',      'TSI'),
      ('Aditya',                      'Admin',                             'aditya@tsicertification.co.id',              'Ad Premier',  'TSI'),
      ('Afifudin',                    'Tender',                            'afifudin@tsicertification.co.id',            NULL,          'DMS'),
      ('Ahmad Fadilah',               'Auditor',                           'fadillah@tsicertification.co.id',            'Mobile',      'TSI'),
      ('Aisyah Mujahidah',            'Digital Marketing',                 'aisyah@tsicertification.co.id',              'Ad Premier',  'TSI'),
      ('Ajit Mahendra',               'Sales & Marketing',                 'ajid@tsicertification.co.id',                'Mobile',      'TSI'),
      ('Alya',                        'Lainnya',                           'alya@tsicertification.co.id',                NULL,          'TSI'),
      ('Amelia Sakinah',              'Product Development',               'amelia@tsicertification.co.id',              'Ad Premier',  'TSI'),
      ('Ananda Pratiwi',              'HR/GA',                             'ananda@tsicertification.co.id',              'Mobile',      'Group5p'),
      ('Andrio Biko',                 'Auditor',                           'andrio@tsicertification.co.id',              'Mobile',      'TSI'),
      ('Angga Rachmatilah',           'Executive, Sales & Marketing',      'angga@tsicertification.co.id',               'Mobile',      'TSI'),
      ('Ani Susanti',                 'Admin',                             'ani@tsicertification.co.id',                 'Surabaya',    'CIS'),
      ('Annisa Rizki Ramadhani',      'Executive, Product Development',    'annisa@tsicertification.co.id',              'Ad Premier',  'TSI'),
      ('Ardian',                      'Lainnya',                           'ardian@tsicertification.co.id',              NULL,          'CIS'),
      ('Ashif An Nafi',               'IT',                                'ashif@tsicertification.co.id',               'Ad Premier',  'Group5p'),
      ('Ayu Armadani',                'IT',                                'ayu@tsicertification.co.id',                 'Pondok Cabe', 'Group5p'),
      ('Balqis Ima Khariyah',         'CRM',                               'balqis@tsicertification.co.id',              'Ad Premier',  'TSI'),
      ('Cahyo Dwi Pradana',           'Auditor',                           'cahyo@tsicertification.co.id',               'Mobile',      'TSI'),
      ('Cindy Anatasya',              'Admin',                             'cindy@tsicertification.co.id',               'Ad Premier',  'TSI'),
      ('Derri Widardi',               'Auditor',                           'derri@tsicertification.co.id',               'Mobile',      'TSI'),
      ('Desy Yuningsih',              'Admin, Tender, Consultant',         'desi@dharmamitra.id',                        'Pondok Cabe', 'DMS'),
      ('Dewi',                        'Product Development',               'dewi@tsicertification.co.id',                'Ad Premier',  'TSI'),
      ('Dhea Sasqia',                 'CRM',                               'dhea@tsicertification.co.id',                'Ad Premier',  'TSI'),
      ('Dian Mutiara Sari',           'Sales & Marketing',                 'dian@tsicertification.co.id',                'Mobile',      'TSI'),
      ('Diara Putri',                 'CRM',                               'diara@tsicertification.co.id',               'Pondok Cabe', 'TSI'),
      ('Didiet Poerdiono',            'Auditor',                           'didiet@tsicertification.co.id',              'Mobile',      'TSI'),

      -- --------------------------------------------------------------------- D–M
      ('Diki Rustiawan',              'Sales & Marketing',                 'diki@tsicertification.co.id',                'Mobile',      'TSI'),
      ('Dinda Febriani Putri',        'HR/GA',                             'dinda@tsicertification.co.id',               'Ad Premier',  'TSI'),
      ('Eky Fikriansyah',             'Sales & Marketing',                 'eky@tsicertification.co.id',                 'Ad Premier',  'TSI'),
      ('Elieser Tampubolon',          'Consultant',                        'elieser@tsicertification.co.id',             'Pondok Cabe', 'DMS'),
      ('Ergy Refian',                 'Finance',                           'ergy@tsicertification.co.id',                'Pondok Cabe', 'TSI'),
      ('Erick Novi',                  'Executive',                         'erick@tsicertification.co.id',               'Surabaya',    'CIS'),
      ('Erina Chandra Putri',         'Sales & Marketing',                 'erina@tsicertification.co.id',               'Ad Premier',  'TSI'),
      ('Eva Marliya Sari',            'Training',                          'eva@tsicertification.co.id',                 'Ad Premier',  'TSI'),
      ('Fachmi Arya Pangestu',        'Operations',                        'fachmi@tsicertification.co.id',              'Ad Premier',  'TSI'),
      ('Fajriatin',                   'Auditor',                           'fajriatin@tsicertification.co.id',           'Mobile',      'TSI'),
      ('Fauzan Fieryandi',            'IT',                                'fauzan@tsicertification.co.id',              'Mobile',      'Group5p'),
      ('Fauziah Rahmah',              'CRM',                               'fauziah@tsicertification.co.id',             'Ad Premier',  'TSI'),
      ('Febri',                       'Auditor',                           'febri@tsicertification.co.id',               'Mobile',      'TSI'),
      ('Febri Iga Mahesti',           'Finance',                           'febri.iga@tsicertification.co.id',           'Ad Premier',  'TSI'),
      ('Ikrima Al-Muhajir',           'Product Development',               'ikrima@tsicertification.co.id',              'Ad Premier',  'TSI'),
      ('Ilham Mulya Putra Setiawan',  'Digital Marketing',                 'ilham@tsicertification.co.id',               'Pondok Cabe', 'Group5p'),
      ('Indra Wahyudi',               'Auditor',                           'indra@tsicertification.co.id',               'Mobile',      'TSI'),
      ('Irvan',                       'Consultant',                        'irvan@tsicertification.co.id',               NULL,          'DMS'),
      ('Jasmine Diva Shafira',        'Consultant',                        'jasmine@dharmamitra.id',                     'Pondok Cabe', 'DMS'),
      ('Jeffry. Y',                   'Executive, Operations',             'jeffry@tsicertification.co.id',              'Ad Premier',  'TSI'),
      ('Josef Septiardi',             'Executive, Sales & Marketing',      'josef@tsicertification.co.id',               'Mobile',      'Group5p'),
      ('Karl',                        'Sales & Marketing',                 'karl@tsicertification.co.id',                'Mobile',      'TSI'),
      ('Kartika sari',                'Lainnya',                           'kartika.sari@tsicertification.co.id',        NULL,          'TSI'),
      ('Kartika Suryaningrum',        'Executive, ISPO',                   'kartika.suryaningrum@tsicertification.co.id','Mobile',      'TSI'),
      ('Kokok Surya Nusantara',       'Executive, Tata Kelola',            'kokok@tsicertification.co.id',               'Ad Premier',  'TSI'),
      ('Kurnia Asyura',               'Executive, Finance',                'kurnia@tsicertification.co.id',              'Ad Premier',  'TSI'),
      ('Lutfi',                       'Consultant, Auditor',               'lutfi@tsicertification.co.id',               'Pondok Cabe', 'DMS'),
      ('M. Gilang Bangkit Abdillah',  'Auditor',                           'gilang@tsicertification.co.id',              'Mobile',      'TSI'),

      -- --------------------------------------------------------------------- M–Y
      ('Masria yuliana',              'Sales & Marketing',                 'masria@tsicertification.co.id',              'Ad Premier',  'TSI'),
      ('Mercyana Barbara',            'CRM',                               'mercyana@tsicertification.co.id',            'Ad Premier',  'TSI'),
      ('Moes',                        'Admin',                             'moes@tsicertification.co.id',                'Surabaya',    'CIS'),
      ('Muhammad Kifli',              'Auditor',                           'muhammad@tsicertification.co.id',            'Ad Premier',  'TSI'),
      ('Nabilah Ulfah',               'Operations',                        'nabilah@tsicertification.co.id',             'Ad Premier',  'TSI'),
      ('Neneng Lisah',                'Sales & Marketing',                 'neneng@tsicertification.co.id',              'Ad Premier',  'TSI'),
      ('Nilkham Aditya Prakash',      'HR/GA, Legal, Training',            'nilkham@tsicertification.co.id',             'Mobile',      'Group5p'),
      ('Nilman',                      'Lainnya',                           'nilman@tsicertification.co.id',              NULL,          'TSI'),
      ('Novi Indriyanti',             'HR/GA',                             'novi@tsicertification.co.id',                'Pondok Cabe', 'Group5p'),
      ('Nungky Awang Chandra',        'Executive',                         'nungky@tsicertification.co.id',              'Mobile',      'Group5p'),
      ('Nurlaela Ramli',              'Sales & Marketing',                 'ella@tsicertification.co.id',                'Ad Premier',  'TSI'),
      ('Nyoman Tutwuri Haryanto',     'Auditor',                           'nyoman@tsicertification.co.id',              'Mobile',      'TSI'),
      ('Panji Gumelar',               'IT',                                'panji@tsicertification.co.id',               'Pondok Cabe', 'Group5p'),
      ('Prabu Setiawan',              'Auditor',                           'prabu@tsicertification.co.id',               'Mobile',      'TSI'),
      ('Putri Fajrin',                'Admin',                             'putri@tsicertification.co.id',               'Ad Premier',  'TSI'),
      ('Rabial Pratama',              'Auditor',                           'rabial@tsicertification.co.id',              'Mobile',      'TSI'),
      ('Rika N.',                     'Admin',                             'rika@tsicertification.co.id',                'Ad Premier',  'TSI'),
      ('riris',                       'Lainnya',                           'riris@tsicertification.co.id',               NULL,          'TSI'),
      ('Rudi',                        'Auditor',                           'rudi@tsicertification.co.id',                'Mobile',      'TSI'),
      ('Salsa Aulia',                 'Admin',                             'salsa@tsicertification.co.id',               'Ad Premier',  'TSI'),
      ('Shara Septi',                 'Digital Marketing, Sales & Marketing', 'shara@tsicertification.co.id',            'Ad Premier',  'Group5p'),
      ('Suryadi',                     'Sales & Marketing',                 'suryadi@tsicertification.co.id',             'Mobile',      'TSI'),
      ('Susmoyo Adi Murdono',         'Auditor',                           'susmoyo@tsicertification.co.id',             'Mobile',      'TSI'),
      ('Tika',                        'Lainnya',                           'tika@tsicertification.co.id',                NULL,          'TSI'),
      ('Titi Nurhayati',              'Admin',                             'titi@tsicertification.co.id',                'Ad Premier',  'TSI'),
      ('Umi Fadillah',                'Admin',                             'umi@tsicertification.co.id',                 'Ad Premier',  'TSI'),
      ('Yayuk Sri Rejeki',            'Auditor',                           'yayuk@tsicertification.co.id',               'Mobile',      'TSI'),
      ('Yunia Afriani Rachman',       'Product Development',               'yunia@tsicertification.co.id',               'Ad Premier',  'TSI')
    ) AS t(full_name, division, email, location, company_code)
  LOOP
    -- The sheet uses short codes; `companies` holds legal names. Group5p is not
    -- a company of its own — those people are PT. TSI Sertifikasi Internasional,
    -- so the code resolves to the same row as 'TSI'.
    SELECT id INTO v_company
    FROM   companies
    WHERE  company_name = CASE r.company_code
                            WHEN 'TSI' THEN 'PT. TSI Sertifikasi Internasional'
                            WHEN 'DMS' THEN 'PT. Dharma Mitra Solusi'
                            WHEN 'Group5p' THEN 'PT. TSI Sertifikasi Internasional'
                            WHEN 'CIS' THEN 'PT. Chandra Inovasi Solusindo'
                            WHEN 'JIT' THEN 'PT. Jasa Instrumentasi Teknologi'
                            ELSE r.company_code
                          END;

    IF v_company IS NULL THEN
      RAISE EXCEPTION 'Perusahaan % belum terdaftar (dibutuhkan oleh %)', r.company_code, r.full_name;
    END IF;

    -- SELECT ... INTO keeps the previous value when nothing matches, so reset.
    v_existing := NULL;
    SELECT id INTO v_existing FROM employees WHERE lower(full_name) = lower(r.full_name);

    IF v_existing IS NOT NULL THEN
      -- Already in the register under the real name: refresh their details.
      -- The email is rewritten only when nobody else holds it, so this can
      -- never trip the UNIQUE constraint.
      UPDATE employees
      SET    division   = r.division,
             location   = r.location,
             company_id = v_company,
             email      = CASE
                            WHEN EXISTS (SELECT 1 FROM employees o
                                         WHERE o.email = r.email AND o.id <> v_existing)
                            THEN email
                            ELSE r.email
                          END
      WHERE  id = v_existing;

      n_updated := n_updated + 1;
      CONTINUE;
    END IF;

    -- A placeholder row is sitting on this address. Rename it rather than
    -- inserting a second person, so its tickets keep their reporter.
    v_existing := NULL;
    SELECT id, full_name INTO v_existing, v_old_name FROM employees WHERE email = r.email;

    IF v_existing IS NOT NULL THEN
      UPDATE employees
      SET    full_name  = r.full_name,
             division   = r.division,
             location   = r.location,
             company_id = v_company
      WHERE  id = v_existing;

      adoptions := adoptions || format('%s -> %s', v_old_name, r.full_name);
      n_adopted := n_adopted + 1;
      CONTINUE;
    END IF;

    INSERT INTO employees (company_id, full_name, email, division, location)
    VALUES (v_company, r.full_name, r.email, r.division, r.location);

    n_inserted := n_inserted + 1;
  END LOOP;

  RAISE NOTICE 'Direktori karyawan A-Y: % baru, % diperbarui, % placeholder diganti nama.',
    n_inserted, n_updated, n_adopted;
  RAISE NOTICE 'Placeholder yang diganti nama: %',
    COALESCE(NULLIF(array_to_string(adoptions, ' | '), ''), '-');
  RAISE NOTICE 'Total baris di tabel employees: %', (SELECT count(*) FROM employees);
END $$;
