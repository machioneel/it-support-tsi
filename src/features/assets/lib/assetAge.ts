import type { Asset } from '@/types/index';

/**
 * Age at which an asset enters the renewal (peremajaan) shortlist.
 *
 * Three years is deliberately one year short of DEPRECIATION_YEARS: it puts an
 * asset on the list while it still has book value left, which is the point of a
 * renewal plan — budgeting before the thing is worn out, not after.
 */
export const RENEWAL_AGE_YEARS = 3;
export const RENEWAL_AGE_MONTHS = RENEWAL_AGE_YEARS * 12;

/**
 * Whole months completed between two dates.
 *
 * Lives here rather than in depreciation.ts because both the renewal shortlist
 * and the depreciation schedule measure from the purchase date, and two copies
 * of this arithmetic would eventually disagree.
 */
export function monthsBetween(start: Date, end: Date): number {
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  return months;
}

/**
 * Age in whole months, or null when it cannot be known.
 *
 * A large part of the register has no purchase date, so null is a real answer
 * here and not an error. Callers must not fold it into zero: an asset of unknown
 * age is not a new asset.
 */
export function assetAgeMonths(
  purchaseDate: string | null | undefined,
  asOf: Date = new Date()
): number | null {
  if (!purchaseDate) return null;
  const start = new Date(purchaseDate);
  if (Number.isNaN(start.getTime())) return null;
  const months = monthsBetween(start, asOf);
  // A purchase date in the future is data entry noise, not a negative age.
  return months < 0 ? 0 : months;
}

/** "3 thn 2 bln", "4 thn", "7 bln". */
export function formatAge(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} bln`;
  if (rest === 0) return `${years} thn`;
  return `${years} thn ${rest} bln`;
}

/**
 * Whether an asset belongs on the renewal shortlist.
 *
 * Retired assets are excluded — they are already out of service, so there is
 * nothing left to plan a replacement for. Assets with no purchase date are
 * excluded too, because their age is unknown; the page counts them separately
 * so they are visibly missing rather than silently treated as young.
 */
export function isDueForRenewal(
  asset: Pick<Asset, 'purchase_date' | 'status'>,
  asOf: Date = new Date()
): boolean {
  if (asset.status === 'retired') return false;
  const months = assetAgeMonths(asset.purchase_date, asOf);
  return months !== null && months >= RENEWAL_AGE_MONTHS;
}
