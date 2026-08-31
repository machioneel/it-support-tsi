/*
# Create IT Helpdesk Complaint Management Schema

Creates the full relational schema for the IT Helpdesk system including
companies, users, tickets, and supporting infrastructure.

1. New Tables
- `companies`: Stores the two companies (PT TSI, PT Dharma Mitra Solusi)
- `users`: Employees and IT technicians belonging to a company
- `tickets`: IT support complaint tickets with full lifecycle tracking

2. Columns
- companies: id (uuid PK), company_name (text UNIQUE)
- users: id (uuid PK), company_id (FK), full_name, email, division, role, contact_number
- tickets: id (uuid PK), ticket_number (text UNIQUE), company_id (FK), reporter_id (FK nullable),
  reported_via, issue_title, issue_description, issue_category, issue_subcategory,
  priority_level, ticket_status, pending_reason, root_cause, solution_applied,
  attachment_url, created_at, finished_at, resolution_duration_minutes,
  satisfaction_rating, employee_feedback

3. Security
- RLS enabled on all tables
- Policies allow anon + authenticated full CRUD (no-auth app — employees
  submit complaints via email gatekeeper without signing in; IT login is
  session-based and does not use Supabase Auth)

4. Indexes
- tickets.company_id, tickets.reporter_id, tickets.ticket_status,
  tickets.priority_level, tickets.created_at for query performance
- users.email, users.company_id for lookups
*/

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  division text NOT NULL DEFAULT 'Lainnya',
  role text NOT NULL DEFAULT 'Employee' CHECK (role IN ('Employee', 'Technician', 'Admin')),
  contact_number text,
  created_at timestamptz DEFAULT now()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES users(id) ON DELETE SET NULL,
  assignee_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reported_via text NOT NULL DEFAULT 'Web Portal' CHECK (reported_via IN ('Web Portal', 'WhatsApp Direct', 'Phone Call', 'Walk-In')),
  issue_title text NOT NULL,
  issue_description text NOT NULL,
  issue_category text NOT NULL DEFAULT 'Software' CHECK (issue_category IN ('Hardware', 'Software', 'Network', 'Account & Access')),
  issue_subcategory text NOT NULL DEFAULT 'General',
  priority_level text NOT NULL DEFAULT 'P3 - Medium' CHECK (priority_level IN ('P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low')),
  ticket_status text NOT NULL DEFAULT 'Open' CHECK (ticket_status IN ('Open', 'In Progress', 'Pending', 'Resolved', 'Closed')),
  pending_reason text,
  root_cause text,
  solution_applied text,
  attachment_url text,
  created_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  resolution_duration_minutes integer,
  satisfaction_rating integer CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  employee_feedback text
);

-- Note: Also appended an ALTER TABLE to ensure it's added if the table already exists
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES users(id) ON DELETE SET NULL;

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_tickets_company_id ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_reporter_id ON tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(ticket_status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority_level);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Companies policies (anon + authenticated — no-auth app)
DROP POLICY IF EXISTS "anon_select_companies" ON companies;
CREATE POLICY "anon_select_companies" ON companies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_companies" ON companies;
CREATE POLICY "anon_insert_companies" ON companies FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_companies" ON companies;
CREATE POLICY "anon_update_companies" ON companies FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_companies" ON companies;
CREATE POLICY "anon_delete_companies" ON companies FOR DELETE
  TO anon, authenticated USING (true);

-- Users policies (anon + authenticated — no-auth app)
DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE
  TO anon, authenticated USING (true);

-- Tickets policies (anon + authenticated — no-auth app)
DROP POLICY IF EXISTS "anon_select_tickets" ON tickets;
CREATE POLICY "anon_select_tickets" ON tickets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tickets" ON tickets;
CREATE POLICY "anon_insert_tickets" ON tickets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tickets" ON tickets;
CREATE POLICY "anon_update_tickets" ON tickets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tickets" ON tickets;
CREATE POLICY "anon_delete_tickets" ON tickets FOR DELETE
  TO anon, authenticated USING (true);

-- Storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ticket-attachments bucket
DROP POLICY IF EXISTS "anon_upload_attachments" ON storage.objects;
CREATE POLICY "anon_upload_attachments" ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'ticket-attachments');

DROP POLICY IF EXISTS "anon_read_attachments" ON storage.objects;
CREATE POLICY "anon_read_attachments" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'ticket-attachments');

DROP POLICY IF EXISTS "anon_delete_attachments" ON storage.objects;
CREATE POLICY "anon_delete_attachments" ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'ticket-attachments');

-- Knowledge Base Articles table
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  content text NOT NULL,
  views integer DEFAULT 0,
  helpful_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS for knowledge_base_articles
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_articles" ON knowledge_base_articles;
CREATE POLICY "anon_select_articles" ON knowledge_base_articles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_articles" ON knowledge_base_articles;
CREATE POLICY "anon_insert_articles" ON knowledge_base_articles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_articles" ON knowledge_base_articles;
CREATE POLICY "anon_update_articles" ON knowledge_base_articles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_articles" ON knowledge_base_articles;
CREATE POLICY "anon_delete_articles" ON knowledge_base_articles FOR DELETE
  TO anon, authenticated USING (true);

-- System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- RLS for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON system_settings;
CREATE POLICY "anon_select_settings" ON system_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON system_settings;
CREATE POLICY "anon_insert_settings" ON system_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON system_settings;
CREATE POLICY "anon_update_settings" ON system_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON system_settings;
CREATE POLICY "anon_delete_settings" ON system_settings FOR DELETE
  TO anon, authenticated USING (true);

