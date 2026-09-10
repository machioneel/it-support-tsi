/*
Helpers for moving between <input type="date"> values ('YYYY-MM-DD') and the
timestamptz columns in the database.

Both conversions deliberately work in LOCAL time. The naive approach —
`new Date('2026-09-06').toISOString()` — parses the string as UTC midnight, and
`new Date(iso).toISOString().slice(0, 10)` reads it back in UTC. Either one can
land on the wrong calendar day once a timezone offset is involved.
*/

/** 'YYYY-MM-DD' -> ISO timestamp anchored at local midday, so the calendar day survives. */
export function dateInputToISO(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** ISO timestamp -> 'YYYY-MM-DD' in the viewer's own timezone. */
export function isoToDateInput(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Today as a 'YYYY-MM-DD' input value. */
export function todayInput(): string {
  return dateToInput(new Date());
}

/**
 * A Date to a `date` input value, in LOCAL time.
 *
 * Not `toISOString().slice(0, 10)`: that converts to UTC first, so anywhere east
 * of Greenwich an evening date lands on the following day.
 */
export function dateToInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** True when both timestamps fall on the same local calendar day. */
export function isSameLocalDay(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  return isoToDateInput(a) === isoToDateInput(b);
}

/**
 * `datetime-local` input <-> ISO.
 *
 * Separate from the date-only helpers above because some fields need the time
 * of day: a ticket's completion time feeds the resolution duration, and
 * rounding it to midday would make every same-day fix look like it took hours.
 */
export function isoToDateTimeInput(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function dateTimeInputToISO(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
