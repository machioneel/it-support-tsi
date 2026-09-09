import type { Asset } from './types';
import { monthsBetween } from './assetAge';

/** Useful life applied to depreciable assets, in years. */
export const DEPRECIATION_YEARS = 4;

/**
 * Asset types that depreciate.
 *
 * Software is explicitly excluded. Peripheral and Network Equipment are excluded
 * too because the rule given was "hardware only" — widen this array if those
 * should be depreciated as well; nothing else needs to change.
 */
export const DEPRECIABLE_ASSET_TYPES = ['Hardware'];

export interface Depreciation {
  /** Acquisition cost. */
  cost: number;
  /** Straight-line charge per year and per month. */
  annual: number;
  monthly: number;
  /** Whole months of life consumed, capped at the useful life. */
  monthsElapsed: number;
  monthsTotal: number;
  monthsRemaining: number;
  accumulated: number;
  bookValue: number;
  /** 0-100, how much of the useful life has been consumed. */
  percentUsed: number;
  fullyDepreciated: boolean;
}

export function isDepreciable(assetType: string | null | undefined): boolean {
  return !!assetType && DEPRECIABLE_ASSET_TYPES.includes(assetType);
}

/**
 * Straight-line depreciation over DEPRECIATION_YEARS, measured from the purchase
 * date. Returns null when the asset does not depreciate or lacks the inputs
 * (cost or purchase date) — callers should treat null as "not applicable"
 * rather than as a zero.
 */
export function calculateDepreciation(
  asset: Pick<Asset, 'asset_type' | 'purchase_cost' | 'purchase_date'>,
  asOf: Date = new Date()
): Depreciation | null {
  if (!isDepreciable(asset.asset_type)) return null;
  if (asset.purchase_cost === null || asset.purchase_cost === undefined) return null;
  if (!asset.purchase_date) return null;

  const cost = Number(asset.purchase_cost);
  if (!Number.isFinite(cost) || cost <= 0) return null;

  const start = new Date(asset.purchase_date);
  if (Number.isNaN(start.getTime())) return null;

  const monthsTotal = DEPRECIATION_YEARS * 12;
  const rawElapsed = monthsBetween(start, asOf);
  const monthsElapsed = Math.min(Math.max(rawElapsed, 0), monthsTotal);

  const annual = cost / DEPRECIATION_YEARS;
  const monthly = annual / 12;
  const accumulated = monthly * monthsElapsed;
  const bookValue = cost - accumulated;

  return {
    cost,
    annual,
    monthly,
    monthsElapsed,
    monthsTotal,
    monthsRemaining: monthsTotal - monthsElapsed,
    accumulated,
    bookValue,
    percentUsed: (monthsElapsed / monthsTotal) * 100,
    fullyDepreciated: monthsElapsed >= monthsTotal,
  };
}
