import type { ElementType } from 'react';
import {
  Monitor, Laptop, Server, Printer, Cpu, Package, Smartphone,
  CheckCircle, AlertCircle, Clock, XCircle, Archive,
} from 'lucide-react';

/*
Shared asset presentation config.

This lives in lib/ rather than in the ITAssets page on purpose: the page imports
the asset modals and the modals need this config, so keeping it in the page
created an import cycle that left STATUS_CONFIG uninitialised at module-eval time.
*/

export const STATUS_CONFIG: Record<string, { label: string; icon: ElementType; classes: string }> = {
  active:      { label: 'Active',      icon: CheckCircle, classes: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-400' },
  in_use:      { label: 'In Use',      icon: Clock,       classes: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-400' },
  maintenance: { label: 'Maintenance', icon: AlertCircle, classes: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-400' },
  retired:     { label: 'Retired',     icon: Archive,     classes: 'text-gray-500 bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50 dark:text-gray-400' },
  lost:        { label: 'Lost',        icon: XCircle,     classes: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-400' },
};

export const ASSET_STATUS_VALUES = Object.keys(STATUS_CONFIG);

export const CONDITION_CLASSES: Record<string, string> = {
  excellent: 'text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-900/30 dark:border-teal-700/50 dark:text-teal-400',
  good:    'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-400',
  fair:    'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-400',
  poor:      'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-700/50 dark:text-orange-400',
  damaged: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-400',
};

const CATEGORY_ICONS: Record<string, ElementType> = {
  laptop:  Laptop,
  phone:   Smartphone,
  desktop: Monitor,
  server:  Server,
  printer: Printer,
  network: Cpu,
};

/** Categories that have a dedicated icon — keeps getCategoryIcon meaningful. */
export const ASSET_CATEGORIES = Object.keys(CATEGORY_ICONS);

/** Fixed asset classifications. Depreciation keys off this — see lib/depreciation.ts. */
export const ASSET_TYPES = ['Hardware', 'Software', 'Peripheral', 'Network Equipment'];

/** The sites assets can sit at. 'Mobile' means it travels with its holder. */
export const ASSET_LOCATIONS = ['Ad Premier', 'Pondok Cabe', 'Surabaya', 'Mobile'];

export function getCategoryIcon(category: string) {
  const key = category?.toLowerCase();
  return CATEGORY_ICONS[key] ?? Package;
}
