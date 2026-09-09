-- Seed file for Dummy Data (Companies, IT Users, Employees, and Tickets)
-- Note: the sample employees and tickets all belong to the first company;
-- PT. Dharma Mitra Solusi is created empty.
-- Make sure to run this against your Supabase database after all migrations have been applied.

DO $$
DECLARE
    company_tsi_group UUID;
    user1 UUID;
    user2 UUID;
    user3 UUID;
    user4 UUID;
    user5 UUID;
    staff_agung UUID;
BEGIN
    -- 0. Clear existing data to avoid conflicts on re-runs
    DELETE FROM public.tickets;
    DELETE FROM public.employees;
    DELETE FROM public.users;
    DELETE FROM public.companies;

    -- 1. Create the operating companies.
    -- Mirrors 20260907140000_set_companies.sql so a seeded database and a migrated
    -- one end up with the same company list. More PTs can simply be added here.
    INSERT INTO public.companies (id, company_name)
    VALUES (gen_random_uuid(), 'PT. TSI Sertifikasi Internasional')
    RETURNING id INTO company_tsi_group;

    INSERT INTO public.companies (id, company_name)
    VALUES (gen_random_uuid(), 'PT. Dharma Mitra Solusi');

    -- 2a. Insert IT staff into users (these are the dashboard logins)
    INSERT INTO public.users (id, company_id, full_name, email, division, role, contact_number)
    VALUES 
      (gen_random_uuid(), company_tsi_group, 'Agung Prastyo', 'agung@tsicertification.co.id', 'IT', 'Technician', '1234567898');

    -- 2b. Insert 30 company employees into employees (these report tickets via the portal)
    INSERT INTO public.employees (id, company_id, full_name, email, division, contact_number)
    VALUES 
      (gen_random_uuid(), company_tsi_group, 'Cindy', 'cindy@tsicertification.co.id', 'IT', '1234567801'),
      (gen_random_uuid(), company_tsi_group, 'Dewi', 'dewi@tsicertification.co.id', 'HR', '1234567802'),
      (gen_random_uuid(), company_tsi_group, 'Adi JIT', 'adi@tsicertification.co.id', 'Finance', '1234567803'),
      (gen_random_uuid(), company_tsi_group, 'Arya', 'arya@tsicertification.co.id', 'Marketing', '1234567804'),
      (gen_random_uuid(), company_tsi_group, 'Nia', 'nia@tsicertification.co.id', 'Sales', '1234567805'),
      (gen_random_uuid(), company_tsi_group, 'Febri DMS', 'febri@tsicertification.co.id', 'IT', '1234567806'),
      (gen_random_uuid(), company_tsi_group, 'Abel', 'abel@tsicertification.co.id', 'HR', '1234567807'),
      (gen_random_uuid(), company_tsi_group, 'Annisa', 'annisa@tsicertification.co.id', 'Finance', '1234567808'),
      (gen_random_uuid(), company_tsi_group, 'Aditya TSI', 'aditya@tsicertification.co.id', 'Marketing', '1234567809'),
      (gen_random_uuid(), company_tsi_group, 'Yayuk TSI', 'yayuk@tsicertification.co.id', 'Sales', '1234567810'),
      (gen_random_uuid(), company_tsi_group, 'Dhea', 'dhea@tsicertification.co.id', 'IT', '1234567811'),
      (gen_random_uuid(), company_tsi_group, 'Erina TSI', 'erina@tsicertification.co.id', 'HR', '1234567812'),
      (gen_random_uuid(), company_tsi_group, 'Ikrima TSI', 'ikrima@tsicertification.co.id', 'Finance', '1234567813'),
      (gen_random_uuid(), company_tsi_group, 'Derri TSI', 'derri@tsicertification.co.id', 'Marketing', '1234567814'),
      (gen_random_uuid(), company_tsi_group, 'Amelia TSI', 'amelia@tsicertification.co.id', 'Sales', '1234567815'),
      (gen_random_uuid(), company_tsi_group, 'Ella TSI', 'ella@tsicertification.co.id', 'IT', '1234567816'),
      (gen_random_uuid(), company_tsi_group, 'Fajriatin TSI', 'fajriatin@tsicertification.co.id', 'HR', '1234567817'),
      (gen_random_uuid(), company_tsi_group, 'Fauziah TSI', 'fauziah@tsicertification.co.id', 'Finance', '1234567818'),
      (gen_random_uuid(), company_tsi_group, 'Masria TSI', 'masria@tsicertification.co.id', 'Marketing', '1234567819'),
      (gen_random_uuid(), company_tsi_group, 'Lisah TSI', 'lisah@tsicertification.co.id', 'Sales', '1234567820'),
      (gen_random_uuid(), company_tsi_group, 'Mercyana TSI', 'mercyana@tsicertification.co.id', 'IT', '1234567821'),
      (gen_random_uuid(), company_tsi_group, 'Biko TSI', 'biko@tsicertification.co.id', 'HR', '1234567822'),
      (gen_random_uuid(), company_tsi_group, 'Jeffry TSI', 'jeffry@tsicertification.co.id', 'Finance', '1234567823'),
      (gen_random_uuid(), company_tsi_group, 'Gilang TSI', 'gilang@tsicertification.co.id', 'Marketing', '1234567824'),
      (gen_random_uuid(), company_tsi_group, 'Didiet', 'didiet@tsicertification.co.id', 'Sales', '1234567825'),
      (gen_random_uuid(), company_tsi_group, 'Rabial', 'rabial@tsicertification.co.id', 'IT', '1234567826'),
      (gen_random_uuid(), company_tsi_group, 'Elisier', 'elisier@tsicertification.co.id', 'HR', '1234567827'),
      (gen_random_uuid(), company_tsi_group, 'Fadil', 'fadil@tsicertification.co.id', 'Finance', '1234567828'),
      (gen_random_uuid(), company_tsi_group, 'Putri', 'putri@tsicertification.co.id', 'Marketing', '1234567829'),
      (gen_random_uuid(), company_tsi_group, 'Shara TSI', 'shara@tsicertification.co.id', 'Sales', '1234567830');

    -- 3. Fetch UUIDs: assignee from users (IT staff), reporters from employees
    SELECT id INTO staff_agung FROM public.users WHERE email = 'agung@tsicertification.co.id' LIMIT 1;

    SELECT id INTO user1 FROM public.employees WHERE email = 'cindy@tsicertification.co.id' LIMIT 1;
    SELECT id INTO user2 FROM public.employees WHERE email = 'dewi@tsicertification.co.id' LIMIT 1;
    SELECT id INTO user3 FROM public.employees WHERE email = 'adi@tsicertification.co.id' LIMIT 1;
    SELECT id INTO user4 FROM public.employees WHERE email = 'aditya@tsicertification.co.id' LIMIT 1;
    SELECT id INTO user5 FROM public.employees WHERE email = 'febri@tsicertification.co.id' LIMIT 1;

    -- 4. Insert 10 Dummy Tickets using the reporters company_id and ONLY IT Staff as Assignees
    INSERT INTO public.tickets (ticket_number, company_id, reporter_id, assignee_id, reported_via, issue_title, issue_description, issue_category, issue_subcategory, priority_level, ticket_status)
    VALUES 
      ('TCK-1001', company_tsi_group, user1, staff_agung, 'Web Portal', 'Cannot access email', 'My outlook is constantly asking for a password and will not connect.', 'Account & Access', 'Email Access', 'P2 - High', 'Open'),
      ('TCK-1002', company_tsi_group, user2, staff_agung, 'Web Portal', 'Laptop screen flickering', 'The screen on my company laptop keeps flickering when I move the lid.', 'Hardware', 'Display', 'P3 - Medium', 'In Progress'),
      ('TCK-1003', company_tsi_group, user3, staff_agung, 'Phone Call', 'Need software license', 'I need a license for Adobe Creative Cloud for a new project.', 'Software', 'Licensing', 'P4 - Low', 'Resolved'),
      ('TCK-1004', company_tsi_group, user4, NULL, 'Web Portal', 'Internet very slow', 'The Wi-Fi on the 3rd floor is extremely slow today.', 'Network', 'Wi-Fi', 'P2 - High', 'Pending'),
      ('TCK-1005', company_tsi_group, user5, staff_agung, 'Web Portal', 'Printer out of ink', 'The main printer in the HR department needs a new black ink cartridge.', 'Hardware', 'Peripherals', 'P4 - Low', 'Closed'),
      ('TCK-1006', company_tsi_group, user1, NULL, 'Phone Call', 'VPN not connecting', 'I cannot connect to the VPN from my home network.', 'Network', 'VPN', 'P2 - High', 'Open'),
      ('TCK-1007', company_tsi_group, user2, staff_agung, 'Web Portal', 'Request new monitor', 'I would like to request a second monitor for my desk.', 'Hardware', 'Peripherals', 'P4 - Low', 'Open'),
      ('TCK-1008', company_tsi_group, user3, staff_agung, 'Web Portal', 'Error in ERP system', 'Getting a 500 error when trying to generate the monthly report.', 'Software', 'Enterprise App', 'P2 - High', 'In Progress'),
      ('TCK-1009', company_tsi_group, user4, staff_agung, 'Web Portal', 'Forgot password', 'I forgot my password for the payroll system.', 'Account & Access', 'Password Reset', 'P2 - High', 'Resolved'),
      ('TCK-1010', company_tsi_group, user5, NULL, 'Phone Call', 'New employee setup', 'Need a full setup (laptop, accounts) for a new hire starting Monday.', 'Hardware', 'New Setup', 'P3 - Medium', 'Pending');
END $$;
