/*
# Set the two operating companies

The register should hold exactly:
  - PT. TSI Sertifikasi Internasional
  - PT. Dharma Mitra Solusi

The existing row is named 'TSI Group' and is referenced by every employee and
ticket (`employees.company_id` and `tickets.company_id` both CASCADE on delete).
So it is RENAMED rather than deleted and recreated — deleting it would take the
30 employees and all their tickets with it.

Safe to re-run: the rename is a no-op once applied, and both inserts are guarded
by the UNIQUE constraint on company_name.
*/

-- Rename the incumbent row, preserving every foreign key that points at it.
UPDATE companies
SET    company_name = 'PT. TSI Sertifikasi Internasional'
WHERE  company_name = 'TSI Group';

-- Create either company if it is not present (fresh database, or DMS never added).
INSERT INTO companies (company_name)
VALUES ('PT. TSI Sertifikasi Internasional')
ON CONFLICT (company_name) DO NOTHING;

INSERT INTO companies (company_name)
VALUES ('PT. Dharma Mitra Solusi')
ON CONFLICT (company_name) DO NOTHING;
