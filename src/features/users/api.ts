import { supabase } from '@/services/supabase';

export async function createUser(user: {
  company_id: string;
  full_name: string;
  email: string;
  division: string;
  role: string;
  contact_number: string;
}) {
  const { data, error } = await supabase
    .from('users')
    .insert(user)
    .select()
    .single();
  if (error) throw error;
  return data;
}
