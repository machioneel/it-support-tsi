/**
 * Rupiah formatting, shared by the asset screens and the printed reports.
 *
 * Returns an em dash rather than "Rp 0" when the value is missing: a laptop with
 * no recorded purchase cost is not a free laptop, and a renewal budget that
 * counts it as zero is wrong in the direction that matters.
 */
export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}
