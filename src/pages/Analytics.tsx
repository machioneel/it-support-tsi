import { useState, useEffect, useMemo } from 'react';
import type { Ticket, Company, IssueCategory, ReportedVia } from '@/lib/types';
import { fetchTickets, fetchCompanies } from '@/lib/supabase';
import { MOCK_TICKETS, MOCK_COMPANIES } from '@/lib/mockData';
import { STATUS_ORDER, PRIORITY_ORDER } from '@/lib/types';
import { formatDuration } from '@/lib/utils';
import { TrendingUp, Clock, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

export default function Analytics() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCompany, setFilterCompany] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const [t, c] = await Promise.all([fetchTickets(), fetchCompanies()]);
        setTickets(t.length > 0 ? t : MOCK_TICKETS);
        setCompanies(c.length > 0 ? c : MOCK_COMPANIES);
      } catch {
        setTickets(MOCK_TICKETS);
        setCompanies(MOCK_COMPANIES);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filterCompany === 'all') return tickets;
    return tickets.filter((t) => t.company_id === filterCompany);
  }, [tickets, filterCompany]);

  const companyMap = useMemo(() => {
    const m: Record<string, string> = {};
    companies.forEach((c) => (m[c.id] = c.company_name));
    return m;
  }, [companies]);

  // Metrics
  const openCount = filtered.filter((t) => t.ticket_status === 'Open' || t.ticket_status === 'In Progress' || t.ticket_status === 'Pending').length;
  const closedCount = filtered.filter((t) => t.ticket_status === 'Resolved' || t.ticket_status === 'Closed').length;
  const avgResolution = useMemo(() => {
    const resolved = filtered.filter((t) => t.resolution_duration_minutes != null);
    if (resolved.length === 0) return 0;
    return Math.round(resolved.reduce((s, t) => s + (t.resolution_duration_minutes ?? 0), 0) / resolved.length);
  }, [filtered]);

  // Ticket volume: open vs closed
  const volumeData = useMemo(() => {
    return STATUS_ORDER.map((s) => ({
      status: s,
      count: filtered.filter((t) => t.ticket_status === s).length,
    }));
  }, [filtered]);

  // Company frequency
  const companyData = useMemo(() => {
    return companies.map((c) => ({
      name: c.company_name,
      short: c.company_name.includes('TSI') ? 'PT TSI' : 'PT DMS',
      count: tickets.filter((t) => t.company_id === c.id).length,
    }));
  }, [companies, tickets]);

  // Category distribution
  const categoryData = useMemo(() => {
    const cats: IssueCategory[] = ['Hardware', 'Software', 'Network', 'Account & Access'];
    return cats.map((c) => ({
      name: c,
      count: filtered.filter((t) => t.issue_category === c).length,
    }));
  }, [filtered]);

  // Channel distribution
  const channelData = useMemo(() => {
    const channels: ReportedVia[] = ['Web Portal', 'WhatsApp Direct', 'Phone Call', 'Walk-In'];
    return channels.map((c) => ({
      name: c,
      count: filtered.filter((t) => t.reported_via === c).length,
    }));
  }, [filtered]);

  // Priority distribution
  const priorityData = useMemo(() => {
    return PRIORITY_ORDER.map((p) => ({
      name: p,
      count: filtered.filter((t) => t.priority_level === p).length,
    }));
  }, [filtered]);

  const maxVolume = Math.max(...volumeData.map((d) => d.count), 1);
  const maxCompany = Math.max(...companyData.map((d) => d.count), 1);
  const maxCategory = Math.max(...categoryData.map((d) => d.count), 1);
  const maxChannel = Math.max(...channelData.map((d) => d.count), 1);
  const maxPriority = Math.max(...priorityData.map((d) => d.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Analytical Report Center</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Insight dan metrik performa tiket
          </p>
        </div>
        <div className="relative">
          <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-2xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white dark:bg-gray-800 cursor-pointer"
          >
            <option value="all">Semua Perusahaan</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<AlertCircle className="w-5 h-5" />}
          label="Tiket Terbuka"
          value={openCount}
          color="indigo"
        />
        <KpiCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Tiket Selesai"
          value={closedCount}
          color="emerald"
        />
        <KpiCard
          icon={<Clock className="w-5 h-5" />}
          label="Rata-rata Resolusi"
          value={formatDuration(avgResolution)}
          color="amber"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Tiket"
          value={filtered.length}
          color="slate"
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ticket Volume */}
        <ChartCard title="Volume Tiket (Open vs Closed)">
          <div className="space-y-3">
            {volumeData.map((d) => (
              <div key={d.status} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-24 flex-shrink-0">{d.status}</span>
                <div className="flex-1 h-7 bg-slate-50 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: `${(d.count / maxVolume) * 100}%`,
                      backgroundColor:
                        d.status === 'Resolved' || d.status === 'Closed'
                          ? '#10b981'
                          : d.status === 'Pending'
                          ? '#f59e0b'
                          : d.status === 'In Progress'
                          ? '#6366f1'
                          : '#94a3b8',
                    }}
                  >
                    <span className="text-xs font-medium text-white">{d.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Company Frequency */}
        <ChartCard title="Frekuensi per Perusahaan">
          <div className="space-y-4">
            {companyData.map((d) => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-600">{d.short}</span>
                  <span className="text-xs font-medium text-slate-800">{d.count}</span>
                </div>
                <div className="h-8 bg-slate-50 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                    style={{ width: `${(d.count / maxCompany) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Category Distribution */}
        <ChartCard title="Distribusi Kategori">
          <div className="flex items-end justify-around h-40 gap-4 pt-4">
            {categoryData.map((d, i) => (
              <div key={d.name} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-slate-700">{d.count}</span>
                <div className="w-full bg-slate-50 rounded-lg overflow-hidden flex items-end" style={{ height: '100px' }}>
                  <div
                    className="w-full rounded-lg transition-all duration-500"
                    style={{
                      height: `${(d.count / maxCategory) * 100}%`,
                      backgroundColor: ['#6366f1', '#8b5cf6', '#0ea5e9', '#14b8a6'][i],
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500 text-center leading-tight">
                  {d.name}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Channel Distribution */}
        <ChartCard title="Distribusi Kanal Source">
          <div className="space-y-3">
            {channelData.map((d, i) => {
              const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899'];
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-36 flex-shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }} />
                    <span className="text-xs text-slate-500">{d.name}</span>
                  </div>
                  <div className="flex-1 h-6 bg-slate-50 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${(d.count / maxChannel) * 100}%`,
                        backgroundColor: colors[i],
                      }}
                    >
                      <span className="text-xs font-medium text-white">{d.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Priority Distribution */}
        <ChartCard title="Distribusi Prioritas" className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {priorityData.map((d, i) => {
              const colors = ['bg-red-500', 'bg-orange-500', 'bg-blue-500', 'bg-slate-400'];
              const textColors = ['text-red-700', 'text-orange-700', 'text-blue-700', 'text-slate-600'];
              return (
                <div key={d.name} className="bg-slate-50 rounded-2xl p-4 text-center">
                  <div className={`text-2xl font-bold ${textColors[i]}`}>{d.count}</div>
                  <div className="text-xs text-slate-500 mt-1">{d.name}</div>
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[i]} transition-all duration-500`}
                      style={{ width: `${(d.count / maxPriority) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'indigo' | 'emerald' | 'amber' | 'slate';
}) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}
