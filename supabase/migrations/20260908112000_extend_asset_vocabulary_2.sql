/*
# Widen the asset vocabulary again (part 3 of the register)

The third batch of the spreadsheet introduces:

  - condition "Poor"        — sits between fair and damaged; added to the enum
  - company   "JIT"         — a fourth operating company
  - status    "Under Repair" — no schema change needed, it maps onto the existing
                               'maintenance' value

As before, ALTER TYPE ... ADD VALUE cannot be used in the transaction that adds
it, so the data insert lives in the next migration file.

Safe to re-run.
*/

ALTER TYPE asset_condition ADD VALUE IF NOT EXISTS 'poor' AFTER 'fair';

/*
JIT in the register is PT. Jasa Instrumentasi Teknologi.

Same rename-then-insert order as the CIS block in
20260908110000_extend_asset_vocabulary.sql, and for the same reason: a plain
upsert on company_name would treat the short code and the legal name as two
different companies.
*/
UPDATE companies
SET    company_name = 'PT. Jasa Instrumentasi Teknologi'
WHERE  company_name = 'JIT';

INSERT INTO companies (company_name)
SELECT 'PT. Jasa Instrumentasi Teknologi'
WHERE  NOT EXISTS (
  SELECT 1 FROM companies WHERE company_name = 'PT. Jasa Instrumentasi Teknologi'
);
