import type { AssetAssignment } from '@/types/index';
import { monthsBetween, formatAge } from '@/features/assets/lib/assetAge';

/**
 * One leg of an asset's movement history: who held it, from when, until when.
 *
 * An asset can pass through several people, so every document and every history
 * row is written against one of these rather than against "the current holder".
 * That is what makes it possible to reprint the paperwork for a handover that
 * ended two people ago.
 */
export interface MovementRecord {
  /** The assignment row this came from, when there is one. */
  id?: string;
  fullName: string;
  division: string;
  assignedDate: string;
  returnedDate: string | null;
  notes: string | null;
}

const UNKNOWN_HOLDER = 'Karyawan tidak dikenal';

/**
 * The employee join comes back null when the employee row was deleted —
 * `employees.id` is ON DELETE SET NULL on asset_assignments, so the history
 * survives the person. Say so rather than rendering an empty name.
 */
export function movementOf(assignment: AssetAssignment): MovementRecord {
  return {
    id: assignment.id,
    fullName: assignment.employee?.full_name ?? UNKNOWN_HOLDER,
    division: assignment.employee?.division ?? '—',
    assignedDate: assignment.assigned_date,
    returnedDate: assignment.returned_date,
    notes: assignment.notes,
  };
}

/**
 * How long the asset was held, in plain Indonesian.
 *
 * Falls back to days below a month, because "0 bln" tells the reader nothing
 * about a laptop that was out for a fortnight. An open assignment is measured
 * up to `asOf`.
 */
export function formatHoldDuration(
  assignedDate: string,
  returnedDate: string | null,
  asOf: Date = new Date()
): string {
  const start = new Date(assignedDate);
  const end = returnedDate ? new Date(returnedDate) : asOf;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—';
  if (end < start) return '—';

  const months = monthsBetween(start, end);
  if (months >= 1) return formatAge(months);

  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return days <= 0 ? 'kurang dari 1 hari' : `${days} hari`;
}
