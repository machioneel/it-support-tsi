/*
# Widen the asset vocabulary to match the real register

The spreadsheet being imported uses values the schema does not know yet:

  - condition "Excellent" — the enum only had good / fair / damaged
  - company  "CIS"        — only the two PTs were registered
  - category "Phone"      — free text in the database, but the app needs an icon
  - location "Surabaya"   — free text too, handled in the app constants

Only the first two need the database. ALTER TYPE ... ADD VALUE cannot be used in
the same transaction that adds it, which is why the data insert lives in the next
migration file rather than here.

Safe to re-run.
*/

-- 'excellent' ranks above 'good', so place it first in the enum ordering.
ALTER TYPE asset_condition ADD VALUE IF NOT EXISTS 'excellent' BEFORE 'good';

/*
CIS in the register is PT. Chandra Inovasi Solusindo.

Earlier revisions of this file registered the bare short code because the legal
name had not been supplied yet. Databases that ran that version are renamed here;
the guarded insert then covers a fresh database. Doing it in that order matters —
plain `INSERT ... ON CONFLICT (company_name)` would not see 'CIS' and
'PT. Chandra Inovasi Solusindo' as the same row, and would leave you with two
companies and employees split across them.
*/
UPDATE companies
SET    company_name = 'PT. Chandra Inovasi Solusindo'
WHERE  company_name = 'CIS';

INSERT INTO companies (company_name)
SELECT 'PT. Chandra Inovasi Solusindo'
WHERE  NOT EXISTS (
  SELECT 1 FROM companies WHERE company_name = 'PT. Chandra Inovasi Solusindo'
);
