import type { PriorityLevel, TicketStatus } from '@/types';

export const priorityShort = (p: PriorityLevel): string => p.split(' - ')[0];

export const priorityClasses: Record<PriorityLevel, string> = {
  'P1 - Critical': 'text-red-700 bg-red-50 border border-red-200',
  'P2 - High': 'text-orange-700 bg-orange-50 border border-orange-200',
  'P3 - Medium': 'text-blue-700 bg-blue-50 border border-blue-200',
  'P4 - Low': 'text-slate-600 bg-slate-50 border border-slate-200',
};

export const statusClasses: Record<TicketStatus, string> = {
  Open: 'text-slate-700 bg-slate-100 border border-slate-200',
  'In Progress': 'text-indigo-700 bg-indigo-50 border border-indigo-200',
  Pending: 'text-amber-700 bg-amber-50 border border-amber-200',
  Resolved: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  Closed: 'text-slate-500 bg-slate-50 border border-slate-200',
};

export const statusDotClasses: Record<TicketStatus, string> = {
  Open: 'bg-slate-400',
  'In Progress': 'bg-indigo-500',
  Pending: 'bg-amber-500',
  Resolved: 'bg-emerald-500',
  Closed: 'bg-slate-300',
};
