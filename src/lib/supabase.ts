import { createClient } from '@supabase/supabase-js';
import type { Ticket } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function checkEmail(email: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, company_id, full_name, email, division, role, contact_number')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) throw error;
  return user;
}

export async function fetchTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select(
      `id, ticket_number, company_id, reporter_id, assignee_id, reported_via, issue_title, issue_description, issue_category, issue_subcategory, priority_level, ticket_status, pending_reason, root_cause, solution_applied, attachment_url, created_at, finished_at, resolution_duration_minutes, satisfaction_rating, employee_feedback,
       reporter:users!tickets_reporter_id_fkey(full_name, email, contact_number),
       assignee:users!tickets_assignee_id_fkey(full_name)`
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Ticket[];
}

export async function fetchCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, company_name')
    .order('company_name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, company_id, full_name, email, division, role, contact_number')
    .order('full_name');
  if (error) throw error;
  return data ?? [];
}

export async function createTicket(ticket: Partial<Ticket>) {
  const { data, error } = await supabase
    .from('tickets')
    .insert(ticket)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTicket(id: string, updates: Partial<Ticket>) {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createUser(user: {
  company_id: string;
  full_name: string;
  email: string;
  division: string;
  contact_number: string;
}) {
  const { data, error } = await supabase
    .from('users')
    .insert({ ...user, role: 'Employee' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadAttachment(file: File): Promise<string | null> {
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const { error } = await supabase.storage
    .from('ticket-attachments')
    .upload(fileName, file);
  if (error) throw error;

  const { data } = supabase.storage
    .from('ticket-attachments')
    .getPublicUrl(fileName);
  return data.publicUrl;
}
