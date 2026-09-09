import { useState } from 'react';
import { 
  Ticket, 
  Hourglass, 
  Play, 
  CheckCircle2, 
  Filter, 
  ChevronDown,
  MoreVertical,
  Plus,
  BookOpen,
  Bug,
  Key,
  MessageSquare,
  Package,
  Laptop,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useTickets } from '@/lib/useTickets';
import { useAssets } from '@/lib/useAssets';
import { STATUS_CONFIG as ASSET_STATUS_CONFIG, ASSET_STATUS_VALUES, getCategoryIcon } from '@/lib/assetConfig';



const ASSET_BAR_COLORS: Record<string, string> = {
  active:      'bg-emerald-500',
  in_use:      'bg-blue-500',
  maintenance: 'bg-amber-500',
  retired:     'bg-gray-400',
  lost:        'bg-red-500',
};

export default function ITDashboard() {
  const { tickets, loading, error } = useTickets();
  const { assets, loading: assetsLoading, error: assetsError } = useAssets();
  const navigate = useNavigate();
  const { openNewTicketModal } = useOutletContext<any>();

  const [timeFilterOpen, setTimeFilterOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('This week');
  
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;
  }

  const filteredTickets = tickets.filter(t => {
    // Status filter
    if (statusFilter !== 'All' && t.ticket_status !== statusFilter) return false;
    
    // Time filter
    const ticketDate = new Date(t.created_at);
    const now = new Date();
    if (timeRange === 'This week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (ticketDate < oneWeekAgo) return false;
    } else if (timeRange === 'This month') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (ticketDate < oneMonthAgo) return false;
    }
    return true;
  });

  const totalTickets = filteredTickets.length;
  const openTickets = filteredTickets.filter(t => t.ticket_status === 'Open').length;
  const inProgressTickets = filteredTickets.filter(t => t.ticket_status === 'In Progress').length;
  
  const today = new Date().toISOString().split('T')[0];
  const resolvedToday = filteredTickets.filter(t => t.ticket_status === 'Resolved' && t.finished_at?.startsWith(today)).length;

  const recentTickets = filteredTickets.slice(0, 5);

  const pendingTickets = filteredTickets.filter(t => t.ticket_status === 'Pending').length;
  const resolvedTickets = filteredTickets.filter(t => t.ticket_status === 'Resolved' || t.ticket_status === 'Closed').length;

  const openPct = totalTickets ? Math.round((openTickets / totalTickets) * 100) : 0;
  const inProgressPct = totalTickets ? Math.round((inProgressTickets / totalTickets) * 100) : 0;
  const pendingPct = totalTickets ? Math.round((pendingTickets / totalTickets) * 100) : 0;
  const resolvedPct = totalTickets ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

  const criticalPriority = filteredTickets.filter(t => t.priority_level === 'P1 - Critical').length;
  const highPriority = filteredTickets.filter(t => t.priority_level === 'P2 - High').length;
  const mediumPriority = filteredTickets.filter(t => t.priority_level === 'P3 - Medium').length;
  const lowPriority = filteredTickets.filter(t => t.priority_level === 'P4 - Low').length;

  const maxPriority = Math.max(criticalPriority, highPriority, mediumPriority, lowPriority, 1);

  // --- Assets ---
  const totalAssets = assets.length;
  const assetsInUse = assets.filter(a => a.status === 'in_use').length;
  const assetsInMaintenance = assets.filter(a => a.status === 'maintenance').length;
  const assetsNeedingAttention = assets.filter(
    a => a.condition === 'damaged' || a.status === 'lost'
  ).length;

  const assetStatusCounts = ASSET_STATUS_VALUES.map(status => ({
    status,
    count: assets.filter(a => a.status === status).length,
  }));

  const recentAssets = assets.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of IT Support Tickets</p>
        </div>
        <div className="flex items-center gap-3 relative">
          {/* Status Filter */}
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
                {['All', 'Open', 'In Progress', 'Pending', 'Resolved'].map(s => (
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
          
          {/* Time Filter */}
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
                {['This week', 'This month', 'All time'].map(t => (
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Tickets" 
          value={totalTickets.toString()} 
          trend="+16%" 
          trendUp={true} 
          icon={<Ticket className="w-5 h-5 text-blue-600" />} 
          iconBg="bg-blue-50"
        />
        <StatCard 
          title="Open Tickets" 
          value={openTickets.toString()} 
          trend="+8%" 
          trendUp={true} 
          icon={<Hourglass className="w-5 h-5 text-yellow-600" />} 
          iconBg="bg-yellow-50"
        />
        <StatCard 
          title="In Progress" 
          value={inProgressTickets.toString()} 
          trend="+5%" 
          trendUp={true} 
          icon={<Play className="w-5 h-5 text-blue-600 ml-0.5" />} 
          iconBg="bg-blue-50"
        />
        <StatCard 
          title="Resolved" 
          value={resolvedToday.toString()} 
          trend="+28%" 
          trendUp={true} 
          icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} 
          iconBg="bg-green-50"
        />
      </div>

      {/* IT Assets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">IT Assets</h2>
          <Link to="/assets" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all assets <ChevronDown className="w-4 h-4 -rotate-90" />
          </Link>
        </div>

        {assetsError && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-sm text-amber-700 dark:text-amber-400">
            Could not load assets: {assetsError.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Assets"
            value={assetsLoading ? '—' : totalAssets.toString()}
            subtitle="in the register"
            icon={<Package className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-50"
          />
          <StatCard
            title="In Use"
            value={assetsLoading ? '—' : assetsInUse.toString()}
            subtitle={totalAssets ? `of ${totalAssets} assets` : 'no assets yet'}
            icon={<Laptop className="w-5 h-5 text-indigo-600" />}
            iconBg="bg-indigo-50"
          />
          <StatCard
            title="Maintenance"
            value={assetsLoading ? '—' : assetsInMaintenance.toString()}
            subtitle="currently being serviced"
            icon={<Wrench className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-50"
          />
          <StatCard
            title="Needs Attention"
            value={assetsLoading ? '—' : assetsNeedingAttention.toString()}
            subtitle="damaged or lost"
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
            iconBg="bg-red-50"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tickets by Status */}
        <div className="liquid-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Tickets by Status</h3>
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-6">
            {/* CSS Donut Chart Mockup */}
            <div className="relative w-32 h-32 rounded-full border-[12px] border-blue-500 flex items-center justify-center shadow-inner" style={{ borderRightColor: '#F59E0B', borderBottomColor: '#10B981', borderLeftColor: '#8B5CF6'}}>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalTickets}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              </div>
            </div>
            <div className="flex-1 space-y-3 text-sm">
              <StatusLegend color="bg-blue-500" label="Open" count={openTickets.toString()} percentage={`${openPct}%`} />
              <StatusLegend color="bg-yellow-500" label="In Progress" count={inProgressTickets.toString()} percentage={`${inProgressPct}%`} />
              <StatusLegend color="bg-purple-500" label="Pending" count={pendingTickets.toString()} percentage={`${pendingPct}%`} />
              <StatusLegend color="bg-green-500" label="Resolved" count={resolvedTickets.toString()} percentage={`${resolvedPct}%`} />
            </div>
          </div>
        </div>

        {/* Tickets by Priority */}
        <div className="liquid-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">Tickets by Priority</h3>
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
          </div>
          <div className="flex items-end justify-between h-32 px-4">
            <BarColumn height={`${Math.round((criticalPriority/maxPriority)*100)}%`} color="bg-red-500" label="Critical" value={criticalPriority.toString()} />
            <BarColumn height={`${Math.round((highPriority/maxPriority)*100)}%`} color="bg-orange-400" label="High" value={highPriority.toString()} />
            <BarColumn height={`${Math.round((mediumPriority/maxPriority)*100)}%`} color="bg-blue-400" label="Medium" value={mediumPriority.toString()} />
            <BarColumn height={`${Math.round((lowPriority/maxPriority)*100)}%`} color="bg-gray-400" label="Low" value={lowPriority.toString()} />
          </div>
        </div>

        {/* Average Response Time */}
        <div className="liquid-card rounded-xl p-5">
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Average Response Time</h3>
          </div>
          <div className="mb-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">2h 15m</div>
            <div className="text-sm text-green-600 font-medium flex items-center gap-1 mt-1">
               <span>↓ 18%</span>
               <span className="text-gray-500 dark:text-gray-400 font-normal">from last week</span>
            </div>
          </div>
          {/* Simple SVG Line Chart Mockup */}
          <div className="h-16 w-full flex items-end">
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <path d="M0,20 C20,25 30,10 50,15 C70,20 80,5 100,0" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="100" cy="0" r="2" fill="#3B82F6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets Table */}
        <div className="lg:col-span-2 liquid-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Tickets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-transparent text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100/50 dark:border-gray-700/50">
                <tr>
                  <th className="px-5 py-3 w-10"><input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" /></th>
                  <th className="px-5 py-3">Ticket ID</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Requester</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3">Assignee</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {recentTickets.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">No tickets found.</td></tr>
                ) : recentTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:bg-gray-800/50 transition-colors group">
                    <td className="px-5 py-3"><input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" /></td>
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{ticket.ticket_number}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{ticket.issue_title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{ticket.issue_category}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${ticket.reporter?.full_name?.split(' ')[0] || 'User'}`} className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700/50" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{ticket.reporter?.full_name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{ticket.reporter?.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={ticket.priority_level} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={ticket.ticket_status} />
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{new Date(ticket.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {ticket.assignee ? (
                          <>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${ticket.assignee.full_name.split(' ')[0]}`} className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700/50" />
                            <span className="font-medium text-gray-900 dark:text-white">{ticket.assignee.full_name}</span>
                          </>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic text-sm">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
            <Link to="/tickets" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all tickets <ChevronDown className="w-4 h-4 -rotate-90" />
            </Link>
          </div>
        </div>

        {/* Right Sidebar panels */}
        <div className="space-y-6">
          <div className="liquid-card rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-1">
              <QuickAction icon={Plus} label="Create New Ticket" onClick={() => openNewTicketModal()} />
              <QuickAction icon={BookOpen} label="Knowledge Base" onClick={() => navigate('/knowledge-base')} />
              <QuickAction icon={Bug} label="Report a Bug" onClick={() => window.location.href='mailto:it@company.com?subject=Bug Report'} />
              <QuickAction icon={Key} label="Request Access" onClick={() => window.location.href='mailto:it@company.com?subject=Access Request'} />
            </div>
          </div>

          <div className="liquid-card rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Check our <button onClick={() => navigate('/knowledge-base')} className="text-blue-600 hover:underline">knowledge base</button><br/>
              or contact IT Support.
            </p>
            <button 
              onClick={() => window.location.href='mailto:it@company.com?subject=Help Request'}
              className="flex items-center justify-center gap-2 w-full py-2 liquid-card rounded-lg text-sm font-medium text-blue-600 hover:bg-gray-50 dark:bg-gray-800/50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>
      </div>

      {/* Assets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Assets Table */}
        <div className="lg:col-span-2 liquid-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Assets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-transparent text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100/50 dark:border-gray-700/50">
                <tr>
                  <th className="px-5 py-3">Asset Tag</th>
                  <th className="px-5 py-3">Asset</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Condition</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {assetsLoading ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">Loading assets...</td></tr>
                ) : recentAssets.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">No assets recorded yet.</td></tr>
                ) : recentAssets.map((asset) => {
                  const statusCfg = ASSET_STATUS_CONFIG[asset.status];
                  const CategoryIcon = getCategoryIcon(asset.category);
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50 dark:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{asset.asset_tag}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 flex items-center justify-center shrink-0">
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">{asset.asset_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{asset.brand || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-400 capitalize">{asset.category}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-400 capitalize">{asset.condition || '-'}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{asset.location || 'Unassigned'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border capitalize ${statusCfg?.classes ?? 'text-gray-600 bg-gray-50 border-gray-200 dark:border-gray-700'}`}>
                          {statusCfg?.label ?? asset.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
            <Link to="/assets" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all assets <ChevronDown className="w-4 h-4 -rotate-90" />
            </Link>
          </div>
        </div>

        {/* Assets by Status */}
        <div className="liquid-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Assets by Status</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{totalAssets} total</span>
          </div>
          {totalAssets === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
              No assets recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {assetStatusCounts.map(({ status, count }) => {
                const cfg = ASSET_STATUS_CONFIG[status];
                const pct = Math.round((count / totalAssets) * 100);
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-600 dark:text-gray-300">{cfg?.label ?? status}</span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {count} <span className="text-gray-400 dark:text-gray-500 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ASSET_BAR_COLORS[status] ?? 'bg-gray-400'} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components

function StatCard({ title, value, trend, trendUp, subtitle, icon, iconBg }: any) {
  return (
    <div className="liquid-card rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      {trend ? (
        <div className="flex items-center gap-1.5 text-sm">
          <span className={`font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className="text-gray-500 dark:text-gray-400">from last week</span>
        </div>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</div>
      )}
    </div>
  );
}

function StatusLegend({ color, label, count, percentage }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`}></span>
        <span className="text-gray-600">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
        <span className="text-gray-400 dark:text-gray-500 w-12 text-right">({percentage})</span>
      </div>
    </div>
  );
}

function BarColumn({ height, color, label, value }: any) {
  return (
    <div className="flex flex-col items-center justify-end w-12 h-full">
      <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{value}</div>
      <div className="flex-1 w-full flex items-end justify-center">
        <div className={`w-8 rounded-t-md ${color} transition-all duration-500`} style={{ height }}></div>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const getColors = () => {
    switch(priority) {
      case 'P1 - Critical': return 'text-red-600 border-red-200 bg-red-50/50';
      case 'P2 - High': return 'text-orange-600 border-orange-200 bg-orange-50/50';
      case 'P3 - Medium': return 'text-blue-600 border-blue-200 bg-blue-50/50';
      case 'P4 - Low': return 'text-gray-600 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50';
      default: return 'text-gray-600 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50';
    }
  };
  
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getColors()}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const getColors = () => {
    switch(status) {
      case 'Open': return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'In Progress': return 'text-blue-600 border-blue-200 bg-blue-50'; // Using blue for both as per screenshot
      case 'Pending': return 'text-purple-600 border-purple-200 bg-purple-50';
      case 'Resolved': return 'text-green-600 border-green-200 bg-green-50';
      case 'Active': return 'text-green-600 border-green-200 bg-green-50';
      case 'Inactive': return 'text-gray-600 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50';
      default: return 'text-gray-600 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50';
    }
  };
  
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getColors()}`}>
      {status}
    </span>
  );
}

function QuickAction({ icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 dark:bg-gray-800/50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
      </div>
      <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 -rotate-90 group-hover:text-gray-600 transition-colors" />
    </button>
  );
}

