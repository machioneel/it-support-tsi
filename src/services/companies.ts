/** The company reference table, shared by every feature. */
import { supabase } from '@/services/supabase';

export async function fetchCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, company_name')
    .order('company_name');
  if (error) throw error;
  return data ?? [];
}
