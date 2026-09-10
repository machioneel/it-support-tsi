import { supabase } from '@/services/supabase';

export async function createEmployee(employee: {
  company_id: string;
  full_name: string;
  email: string;
  division: string;
  contact_number: string;
}) {
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEmployee(id: string, updates: {
  company_id: string;
  full_name: string;
  email: string;
  division: string;
  contact_number: string | null;
}) {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * What a delete would detach.
 *
 * tickets.reporter_id and asset_assignments.employee_id are both ON DELETE SET
 * NULL, so removing an employee does not delete their history — it strips the
 * name off it, irreversibly. Callers show these counts before confirming.
 */
export async function countEmployeeReferences(employeeId: string) {
  const ticketsQuery = supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('reporter_id', employeeId);

  const assetsQuery = supabase
    .from('asset_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', employeeId)
    .eq('status', 'assigned');

  const [tickets, assets] = await Promise.all([ticketsQuery, assetsQuery]);

  if (tickets.error) throw tickets.error;

  return {
    tickets: tickets.count ?? 0,
    // asset_assignments may not exist yet; that must not block the check.
    activeAssets: assets.error ? 0 : (assets.count ?? 0),
    assetsUnavailable: !!assets.error,
  };
}

export async function deleteEmployee(id: string) {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
}
