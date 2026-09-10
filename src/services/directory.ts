/**
 * Read-only lookups of the two people tables.
 *
 * These live here rather than inside features/users and features/employees
 * because three different features need them: assets picks a holder and a
 * signatory, tickets picks a reporter, and each directory page lists its own.
 * Managing those records is still a feature; looking them up is shared.
 */
import { supabase } from './supabase';

/** IT staff only. For ticket reporters use fetchEmployees(). */
export async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, company_id, full_name, email, division, role, contact_number')
    .order('full_name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, company_id, full_name, email, division, contact_number')
    .order('full_name');
  if (error) throw error;
  return data ?? [];
}
