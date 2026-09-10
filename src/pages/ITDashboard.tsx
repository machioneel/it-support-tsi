import { useState } from 'react';
import {
  Filter,
  ChevronDown,
  Plus,
  BookOpen,
  Package,
  Laptop,
  Users,
  Inbox,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useTickets } from '@/features/tickets/hooks/useTickets';
import { useAssets } from '@/features/assets/hooks/useAssets';
import { PriorityBadge, StatusBadge } from '@/features/tickets/components/TicketBadges';
import {
  STATUS_CONFIG as ASSET_STATUS_CONFIG,
  ASSET_STATUS_VALUES,
} from '@/features/assets/lib/assetConfig';
import { formatDuration } from '@/lib/format';
import { initialsOf } from '@/lib/text';

const ASSET_BAR_COLORS: Record<string, string> = {
  active:      'bg-emerald-500',
  in_use:      'bg-blue-500',
  maintenance: 'bg-amber-500',
  retired:     'bg-gray-400',
  lost:        'bg-red-500',
};

const STATUS_SLICES = [
  { key: 'Open',        label: 'Open',        dot: 'bg-blue-500',   hex: '#3B82F6' },
  { key: 'In Progress', label: 'Dikerjakan',  dot: 'bg-amber-500',  hex: '#F59E0B' },
  { key: 'Pending',     label: 'Pending',     dot: 'bg-purple-500', hex: '#8B5CF6' },
  { key: 'Resolved',    label: 'Selesai',     dot: 'bg-emerald-500', hex: '#10B981' },
];

