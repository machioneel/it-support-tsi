export type Role = 'Employee' | 'Technician' | 'Admin';

export type CompanyName = 'PT TSI Sertifikasi International' | 'PT Dharma Mitra Solusi';

export type ReportedVia = 'Web Portal' | 'WhatsApp Direct' | 'Phone Call' | 'Walk-In';

export type IssueCategory = 'Hardware' | 'Software' | 'Network' | 'Account & Access';

export type PriorityLevel = 'P1 - Critical' | 'P2 - High' | 'P3 - Medium' | 'P4 - Low';

export type TicketStatus = 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';

export interface Company {
  id: string;
  company_name: CompanyName;
}

export interface User {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  division: string;
  role: Role;
  contact_number: string;
  created_at?: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  company_id: string;
  reporter_id: string | null;
  assignee_id: string | null;
  reported_via: ReportedVia;
  issue_title: string;
  issue_description: string;
  issue_category: IssueCategory;
  issue_subcategory: string;
  priority_level: PriorityLevel;
  ticket_status: TicketStatus;
  pending_reason: string | null;
  root_cause: string | null;
  solution_applied: string | null;
  attachment_url: string | null;
  created_at: string;
  finished_at: string | null;
  resolution_duration_minutes: number | null;
  satisfaction_rating: number | null;
  employee_feedback: string | null;
  reporter?: { full_name: string; email: string; contact_number: string };
  assignee?: { full_name: string };
}

export const PRIORITY_ORDER: PriorityLevel[] = [
  'P1 - Critical',
  'P2 - High',
  'P3 - Medium',
  'P4 - Low',
];

export const STATUS_ORDER: TicketStatus[] = [
  'Open',
  'In Progress',
  'Pending',
  'Resolved',
  'Closed',
];

export interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  views: number;
  helpful_score: number;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  updated_at?: string;
}
