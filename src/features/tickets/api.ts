import { supabase } from '@/services/supabase';
import type { Ticket } from '@/types';

export async function fetchTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select(
      `id, ticket_number, company_id, reporter_id, assignee_id, reported_via, issue_title, issue_description, issue_category, issue_subcategory, priority_level, ticket_status, pending_reason, root_cause, solution_applied, attachment_url, created_at, finished_at, resolution_duration_minutes, satisfaction_rating, employee_feedback,
       reporter:employees!tickets_reporter_id_fkey(full_name, email, contact_number),
       assignee:users!tickets_assignee_id_fkey(full_name)`
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Ticket[];
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