export default function ITDashboard() {
  const { tickets, loading, error } = useTickets();
  const { assets, loading: assetsLoading, error: assetsError } = useAssets();
  const navigate = useNavigate();
  const { openNewTicketModal } = useOutletContext<{ openNewTicketModal: () => void }>();

  const [timeFilterOpen, setTimeFilterOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('This week');
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Memuat data dashboard...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;
  }

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'All' && t.ticket_status !== statusFilter) return false;
    const ticketDate = new Date(t.created_at);
    const now = new Date();
    if (timeRange === 'This week') {
      if (ticketDate < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) return false;
    } else if (timeRange === 'This month') {
      if (ticketDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) return false;
    }
    return true;
  });

  // ---- tickets -----------------------------------------------------------
  const totalTickets = filteredTickets.length;
  const openTickets = filteredTickets.filter((t) => t.ticket_status === 'Open').length;
  const inProgressTickets = filteredTickets.filter((t) => t.ticket_status === 'In Progress').length;
  const pendingTickets = filteredTickets.filter((t) => t.ticket_status === 'Pending').length;
  const resolvedTickets = filteredTickets.filter(
    (t) => t.ticket_status === 'Resolved' || t.ticket_status === 'Closed'
  ).length;

  const today = new Date().toISOString().split('T')[0];
  const resolvedToday = filteredTickets.filter(
    (t) => t.ticket_status === 'Resolved' && t.finished_at?.startsWith(today)
  ).length;

  const activeTickets = openTickets + inProgressTickets;
  const recentTickets = filteredTickets.slice(0, 5);

  const pct = (n: number) => (totalTickets ? Math.round((n / totalTickets) * 100) : 0);
  const statusCounts: Record<string, number> = {
    Open: openTickets,
    'In Progress': inProgressTickets,
    Pending: pendingTickets,
    Resolved: resolvedTickets,
  };

  /*
   * The donut is drawn from the real proportions. The previous version was a
   * CSS border with four fixed colours, so it showed four equal quarters no
   * matter what the numbers were.
   */
  let sweep = 0;
  const donutStops = STATUS_SLICES.map((s) => {
    const start = sweep;
    sweep += pct(statusCounts[s.key]);
    return `${s.hex} ${start}% ${sweep}%`;
  });
  const donut = totalTickets
    ? `conic-gradient(${donutStops.join(', ')}, #E5E7EB ${sweep}% 100%)`
    : 'conic-gradient(#E5E7EB 0 100%)';

  const priorities = [
    { label: 'Critical', bar: 'bg-red-500',    count: filteredTickets.filter((t) => t.priority_level === 'P1 - Critical').length },
    { label: 'High',     bar: 'bg-orange-400', count: filteredTickets.filter((t) => t.priority_level === 'P2 - High').length },
    { label: 'Medium',   bar: 'bg-blue-400',   count: filteredTickets.filter((t) => t.priority_level === 'P3 - Medium').length },
    { label: 'Low',      bar: 'bg-gray-400',   count: filteredTickets.filter((t) => t.priority_level === 'P4 - Low').length },
  ];
  const maxPriority = Math.max(...priorities.map((p) => p.count), 1);

  /*
   * Measured, not guessed. The card this replaces printed a hard-coded
   * "2h 15m ↓18% from last week" next to a register holding zero tickets.
   */
  const durations = filteredTickets
    .map((t) => t.resolution_duration_minutes)
    .filter((d): d is number => typeof d === 'number' && d > 0);
  const avgResolution = durations.length
    ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    : null;

  // ---- assets ------------------------------------------------------------
  const totalAssets = assets.length;
  const assetsInUse = assets.filter((a) => a.status === 'in_use').length;
  const assetsInMaintenance = assets.filter((a) => a.status === 'maintenance').length;
  const assetsDamaged = assets.filter((a) => a.condition === 'damaged' || a.status === 'lost').length;
  const assetsNeedingAttention = assetsInMaintenance + assetsDamaged;

  const assetStatusCounts = ASSET_STATUS_VALUES.map((status) => ({
    status,
    count: assets.filter((a) => a.status === status).length,
  }));
  const maxAssetStatus = Math.max(...assetStatusCounts.map((s) => s.count), 1);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ringkasan tiket dan aset IT
          </p>
        </div>
        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <button
              onClick={() => { setStatusFilterOpen(!statusFilterOpen); setTimeFilterOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 liquid-card rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-800/50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>{statusFilter === 'All' ? 'Filter' : statusFilter}</span>
            </button>
            {statusFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 liquid-panel rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1">
                {['All', 'Open', 'In Progress', 'Pending', 'Resolved'].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setStatusFilterOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => { setTimeFilterOpen(!timeFilterOpen); setStatusFilterOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 liquid-card rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-800/50 transition-colors"
            >
              <span>{timeRange}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {timeFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 liquid-panel rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1">
                {['This week', 'This month', 'All time'].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTimeRange(t); setTimeFilterOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {assetsError && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-sm text-amber-700 dark:text-amber-400">
          Data aset tidak dapat dimuat: {assetsError.message}
        </div>
      )}

      {/* Four numbers, two domains */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tiket Aktif"
          value={activeTickets}
          subtitle={`${openTickets} open · ${inProgressTickets} dikerjakan`}
          icon={<Inbox className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
        />
        <StatCard
          title="Tiket Selesai"
          value={resolvedTickets}
          subtitle={`${resolvedToday} selesai hari ini`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
        />
        <StatCard
          title="Aset Dipakai"
          value={assetsLoading ? '—' : assetsInUse}
          subtitle={assetsLoading ? 'memuat...' : `dari ${totalAssets} aset terdaftar`}
          icon={<Laptop className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50 dark:bg-indigo-900/30"
        />
        <StatCard
          title="Perlu Perhatian"
          value={assetsLoading ? '—' : assetsNeedingAttention}
          subtitle={assetsLoading ? 'memuat...' : `${assetsInMaintenance} maintenance · ${assetsDamaged} rusak/hilang`}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Ringkasan tiket: status, prioritas dan waktu penyelesaian jadi satu */}
        <div className="lg:col-span-2 liquid-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900 dark:text-white">Ringkasan Tiket</h3>
            <Link to="/tickets" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Lihat semua
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Status */}
            <div className="flex items-center gap-5">
              <div
                className="relative w-28 h-28 rounded-full shrink-0"
                style={{ background: donut }}
              >
                <div className="absolute inset-[14px] rounded-full bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalTickets}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">Total</div>
                </div>
              </div>
              <div className="flex-1 space-y-2 text-sm min-w-0">
                {STATUS_SLICES.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                      {s.label}
                    </span>
                    <span className="shrink-0">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {statusCounts[s.key]}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 ml-1.5">
                        {pct(statusCounts[s.key])}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prioritas + waktu penyelesaian */}
            <div className="flex flex-col justify-between gap-4">
              <div className="space-y-2">
                {priorities.map((p) => (
                  <div key={p.label} className="flex items-center gap-3 text-sm">
                    <span className="w-16 text-gray-600 dark:text-gray-300 shrink-0">{p.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p.bar} transition-all duration-500`}
                        style={{ width: `${Math.round((p.count / maxPriority) * 100)}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-semibold text-gray-900 dark:text-white">
                      {p.count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700/50">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Rata-rata waktu penyelesaian
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {avgResolution === null ? '—' : formatDuration(avgResolution)}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {durations.length === 0
                    ? 'belum ada tiket selesai yang tercatat durasinya'
                    : `dari ${durations.length} tiket selesai`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Aksi cepat */}
        <div className="liquid-card rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Aksi Cepat</h3>
          <div className="space-y-1">
            <QuickAction icon={Plus} label="Buat Tiket Baru" onClick={() => openNewTicketModal()} />
            <QuickAction icon={Package} label="Kelola Aset" onClick={() => navigate('/assets')} />
            <QuickAction icon={Users} label="Direktori Karyawan" onClick={() => navigate('/employees')} />
            <QuickAction icon={BookOpen} label="Knowledge Base" onClick={() => navigate('/knowledge-base')} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tiket terbaru */}
        <div className="lg:col-span-2 liquid-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Tiket Terbaru</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-transparent text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100/50 dark:border-gray-700/50">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3 min-w-[180px]">Subjek</th>
                  <th className="px-5 py-3">Pelapor</th>
                  <th className="px-5 py-3">Prioritas</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Ditangani</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {recentTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                      Belum ada tiket pada rentang ini.
                    </td>
                  </tr>
                ) : recentTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate('/tickets')}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {ticket.ticket_number}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{ticket.issue_title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{ticket.issue_category}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {initialsOf(ticket.reporter?.full_name)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {ticket.reporter?.full_name || 'Tidak diketahui'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><PriorityBadge priority={ticket.priority_level} /></td>
                    <td className="px-5 py-3"><StatusBadge status={ticket.ticket_status} /></td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                      {ticket.assignee?.full_name ?? (
                        <span className="italic text-gray-400 dark:text-gray-500">Belum ditugaskan</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-center">
            <Link to="/tickets" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Lihat semua tiket <ChevronDown className="w-4 h-4 -rotate-90" />
            </Link>
          </div>
        </div>

        {/* Ringkasan aset */}
        <div className="liquid-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Aset per Status</h3>
            <Link to="/assets" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Lihat semua
            </Link>
          </div>
          {assetsLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
          ) : (
            <div className="space-y-3">
              {assetStatusCounts.map(({ status, count }) => (
                <div key={status} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-gray-600 dark:text-gray-300 shrink-0 truncate">
                    {ASSET_STATUS_CONFIG[status]?.label ?? status}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${ASSET_BAR_COLORS[status] ?? 'bg-gray-400'} transition-all duration-500`}
                      style={{ width: `${Math.round((count / maxAssetStatus) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-semibold text-gray-900 dark:text-white">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helpers

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="liquid-card rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">{title}</h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
      </div>
      <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 -rotate-90 group-hover:text-gray-600 transition-colors" />
    </button>
  );
}
