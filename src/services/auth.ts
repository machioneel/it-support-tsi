/**
 * Who is signing in. Two doors: IT staff reach the dashboard through `users`,
 * employees reach the portal through `employees`.
 */
import { supabase } from '@/services/supabase';

/** Resolve a logged-in IT staff member (Technician/Admin) — queries the users table */
export async function checkEmail(email: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, company_id, full_name, email, division, role, contact_number')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) throw error;
  return user;
}

/** Check employee portal login — queries the employees table */
export async function checkEmployeeEmail(email: string) {
  const { data: employee, error } = await supabase
    .from('employees')
    .select('id, company_id, full_name, email, division, contact_number')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) throw error;
  return employee;
}
