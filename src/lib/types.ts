/** Roles that can log into the IT dashboard. Employees are NOT users — see `Employee`. */
export type ITRole = 'Technician' | 'Admin';

export type ReportedVia = 'Web Portal' | 'WhatsApp Direct' | 'Phone Call' | 'Walk-In';

export type IssueCategory = 'Hardware' | 'Software' | 'Network' | 'Account & Access';

export type PriorityLevel = 'P1 - Critical' | 'P2 - High' | 'P3 - Medium' | 'P4 - Low';

export type TicketStatus = 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';

export type AssetStatus = 'active' | 'in_use' | 'maintenance' | 'retired' | 'lost';

export type AssetCondition = 'good' | 'fair' | 'damaged';

export interface Asset {
  id: string;
  asset_tag: string;
  asset_name: string;
  asset_image: string | null;
  category: string;
  asset_type: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  condition: AssetCondition;
  status: AssetStatus;
  company_id: string | null;
  location: string | null;
  purchase_cost: number | null;
  purchase_date: string | null;
  created_at: string;
  updated_at?: string;
}

export type AssignmentStatus = 'assigned' | 'returned';

/** Which employee currently holds an asset. */
export interface AssetAssignment {
  id: string;
  asset_id: string;
  employee_id: string | null;
  assigned_date: string;
  returned_date: string | null;
  status: AssignmentStatus;
  notes: string | null;
  created_at?: string;
  employee?: { full_name: string; email: string; division: string } | null;
}

export const ASSET_DOCUMENT_CATEGORIES = [
  'BAST Serah Terima',
  'BAST Pengembalian',
  'Invoice',
  'Garansi',
  'Lainnya',
] as const;

export type AssetDocumentCategory = (typeof ASSET_DOCUMENT_CATEGORIES)[number];

/** A file attached to an asset — signed handover forms, invoices, warranty scans. */
export interface AssetDocument {
  id: string;
  asset_id: string;
  file_url: string;
  file_name: string | null;
  file_type: string | null;
  category: AssetDocumentCategory;
  uploaded_at: string;
}

/** One service/repair entry against an asset. */
export interface AssetMaintenanceLog {
  id: string;
  asset_id: string;
  description: string | null;
  cost: number | null;
  performed_at: string | null;
  next_maintenance_at: string | null;
  created_at?: string;
}

/**
 * A company row. `company_name` is plain text on purpose — the group is expected
 * to add more PTs over time, and a union type here would make every new company
 * a code change (and a compile error) instead of just a database row.
 */
export interface Company {
  id: string;
  company_name: string;
}

/** IT Staff: Technician or Admin — logs into the dashboard */
export interface User {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  division: string;
  role: ITRole;
  contact_number: string;
  created_at?: string;
}

/** Company Employee — submits tickets via Employee Portal, does NOT log into dashboard */
export interface Employee {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  division: string;
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
