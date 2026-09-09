/*
# Separate users and employees tables

Context:
- `users` table previously contained everyone: Employee, Technician, Admin.
- Problem: the Employee Portal (EmployeePortal.tsx) uses `checkEmail` which queries
  the `users` table — but employees are NOT in `users`, so they can never be found.

Solution:
- `users`     → IT Staff only (Technician, Admin). These are the people who log in
                 to the IT Dashboard.
- `employees` → Company employees only (role = 'Employee'). These are the people
                 who submit tickets via the Employee Portal. They do NOT log into
                 the dashboard.
- `tickets.reporter_id` now references `employees(id)` (not `users`).
- `tickets.assignee_id` still references `users(id)` (IT technicians).

Steps:
1. Create the `employees` table (mirrors old users structure but role = 'Employee').
2. Migrate all rows with role='Employee' from `users` → `employees`.
3. Drop the role='Employee' rows from `users`.
4. Update the FK on tickets.reporter_id to reference employees(id).
5. Add full RLS policies on employees.
6. Drop role='Employee' from the users CHECK constraint.
*/

-- ============================================================
-- 1. Create employees table
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name       text NOT NULL,
  email           text UNIQUE NOT NULL,
  division        text NOT NULL DEFAULT 'Lainnya',
  contact_number  text,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 2. Migrate existing Employee rows from users → employees
-- ============================================================
INSERT INTO employees (id, company_id, full_name, email, division, contact_number, created_at)
SELECT id, company_id, full_name, email, division, contact_number, created_at
FROM   users
WHERE  role = 'Employee'
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 3. Fix the reporter_id FK on tickets
--    (reporter_id used to point to users, must now point to employees)
-- ============================================================

-- Employee ids are preserved by the migration above, so reporter_id values that
-- pointed at an Employee row are still valid against employees.id.
-- Any reporter_id that pointed at IT staff (or a deleted user) has no employees
-- row to match, and would fail validation when the new FK is added — clear those.
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_reporter_id_fkey;

UPDATE tickets
SET    reporter_id = NULL
WHERE  reporter_id IS NOT NULL
  AND  reporter_id NOT IN (SELECT id FROM employees);
ALTER TABLE tickets
  ADD CONSTRAINT tickets_reporter_id_fkey
  FOREIGN KEY (reporter_id) REFERENCES employees(id) ON DELETE SET NULL;

-- ============================================================
-- 4. Remove Employee rows from users table
-- ============================================================
DELETE FROM users WHERE role = 'Employee';

-- ============================================================
-- 5. Tighten the users.role constraint — no more 'Employee'
-- ============================================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('Technician', 'Admin'));

-- ============================================================
-- 6. Indexes for employees
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_employees_email      ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);

-- ============================================================
-- 7. RLS for employees table (same open policies as users — no-auth app)
-- ============================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_employees" ON employees;
CREATE POLICY "anon_select_employees" ON employees FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_employees" ON employees;
CREATE POLICY "anon_insert_employees" ON employees FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_employees" ON employees;
CREATE POLICY "anon_update_employees" ON employees FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_employees" ON employees;
CREATE POLICY "anon_delete_employees" ON employees FOR DELETE
  TO anon, authenticated USING (true);
