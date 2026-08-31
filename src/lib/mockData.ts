import type {
  Company,
  IssueCategory,
  PriorityLevel,
  ReportedVia,
  Ticket,
  TicketStatus,
  User,
} from './types';

export const MOCK_COMPANIES: Company[] = [
  { id: 'comp-tsi', company_name: 'PT TSI Sertifikasi International' },
  { id: 'comp-dms', company_name: 'PT Dharma Mitra Solusi' },
];

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    company_id: 'comp-tsi',
    full_name: 'Andi Pratama',
    email: 'andi.pratama@tsi.co.id',
    division: 'Sertifikasi',
    role: 'Employee',
    contact_number: '6281234567001',
  },
  {
    id: 'user-2',
    company_id: 'comp-tsi',
    full_name: 'Siti Rahayu',
    email: 'siti.rahayu@tsi.co.id',
    division: 'Administrasi',
    role: 'Employee',
    contact_number: '6281234567002',
  },
  {
    id: 'user-3',
    company_id: 'comp-tsi',
    full_name: 'Budi Santoso',
    email: 'budi.santoso@tsi.co.id',
    division: 'IT Support',
    role: 'Technician',
    contact_number: '6281234567003',
  },
  {
    id: 'user-4',
    company_id: 'comp-dms',
    full_name: 'Dewi Lestari',
    email: 'dewi.lestari@dms.co.id',
    division: 'Operasional',
    role: 'Employee',
    contact_number: '6281234567004',
  },
  {
    id: 'user-5',
    company_id: 'comp-dms',
    full_name: 'Rudi Hartono',
    email: 'rudi.hartono@dms.co.id',
    division: 'Keuangan',
    role: 'Employee',
    contact_number: '6281234567005',
  },
  {
    id: 'user-6',
    company_id: 'comp-dms',
    full_name: 'Maya Sari',
    email: 'maya.sari@dms.co.id',
    division: 'IT Support',
    role: 'Technician',
    contact_number: '6281234567006',
  },
];

const categories: IssueCategory[] = [
  'Hardware',
  'Software',
  'Network',
  'Account & Access',
];
const priorities: PriorityLevel[] = [
  'P1 - Critical',
  'P2 - High',
  'P3 - Medium',
  'P4 - Low',
];
const statuses: TicketStatus[] = [
  'Open',
  'In Progress',
  'Pending',
  'Resolved',
  'Closed',
];
const channels: ReportedVia[] = [
  'Web Portal',
  'WhatsApp Direct',
  'Phone Call',
  'Walk-In',
];

const issueData: Record<IssueCategory, { titles: string[]; subcats: string[] }> = {
  Hardware: {
    titles: [
      'Monitor tidak menyala',
      'Keyboard rusak',
      'Printer tidak terdeteksi',
      'Mouse tidak responsif',
      'Laptop tidak bisa charging',
    ],
    subcats: ['Monitor', 'Keyboard', 'Printer', 'Mouse', 'Battery'],
  },
  Software: {
    titles: [
      'Microsoft Office tidak bisa dibuka',
      'Aplikasi internal error',
      'Email client tidak sinkron',
      'Antivirus update gagal',
      'Browser sering crash',
    ],
    subcats: ['Office Suite', 'Internal App', 'Email', 'Antivirus', 'Browser'],
  },
  Network: {
    titles: [
      'Koneksi internet lambat',
      'VPN tidak bisa connect',
      'WiFi sering disconnect',
      'Tidak bisa akses server',
      'IP conflict di workstation',
    ],
    subcats: ['Internet', 'VPN', 'WiFi', 'Server Access', 'IP Configuration'],
  },
  'Account & Access': {
    titles: [
      'Tidak bisa login ke sistem',
      'Password reset request',
      'Akun terkunci',
      'Permintaan akses baru',
      'Email belum terkonfigurasi',
    ],
    subcats: ['Login', 'Password', 'Account Lock', 'Access Request', 'Email Setup'],
  },
};

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function genTicketNumber(i: number): string {
  const d = new Date();
  return `TIC-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(1001 + i).padStart(4, '0')}`;
}

function genTickets(): Ticket[] {
  const tickets: Ticket[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < 24; i++) {
    const cat = pick(categories, i);
    const catData = issueData[cat];
    const status = pick(statuses, i + Math.floor(i / 5));
    const isResolved = status === 'Resolved' || status === 'Closed';
    const created = new Date(now - i * dayMs * 0.8 - Math.random() * dayMs);
    const resolvedDuration = isResolved
      ? Math.floor(30 + Math.random() * 600)
      : null;
    const finishedAt = isResolved
      ? new Date(created.getTime() + (resolvedDuration ?? 0) * 60000).toISOString()
      : null;

    tickets.push({
      id: `ticket-${i + 1}`,
      ticket_number: genTicketNumber(i),
      company_id: pick(MOCK_COMPANIES, i).id,
      reporter_id: pick(MOCK_USERS.filter((u) => u.role === 'Employee'), i).id,
      assignee_id: status === 'Open' ? null : pick(MOCK_USERS.filter((u) => u.role === 'Technician'), i).id,
      reported_via: pick(channels, i + 2),
      issue_title: pick(catData.titles, i),
      issue_description: `Pengguna melaporkan kendala terkait ${cat.toLowerCase()}. ${
        pick(catData.titles, i)
      } terjadi sejak ${created.toLocaleDateString('id-ID')}. Dampak terhadap produktivitas kerja harian.`,
      issue_category: cat,
      issue_subcategory: pick(catData.subcats, i),
      priority_level: pick(priorities, i + Math.floor(i / 4)),
      ticket_status: status,
      pending_reason:
        status === 'Pending' ? 'Menunggu konfirmasi dari vendor pihak ketiga.' : null,
      root_cause: isResolved ? 'Ditemukan masalah konfigurasi pada perangkat.' : null,
      solution_applied: isResolved
        ? 'Rekonfigurasi perangkat dan uji koneksi ulang berhasil.'
        : null,
      attachment_url: null,
      created_at: created.toISOString(),
      finished_at: finishedAt,
      resolution_duration_minutes: resolvedDuration,
      satisfaction_rating: isResolved ? Math.floor(3 + Math.random() * 3) : null,
      employee_feedback: isResolved ? 'Pelayanan cepat dan memuaskan.' : null,
    });
  }

  return tickets;
}

export const MOCK_TICKETS: Ticket[] = genTickets();
