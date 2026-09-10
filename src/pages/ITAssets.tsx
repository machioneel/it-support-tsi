import { useEffect, useState } from 'react';
import { useAssets } from '@/features/assets/hooks/useAssets';
import {
  Search, Plus, Edit2, Trash2, ChevronDown, Package, Eye, QrCode,
  CheckCircle, AlertCircle, Clock, UserCheck, Undo2, FileText, Download, Upload,
  RefreshCw, CalendarClock, ChevronLeft, ChevronRight, X, SlidersHorizontal
} from 'lucide-react';
import {
  STATUS_CONFIG,
  ASSET_STATUS_VALUES,
  getCategoryIcon,
} from '@/features/assets/lib/assetConfig';
import AssetDetailModal from '@/features/assets/components/AssetDetailModal';
import AssetFormModal from '@/features/assets/components/AssetFormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AssetBarcodeModal from '@/features/assets/components/AssetBarcodeModal';
import ReturnAssetDialog from '@/features/assets/components/ReturnAssetDialog';
import AssetHandoverDoc from '@/features/assets/components/AssetHandoverDoc';
import AssetReturnDoc from '@/features/assets/components/AssetReturnDoc';
import AssetImportDialog from '@/features/assets/components/AssetImportDialog';
import AssetRenewalReport from '@/features/assets/components/AssetRenewalReport';
import SortableHeader from '@/components/ui/SortableHeader';
import type { SortDir } from '@/components/ui/SortableHeader';
import { deleteAsset, fetchActiveAssignments } from '@/features/assets/api';
import { fetchCompanies } from '@/services/companies';
import type { ActiveAssignment } from '@/features/assets/api';
import { initialsOf } from '@/lib/text';
import type { Asset, Company } from '@/types/index';
import { buildAssetCsv, downloadCsv } from '@/features/assets/lib/assetCsv';
import type { MovementRecord } from '@/features/assets/lib/assetMovement';
import { DEPRECIATION_YEARS } from '@/features/assets/lib/depreciation';
import {
  RENEWAL_AGE_YEARS,
  assetAgeMonths,
  formatAge,
  isDueForRenewal,
} from '@/features/assets/lib/assetAge';

type AssetView = 'all' | 'renewal';

const VIEWS: { value: AssetView; label: string; icon: typeof Package }[] = [
  { value: 'all',     label: 'Semua Asset', icon: Package },
  { value: 'renewal', label: `Peremajaan (>${RENEWAL_AGE_YEARS} thn)`, icon: RefreshCw },
];

/**
 * Sortable columns. 'default' means "the order the database returned", which is
 * what the list shows before anyone clicks a header — so switching sorting on
 * does not silently rearrange the register. 'age' only exists on the renewal
 * tab, where the Umur column is rendered.
 */
type SortKey =
  | 'default'
  | 'asset_tag'
  | 'asset_name'
  | 'brand'
  | 'asset_type'
  | 'purchase_date'
  | 'status'
  | 'age'
  | 'assigned_to';

/** Each tab opens on the order that makes sense for it. */
const DEFAULT_SORT: Record<AssetView, { key: SortKey; dir: SortDir }> = {
  all:     { key: 'default', dir: 'asc' },
  renewal: { key: 'age', dir: 'desc' },
};

const ASSIGNMENT_FILTERS = [
  { value: 'All', label: 'Semua' },
  { value: 'assigned', label: 'Sudah diserahkan' },
  { value: 'unassigned', label: 'Belum diserahkan' },
];

/**
 * Dimensions you can narrow the register by. Each holds a list of accepted
 * values: empty means "no constraint", so an untouched filter never hides
 * anything. Every dimension is multi-select — asking for "Laptop or Phone" is
 * a normal question, and a single-value dropdown cannot express it.
 */
type FilterKey =
  | 'status'
  | 'category'
  | 'asset_type'
  | 'brand'
  | 'company'
  | 'location'
  | 'condition';

const FILTER_TITLES: Record<FilterKey, string> = {
  status: 'Status',
  category: 'Kategori',
  asset_type: 'Tipe',
  brand: 'Brand',
  company: 'Perusahaan',
  location: 'Lokasi',
  condition: 'Kondisi',
};

