/**
 * Formatting shared by the printed asset documents (BAST and BAP).
 *
 * Both documents carry the same letterhead, the same date wording and the same
 * numbering scheme, so the rules live here once. Two copies would drift the
 * moment one document is edited and the other is not.
 */

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/**
 * Indonesian office document numbering: 001/<PREFIX>/<roman month>/<year>.
 * The sequence number is a placeholder — nothing in the database issues one, so
 * it is left at 001 for the operator to correct rather than invented.
 */
export function suggestDocNumber(prefix: string, dateInput: string) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const month = ROMAN_MONTHS[d.getMonth()] ?? '';
  return `001/${prefix}/${month}/${d.getFullYear()}`;
}

export function longDate(dateInput: string | null | undefined) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function dayName(dateInput: string | null | undefined) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { weekday: 'long' });
}

export function shortDate(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID');
}