const FILTER_ORDER: FilterKey[] = [
  'status', 'category', 'asset_type', 'brand', 'company', 'location', 'condition',
];

const EMPTY_FILTERS: Record<FilterKey, string[]> = {
  status: [], category: [], asset_type: [], brand: [], company: [], location: [], condition: [],
};

const byLabel = (a: string, b: string) => a.localeCompare(b, 'id', { sensitivity: 'base' });

/** Distinct non-empty values, sorted for a stable menu. */
function uniqueValues(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort(byLabel);
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('id-ID');
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
      {children}
    </div>
  );
}

/** One end of the age range: a years box and a months box. */
function AgeBound({
  label,
  years,
  months,
  onYears,
  onMonths,
}: {
  label: string;
  years: string;
  months: string;
  onYears: (v: string) => void;
  onMonths: (v: string) => void;
}) {
  const box =
    'w-16 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-xs text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <input
        type="number"
        min={0}
        value={years}
        onChange={(e) => onYears(e.target.value)}
        placeholder="0"
        aria-label={`${label} — tahun`}
        className={box}
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">thn</span>
      <input
        type="number"
        min={0}
        max={11}
        value={months}
        onChange={(e) => onMonths(e.target.value)}
        placeholder="0"
        aria-label={`${label} — bulan`}
        className={box}
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">bln</span>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <GroupTitle>{title}</GroupTitle>
      {options.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">Belum ada data</p>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {options.map((o) => (
            <label
              key={o.value}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => onToggle(o.value)}
                className="w-3.5 h-3.5 shrink-0 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500/30"
              />
              <span className="truncate capitalize" title={o.label}>{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ITAssets() {
  const { assets, loading, refetch } = useAssets();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<FilterKey, string[]>>(EMPTY_FILTERS);
  // Age bounds, held as raw input strings so each box can be empty (meaning
  // "unbounded") rather than forced to a number. Years and months are separate
  // boxes so a bound can be as coarse or as precise as the question needs.
  const [ageMinYears, setAgeMinYears] = useState('');
  const [ageMinMonths, setAgeMinMonths] = useState('');
  const [ageMaxYears, setAgeMaxYears] = useState('');
  const [ageMaxMonths, setAgeMaxMonths] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [barcodeAsset, setBarcodeAsset] = useState<Asset | null>(null);
  const [returningAsset, setReturningAsset] = useState<Asset | null>(null);
  // The return document is raised straight after a successful return, holding
  // the leg of the history that was just closed. Kept separate from
  // `returningAsset` because the dialog has already closed by then.
  const [returnDoc, setReturnDoc] = useState<{ asset: Asset; movement: MovementRecord } | null>(null);
  const [bastAsset, setBastAsset] = useState<Asset | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState('All');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [view, setView] = useState<AssetView>('all');
  const [isRenewalReportOpen, setIsRenewalReportOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT.all.key);
  const [sortDir, setSortDir] = useState<SortDir>(DEFAULT_SORT.all.dir);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  // Ticked rows, by asset id. Held as a Set so a selection survives paging —
  // you can gather rows from page 1 and page 3 into one printed proposal.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Switching tab resets to that tab's default. 'age' is meaningless on the
  // all-assets tab (no Umur column), so carrying a sort across would leave the
  // table ordered by a column nobody can see.
  const switchView = (next: AssetView) => {
    setView(next);
    setSortKey(DEFAULT_SORT[next].key);
    setSortDir(DEFAULT_SORT[next].dir);
    // The two tabs hold different rows; carrying ticks across would leave a
    // selection you cannot see.
    setSelectedIds(new Set());
  };

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    // Dates and age read best newest/oldest first; text reads best A-Z.
    setSortDir(key === 'purchase_date' || key === 'age' ? 'desc' : 'asc');
  };

  useEffect(() => {
    fetchCompanies().then((d) => setCompanies(d as Company[])).catch(() => {});
  }, []);

  // Anything that changes which rows exist, or their order, invalidates the
  // current page number — page 4 of a re-filtered list means nothing.
  useEffect(() => {
    setCurrentPage(1);
  }, [
    view, searchTerm, filters, assignmentFilter, sortKey, sortDir, rowsPerPage,
    ageMinYears, ageMinMonths, ageMaxYears, ageMaxMonths,
  ]);

  // asset_id -> whoever currently holds it.
  const [holders, setHolders] = useState<Record<string, ActiveAssignment>>({});
  const [assignmentsUnavailable, setAssignmentsUnavailable] = useState(false);

  // Bumped by anything that changes assignments. Returning an asset touches only
  // asset_assignments, so we cannot rely on the assets array changing identity.
  const [assignmentsVersion, setAssignmentsVersion] = useState(0);
  const reloadAssignments = () => setAssignmentsVersion((v) => v + 1);

  // The cancelled flag stops a slow earlier response from overwriting a newer one.
  useEffect(() => {
    let cancelled = false;
    fetchActiveAssignments()
      .then((map) => {
        if (cancelled) return;
        setHolders(map);
        setAssignmentsUnavailable(false);
      })
      .catch((err) => {
        console.error('Active assignments unavailable:', err);
        if (cancelled) return;
        setHolders({});
        setAssignmentsUnavailable(true);
      });
    return () => { cancelled = true; };
  }, [assets, assignmentsVersion]);

  // One clock for the whole render, so every row is aged against the same
  // instant and the list cannot reorder itself mid-pass.
  const now = new Date();

  const renewalAssets = assets.filter((a) => isDueForRenewal(a, now));

  // Age is unknowable without a purchase date. These are neither "due" nor
  // "not due", so the renewal tab reports them instead of quietly dropping them.
  const undatedCount = assets.filter(
    (a) => !a.purchase_date && a.status !== 'retired'
  ).length;

  const scopedAssets = view === 'renewal' ? renewalAssets : assets;

  // Menus are built from the whole register, not the filtered set — otherwise
  // choosing "Asus" would make every other brand disappear from the list you
  // just used to choose it.
  const filterOptions: Record<FilterKey, { value: string; label: string }[]> = {
    status: ASSET_STATUS_VALUES.map((v) => ({ value: v, label: STATUS_CONFIG[v]?.label ?? v })),
    category: uniqueValues(assets.map((a) => a.category)).map((v) => ({ value: v, label: v })),
    asset_type: uniqueValues(assets.map((a) => a.asset_type)).map((v) => ({ value: v, label: v })),
    brand: uniqueValues(assets.map((a) => a.brand)).map((v) => ({ value: v, label: v })),
    company: [...companies]
      .sort((a, b) => byLabel(a.company_name, b.company_name))
      .map((c) => ({ value: c.id, label: c.company_name })),
    location: uniqueValues(assets.map((a) => a.location)).map((v) => ({ value: v, label: v })),
    condition: uniqueValues(assets.map((a) => a.condition)).map((v) => ({ value: v, label: v })),
  };

  const valueFor = (asset: Asset, key: FilterKey): string | null => {
    switch (key) {
      case 'status':     return asset.status;
      case 'category':   return asset.category ?? null;
      case 'asset_type': return asset.asset_type ?? null;
      case 'brand':      return asset.brand ?? null;
      case 'company':    return asset.company_id ?? null;
      case 'location':   return asset.location ?? null;
      case 'condition':  return asset.condition ?? null;
    }
  };

  const toggleFilter = (key: FilterKey, value: string) =>
    setFilters((prev) => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });

  // Both bounds are inclusive, expressed in months so years and months combine
  // into one number to compare against.
  const boxValue = (raw: string) => {
    if (raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const minY = boxValue(ageMinYears);
  const minM = boxValue(ageMinMonths);
  const maxY = boxValue(ageMaxYears);
  const maxM = boxValue(ageMaxMonths);

  const minMonths = minY === null && minM === null ? null : (minY ?? 0) * 12 + (minM ?? 0);

  /*
   * An empty month box on the UPPER bound means "to the end of that year", so
   * "sampai 5 thn" still keeps an asset of 5 thn 11 bln — the whole-year
   * reading people expect. Typing a month makes the bound exact instead.
   */
  const maxMonths =
    maxY === null && maxM === null
      ? null
      : maxM === null
        ? (maxY ?? 0) * 12 + 11
        : (maxY ?? 0) * 12 + maxM;

  const ageBounded = minMonths !== null || maxMonths !== null;

  const filteredAssets = scopedAssets.filter(asset => {
    const holder = holders[asset.id];

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      asset.asset_name.toLowerCase().includes(q) ||
      asset.asset_tag.toLowerCase().includes(q) ||
      // The holder is part of what people look an asset up by.
      (holder?.fullName.toLowerCase().includes(q) ?? false);
    if (!matchesSearch) return false;

    for (const key of FILTER_ORDER) {
      const accepted = filters[key];
      if (accepted.length === 0) continue;
      const value = valueFor(asset, key);
      if (!value || !accepted.includes(value)) return false;
    }

    if (assignmentFilter !== 'All') {
      const wantAssigned = assignmentFilter === 'assigned';
      if (!!holder !== wantAssigned) return false;
    }

    if (ageBounded) {
      const months = assetAgeMonths(asset.purchase_date, now);
      // An asset with no purchase date has no age, so it cannot satisfy a
      // range. Dropping it is the honest answer; counting it as new is not.
      if (months === null) return false;
      if (minMonths !== null && months < minMonths) return false;
      if (maxMonths !== null && months > maxMonths) return false;
    }

    return true;
  });

  const clearAgeRange = () => {
    setAgeMinYears('');
    setAgeMinMonths('');
    setAgeMaxYears('');
    setAgeMaxMonths('');
  };

  // ---- what is currently narrowing the list, as removable chips -----------
  const activeChips: { id: string; label: string; onRemove: () => void }[] = [];
  for (const key of FILTER_ORDER) {
    for (const value of filters[key]) {
      const label = filterOptions[key].find((o) => o.value === value)?.label ?? value;
      activeChips.push({
        id: `${key}:${value}`,
        label: `${FILTER_TITLES[key]}: ${label}`,
        onRemove: () => toggleFilter(key, value),
      });
    }
  }
  if (assignmentFilter !== 'All') {
    activeChips.push({
      id: 'assignment',
      label: `Penugasan: ${ASSIGNMENT_FILTERS.find((f) => f.value === assignmentFilter)?.label}`,
      onRemove: () => setAssignmentFilter('All'),
    });
  }
  if (ageBounded) {
    const label =
      minMonths !== null && maxMonths !== null
        ? `Umur: ${formatAge(minMonths)} – ${formatAge(maxMonths)}`
        : minMonths !== null
          ? `Umur: ≥ ${formatAge(minMonths)}`
          : `Umur: ≤ ${formatAge(maxMonths as number)}`;
    activeChips.push({ id: 'age', label, onRemove: clearAgeRange });
  }

  const clearAllFilters = () => {
    setFilters(EMPTY_FILTERS);
    clearAgeRange();
    setAssignmentFilter('All');
  };

  // null means "no value here" — those rows sink to the bottom in BOTH
  // directions, since a page of blanks is never what someone sorted for.
  const sortValue = (asset: Asset): string | number | null => {
    switch (sortKey) {
      case 'asset_tag':     return asset.asset_tag;
      case 'asset_name':    return asset.asset_name;
      case 'brand':         return asset.brand || null;
      case 'asset_type':    return asset.asset_type || null;
      case 'purchase_date': return asset.purchase_date ? new Date(asset.purchase_date).getTime() : null;
      // Sort on the label the reader sees, not the raw enum value.
      case 'status':        return STATUS_CONFIG[asset.status]?.label ?? asset.status;
      case 'age':           return assetAgeMonths(asset.purchase_date, now);
      case 'assigned_to':   return holders[asset.id]?.fullName ?? null;
      default:              return null;
    }
  };

  const visibleAssets =
    sortKey === 'default'
      ? filteredAssets
      : [...filteredAssets].sort((a, b) => {
          const av = sortValue(a);
          const bv = sortValue(b);
          if (av === null && bv === null) return 0;
          if (av === null) return 1;
          if (bv === null) return -1;

          const cmp =
            typeof av === 'number' && typeof bv === 'number'
              ? av - bv
              // numeric:true keeps TSI-LTP-9 before TSI-LTP-113.
              : String(av).localeCompare(String(bv), 'id', { sensitivity: 'base', numeric: true });

          return sortDir === 'asc' ? cmp : -cmp;
        });

  // ---- paging ----------------------------------------------------------
  const totalFiltered = visibleAssets.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / rowsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalFiltered);
  const pageAssets = visibleAssets.slice(startIndex, endIndex);

  // ---- selection -------------------------------------------------------
  const selectedAssets = visibleAssets.filter((a) => selectedIds.has(a.id));
  // Export and the printed proposal act on the ticked rows, or on everything
  // currently listed when nothing is ticked.
  const actionAssets = selectedAssets.length > 0 ? selectedAssets : visibleAssets;

  const pageAllSelected = pageAssets.length > 0 && pageAssets.every((a) => selectedIds.has(a.id));
  const pageSomeSelected = pageAssets.some((a) => selectedIds.has(a.id));

  const toggleRow = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // The header box acts on this page only, so ticking it never silently
  // selects hundreds of rows you have not looked at.
  const togglePage = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const a of pageAssets) {
        if (pageAllSelected) next.delete(a.id);
        else next.add(a.id);
      }
      return next;
    });

  // +1 for the checkbox column.
  const columnCount = view === 'renewal' ? 11 : 10;

  // Summary counts
  const counts = {
    total:       assets.length,
    active:      assets.filter(a => a.status === 'active').length,
    in_use:      assets.filter(a => a.status === 'in_use').length,
    maintenance: assets.filter(a => a.status === 'maintenance').length,
    assigned:    assets.filter(a => !!holders[a.id]).length,
  };

  // Exports what the filters currently show, so a filtered view is exportable
  // as-is rather than always dumping the whole register.
  const handleExport = () => {
    const csv = buildAssetCsv(actionAssets, holders, companies);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`assets-${stamp}.csv`, csv);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">IT Assets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola dan pantau inventaris perangkat IT</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 liquid-card px-4 py-2 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white/60"
          >
            <Upload size={16} />
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={actionAssets.length === 0}
            className="flex items-center gap-2 liquid-card px-4 py-2 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white/60 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              selectedAssets.length > 0
                ? `Ekspor ${selectedAssets.length} baris terpilih`
                : 'Ekspor semua baris yang sedang tampil'
            }
          >
            <Download size={16} />
            Export{selectedAssets.length > 0 ? ` (${selectedAssets.length})` : ''}
          </button>
          {view === 'renewal' && (
            <button
              onClick={() => setIsRenewalReportOpen(true)}
              disabled={actionAssets.length === 0}
              className="flex items-center gap-2 liquid-card px-4 py-2 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white/60 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                selectedAssets.length > 0
                  ? `Cetak usulan untuk ${selectedAssets.length} aset terpilih`
                  : 'Cetak usulan untuk semua aset yang sedang tampil'
              }
            >
              <FileText size={16} />
              Usulan PDF{selectedAssets.length > 0 ? ` (${selectedAssets.length})` : ''}
            </button>
          )}
          <button
            onClick={() => setIsNewAssetOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
          >
            <Plus size={16} />
            New Asset
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Assets', value: counts.total,       icon: Package,     color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Active',       value: counts.active,      icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'In Use',       value: counts.in_use,      icon: Clock,       color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Maintenance',  value: counts.maintenance,  icon: AlertCircle, color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-900/30' },
          { label: 'Diserahkan',   value: counts.assigned,    icon: UserCheck,   color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="liquid-card rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>
                <Icon size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="liquid-card rounded-xl overflow-hidden flex flex-col">

        {/* Sub tabs */}
        <div className="px-4 pt-3 border-b border-gray-200 dark:border-gray-700/50 flex items-center gap-1">
          {VIEWS.map(({ value, label, icon: Icon }) => {
            const active = view === value;
            const count = value === 'renewal' ? renewalAssets.length : assets.length;
            return (
              <button
                key={value}
                onClick={() => switchView(value)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={15} />
                {label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, tag, atau pemegang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowFilterPanel((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 liquid-card rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                <SlidersHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>Filter</span>
                {activeChips.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[11px] font-semibold">
                    {activeChips.length}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>

              {showFilterPanel && (
                <>
                  {/* Catches the click that dismisses the panel. */}
                  <div className="fixed inset-0 z-20" onClick={() => setShowFilterPanel(false)} />
                  <div className="absolute right-0 top-full mt-2 w-[min(46rem,calc(100vw-2rem))] liquid-panel rounded-xl shadow-xl z-30 p-4 max-h-[70vh] overflow-y-auto">

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Saring aset
                      </span>
                      <button
                        onClick={clearAllFilters}
                        disabled={activeChips.length === 0}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Bersihkan semua
                      </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                      {FILTER_ORDER.map((key) => (
                        <FilterGroup
                          key={key}
                          title={FILTER_TITLES[key]}
                          options={filterOptions[key]}
                          selected={filters[key]}
                          onToggle={(value) => toggleFilter(key, value)}
                        />
                      ))}

                      <div>
                        <GroupTitle>Penugasan</GroupTitle>
                        <div className="space-y-1">
                          {ASSIGNMENT_FILTERS.map((f) => (
                            <label
                              key={f.value}
                              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="assignment-filter"
                                checked={assignmentFilter === f.value}
                                onChange={() => setAssignmentFilter(f.value)}
                                className="w-3.5 h-3.5 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500/30"
                              />
                              <span className="truncate">{f.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-200/70 dark:border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <GroupTitle>Rentang umur</GroupTitle>
                        {ageBounded && (
                          <button
                            onClick={clearAgeRange}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 mb-2"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <AgeBound
                          label="Dari"
                          years={ageMinYears}
                          months={ageMinMonths}
                          onYears={setAgeMinYears}
                          onMonths={setAgeMinMonths}
                        />
                        <AgeBound
                          label="Sampai"
                          years={ageMaxYears}
                          months={ageMaxMonths}
                          onYears={setAgeMaxYears}
                          onMonths={setAgeMaxMonths}
                        />
                      </div>

                      {ageBounded && (
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mt-2">
                          Menampilkan aset berumur{' '}
                          {minMonths !== null ? formatAge(minMonths) : '0 bln'}
                          {' sampai '}
                          {maxMonths !== null ? formatAge(maxMonths) : 'tak terbatas'}.
                        </p>
                      )}

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Dihitung dari tanggal pembelian dan inklusif di kedua ujung. Kotak
                        bulan boleh dikosongkan: pada batas atas artinya "sampai akhir
                        tahun itu", jadi "sampai 5 thn" masih memuat aset berumur
                        5 thn 11 bln. Aset tanpa tanggal pembelian tidak punya umur,
                        sehingga tidak muncul selama rentang ini aktif.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Active filters */}
        {activeChips.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700/50 flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium"
              >
                {chip.label}
                <button
                  onClick={chip.onRemove}
                  className="p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
                  aria-label={`Hapus filter ${chip.label}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ml-1"
            >
              Bersihkan semua
            </button>
          </div>
        )}

        {view === 'renewal' && (
          <div className="px-4 py-3 border-b border-blue-200/60 dark:border-blue-700/40 bg-blue-50/70 dark:bg-blue-900/20 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <CalendarClock size={14} className="shrink-0 mt-0.5" />
            <span>
              Asset berumur {RENEWAL_AGE_YEARS} tahun atau lebih terhitung dari tanggal
              pembelian, awalnya diurutkan dari yang paling tua. Asset berstatus{' '}
              <span className="font-medium">retired</span> tidak ditampilkan karena sudah
              tidak dipakai.
              {undatedCount > 0 && (
                <>
                  {' '}<span className="font-medium">{undatedCount} asset tidak punya tanggal
                  pembelian</span>, jadi umurnya tidak bisa dihitung dan tidak masuk daftar
                  ini — lengkapi tanggalnya agar ikut terpantau.
                </>
              )}
            </span>
          </div>
        )}

        {selectedIds.size > 0 && (
          <div className="px-4 py-2.5 border-b border-blue-200/60 dark:border-blue-700/40 bg-blue-50/70 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-300 flex items-center justify-between gap-3">
            <span>
              <span className="font-semibold">{selectedIds.size}</span> aset dipilih —
              Export dan Usulan PDF hanya memuat baris ini.
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-blue-100/70 dark:hover:bg-blue-800/40 transition-colors font-medium"
            >
              <X size={14} />
              Bersihkan
            </button>
          </div>
        )}

        {assignmentsUnavailable && (
          <div className="px-4 py-3 border-b border-amber-200/60 dark:border-amber-700/40 bg-amber-50/70 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-400">
            Data assignment tidak dapat dimuat — kolom "Assigned To" dikosongkan.
            Jalankan migrasi assets untuk membuat tabel asset_assignments.
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-transparent text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100/50 dark:border-gray-700/50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={pageAllSelected}
                    ref={(el) => {
                      // Half-ticked when only part of the page is selected.
                      if (el) el.indeterminate = !pageAllSelected && pageSomeSelected;
                    }}
                    onChange={togglePage}
                    aria-label="Pilih semua baris di halaman ini"
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3 w-16">Foto</th>
                <SortableHeader label="Asset Tag" columnKey="asset_tag" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                <SortableHeader label="Asset Name" columnKey="asset_name" activeKey={sortKey} direction={sortDir} onSort={toggleSort} className="min-w-[200px]" />
                <SortableHeader label="Brand" columnKey="brand" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                <SortableHeader label="Type" columnKey="asset_type" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                <SortableHeader label="Tanggal Beli" columnKey="purchase_date" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                <SortableHeader label="Status" columnKey="status" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                {view === 'renewal' && (
                  <SortableHeader label="Umur" columnKey="age" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                )}
                <SortableHeader label="Assigned To" columnKey="assigned_to" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan={columnCount} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    Memuat data...
                  </td>
                </tr>
              ) : pageAssets.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="px-5 py-12 text-center">
                    <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    {view === 'renewal' ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Tidak ada asset yang berumur {RENEWAL_AGE_YEARS} tahun atau lebih.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada asset ditemukan.</p>
                        <button
                          onClick={() => setIsNewAssetOpen(true)}
                          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Tambah asset baru
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                pageAssets.map((asset) => {
                  const CategoryIcon = getCategoryIcon(asset.category);
                  const statusCfg = STATUS_CONFIG[asset.status];
                  const StatusIcon = statusCfg?.icon ?? Package;
                  const holder = holders[asset.id];

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`transition-colors cursor-pointer ${
                        selectedIds.has(asset.id)
                          ? 'bg-blue-50/60 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                      }`}
                    >
                      {/* Pilih */}
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(asset.id)}
                          onChange={() => toggleRow(asset.id)}
                          aria-label={`Pilih ${asset.asset_tag}`}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                        />
                      </td>

                      {/* Foto */}
                      <td className="px-5 py-4">
                        {asset.asset_image ? (
                          <img
                            src={asset.asset_image}
                            alt={asset.asset_name}
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <CategoryIcon size={18} />
                          </div>
                        )}
                      </td>

                      {/* Asset Tag */}
                      <td className="px-5 py-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {asset.asset_tag}
                      </td>

                      {/* Asset Name */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900 dark:text-white truncate">{asset.asset_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{asset.category}</div>
                      </td>

                      {/* Brand */}
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                        {asset.brand || '—'}
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                        {asset.asset_type || '—'}
                      </td>

                      {/* Tanggal Beli */}
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                        {formatDate(asset.purchase_date)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusCfg?.classes ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                          <StatusIcon size={11} />
                          {statusCfg?.label ?? asset.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Umur — renewal tab only */}
                      {view === 'renewal' && (() => {
                        const months = assetAgeMonths(asset.purchase_date, now);
                        // Past the useful life is the case worth flagging first.
                        const overdue = months !== null && months >= DEPRECIATION_YEARS * 12;
                        return (
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                overdue
                                  ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-400'
                                  : 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-400'
                              }`}
                              title={overdue ? `Melewati umur ekonomis ${DEPRECIATION_YEARS} tahun` : undefined}
                            >
                              <CalendarClock size={11} />
                              {months === null ? '—' : formatAge(months)}
                            </span>
                          </td>
                        );
                      })()}

                      {/* Assigned To */}
                      <td className="px-5 py-4">
                        {holder ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {initialsOf(holder.fullName)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {holder.fullName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {holder.division} · {formatDate(holder.assignedDate)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingAsset(asset); }}
                            className="text-sm text-gray-400 dark:text-gray-500 italic hover:text-blue-600 hover:not-italic transition-colors"
                          >
                            Belum diserahkan
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setBarcodeAsset(asset)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Barcode"
                          >
                            <QrCode size={15} />
                          </button>
                          {holder && (
                            <button
                              onClick={() => setBastAsset(asset)}
                              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Berita acara serah terima"
                            >
                              <FileText size={15} />
                            </button>
                          )}
                          {holder && (
                            <button
                              onClick={() => setReturningAsset(asset)}
                              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              title="Kembalikan"
                            >
                              <Undo2 size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => setEditingAsset(asset)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeletingAsset(asset)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && totalFiltered > 0 && (
          <div className="px-5 py-3 border-t border-gray-100/50 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span>Baris per halaman:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="bg-transparent font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="ml-2">
                {startIndex + 1}-{endIndex} dari{' '}
                <span className="font-medium text-gray-700 dark:text-gray-200">{totalFiltered}</span>
                {totalFiltered !== scopedAssets.length && ` (difilter dari ${scopedAssets.length})`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-400 dark:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (validCurrentPage <= 3) pageNum = i + 1;
                else if (validCurrentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = validCurrentPage - 2 + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded flex items-center justify-center ${
                      validCurrentPage === pageNum
                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-400 dark:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AssetDetailModal
        asset={selectedAsset}
        isOpen={selectedAsset !== null}
        onClose={() => setSelectedAsset(null)}
        onShowBarcode={setBarcodeAsset}
      />

      <AssetRenewalReport
        assets={actionAssets}
        selectionUsed={selectedAssets.length > 0}
        holders={holders}
        isOpen={isRenewalReportOpen}
        onClose={() => setIsRenewalReportOpen(false)}
      />

      <AssetImportDialog
        isOpen={isImportOpen}
        assets={assets}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => { refetch(); reloadAssignments(); }}
      />

      <AssetHandoverDoc
        asset={bastAsset}
        holder={bastAsset ? holders[bastAsset.id] ?? null : null}
        isOpen={bastAsset !== null}
        onClose={() => setBastAsset(null)}
      />

      <ReturnAssetDialog
        asset={returningAsset}
        holder={returningAsset ? holders[returningAsset.id] ?? null : null}
        isOpen={returningAsset !== null}
        onClose={() => setReturningAsset(null)}
        onSuccess={(movement) => {
          reloadAssignments();
          // Capture the asset now: setReturningAsset(null) runs on close.
          if (returningAsset) setReturnDoc({ asset: returningAsset, movement });
        }}
      />

      <AssetReturnDoc
        asset={returnDoc?.asset ?? null}
        movement={returnDoc?.movement ?? null}
        isOpen={returnDoc !== null}
        onClose={() => setReturnDoc(null)}
      />

      <AssetBarcodeModal
        asset={barcodeAsset}
        isOpen={barcodeAsset !== null}
        onClose={() => setBarcodeAsset(null)}
      />

      <AssetFormModal
        isOpen={isNewAssetOpen}
        onClose={() => setIsNewAssetOpen(false)}
        onSuccess={() => { refetch(); reloadAssignments(); }}
      />

      <AssetFormModal
        asset={editingAsset}
        isOpen={editingAsset !== null}
        onClose={() => setEditingAsset(null)}
        onSuccess={() => { refetch(); reloadAssignments(); }}
      />

      <ConfirmDialog
        isOpen={deletingAsset !== null}
        title="Hapus asset?"
        message={
          <>
            <span className="font-medium text-gray-900 dark:text-white">
              {deletingAsset?.asset_name}
            </span>{' '}
            (<span className="font-mono">{deletingAsset?.asset_tag}</span>) akan dihapus
            permanen, beserta riwayat assignment, maintenance, dan dokumennya.
            Tindakan ini tidak bisa dibatalkan.
          </>
        }
        confirmLabel="Hapus"
        onConfirm={async () => {
          if (!deletingAsset) return;
          await deleteAsset(deletingAsset.id);
          refetch();
        }}
        onClose={() => setDeletingAsset(null)}
      />
    </div>
  );
}