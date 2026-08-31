import { useState } from 'react';
import { 
  Download, 
  Plus, 
  Search, 
  ChevronDown, 
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from './ITDashboard';
import { useTickets } from '@/lib/useTickets';
import TicketDetailModal from '@/components/TicketDetailModal';
import NewTicketModal from '@/components/NewTicketModal';
import type { Ticket } from '@/lib/types';

export default function ITTickets() {
  const { tickets, loading, error, refreshTickets } = useTickets();
  const [activeTab, setActiveTab] = useState('All Tickets');
  
  // Add search/filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  // Ticket modals states
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  const handleRowClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };
  
  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading tickets...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;
  }

  const tabs = [
    { name: 'All Tickets', count: tickets.length },
    { name: 'Open', count: tickets.filter(t => t.ticket_status === 'Open').length },
    { name: 'In Progress', count: tickets.filter(t => t.ticket_status === 'In Progress').length },
    { name: 'Pending', count: tickets.filter(t => t.ticket_status === 'Pending').length },
    { name: 'Resolved', count: tickets.filter(t => t.ticket_status === 'Resolved').length },
    { name: 'Closed', count: tickets.filter(t => t.ticket_status === 'Closed').length },
  ];

  const filteredTickets = tickets.filter(ticket => {
    // Tab filter
    if (activeTab !== 'All Tickets' && ticket.ticket_status !== activeTab) return false;
    
    // Dropdown filters
    if (filterStatus !== 'All' && ticket.ticket_status !== filterStatus) return false;
    if (filterPriority !== 'All' && ticket.priority_level !== filterPriority) return false;
    if (filterCategory !== 'All' && ticket.issue_category !== filterCategory) return false;
    if (filterAssignee !== 'All' && (ticket.assignee?.full_name || 'Unassigned') !== filterAssignee) return false;
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!ticket.ticket_number.toLowerCase().includes(q) && 
          !ticket.issue_title.toLowerCase().includes(q) && 
          !(ticket.reporter?.full_name?.toLowerCase().includes(q))) {
        return false;
      }
    }
    
    // Date Range filter
    if (filterStartDate) {
      if (new Date(ticket.created_at) < new Date(filterStartDate)) return false;
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setDate(end.getDate() + 1); // Make inclusive
      if (new Date(ticket.created_at) >= end) return false;
    }
    
    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('All');
    setFilterPriority('All');
    setFilterCategory('All');
    setFilterAssignee('All');
    setFilterStartDate('');
    setFilterEndDate('');
    setActiveTab('All Tickets');
    setCurrentPage(1);
  };

  // Get unique assignees for the filter dropdown
  const uniqueAssignees = Array.from(
    new Set(tickets.map(t => t.assignee?.full_name || 'Unassigned'))
  ).filter(Boolean).sort();

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and track all IT support tickets</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 liquid-card rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-800/50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              onClick={() => setIsNewTicketModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>
          </div>
        </div>

        {/* Tabs & Table Container */}
        <div className="liquid-card rounded-xl overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex items-center gap-6 px-5 border-b border-gray-200 dark:border-gray-700 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => { setActiveTab(tab.name); setCurrentPage(1); }}
                className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.name 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'
                }`}
              >
                <span>{tab.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.name ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-transparent text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100/50 dark:border-gray-700/50">
                <tr>
                  <th className="px-5 py-3 w-10"><input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" /></th>
                  <th className="px-5 py-3 whitespace-nowrap">Ticket ID</th>
                  <th className="px-5 py-3 min-w-[250px]">Subject</th>
                  <th className="px-5 py-3 min-w-[200px]">Requester</th>
                  <th className="px-5 py-3 whitespace-nowrap">Priority</th>
                  <th className="px-5 py-3 whitespace-nowrap">Status</th>
                  <th className="px-5 py-3 whitespace-nowrap">Updated</th>
                  <th className="px-5 py-3 whitespace-nowrap min-w-[180px]">Assignee</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {paginatedTickets.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">No tickets match your filter.</td></tr>
                ) : paginatedTickets.map((ticket) => (
                  <tr key={ticket.id} onClick={() => handleRowClick(ticket)} className="hover:bg-gray-50 dark:bg-gray-800/50 transition-colors group cursor-pointer">
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" /></td>
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{ticket.ticket_number}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900 dark:text-white line-clamp-2">{ticket.issue_title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap mt-1">{ticket.issue_category}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${ticket.reporter?.full_name?.split(' ')[0] || 'User'}`} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700/50 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">{ticket.reporter?.full_name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{ticket.reporter?.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <PriorityBadge priority={ticket.priority_level} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <StatusBadge status={ticket.ticket_status} />
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{new Date(ticket.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {ticket.assignee ? (
                          <>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${ticket.assignee.full_name.split(' ')[0]}`} className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700/50" />
                            <span className="font-medium text-gray-900 dark:text-white">{ticket.assignee.full_name}</span>
                          </>
                        ) : (
                          <>
                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 text-[10px]">?</div>
                            <span className="font-medium text-gray-500 dark:text-gray-400 italic">Unassigned</span>
                          </>
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

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-gray-100/50 dark:border-gray-700/50 bg-transparent flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span>Rows per page: {rowsPerPage}</span>
            </div>
            <div className="flex items-center gap-6">
              <span>
                {filteredTickets.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-
                {Math.min(currentPage * rowsPerPage, filteredTickets.length)} of {filteredTickets.length}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1 rounded hover:bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Filter */}
      <div className="w-full lg:w-72 liquid-card rounded-xl p-5 shrink-0 flex flex-col h-fit">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Filter</h3>
          <button 
            onClick={handleResetFilters}
            className="text-sm text-blue-600 font-medium hover:text-blue-700"
          >
            Reset
          </button>
        </div>

        <div className="space-y-5 flex-1">
          <FilterSection title="Search">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets..." 
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
              />
            </div>
          </FilterSection>

          <FilterSection title="Status">
            <select 
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </FilterSection>

          <FilterSection title="Priority">
            <select 
              value={filterPriority}
              onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="All">All Priority</option>
              <option value="P4 - Low">P4 - Low</option>
              <option value="P3 - Medium">P3 - Medium</option>
              <option value="P2 - High">P2 - High</option>
              <option value="P1 - Critical">P1 - Critical</option>
            </select>
          </FilterSection>

          <FilterSection title="Category">
             <select 
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="All">All Category</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Network">Network</option>
              <option value="Account & Access">Account & Access</option>
              <option value="Other">Other</option>
            </select>
          </FilterSection>

          <FilterSection title="Assignee">
             <select 
              value={filterAssignee}
              onChange={(e) => { setFilterAssignee(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="All">All Assignees</option>
              {uniqueAssignees.map(assignee => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>
          </FilterSection>

          <FilterSection title="Date Range">
             <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={filterStartDate}
                onChange={(e) => { setFilterStartDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-2 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
              />
              <span className="text-gray-400">-</span>
              <input 
                type="date" 
                value={filterEndDate}
                onChange={(e) => { setFilterEndDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-2 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
              />
            </div>
          </FilterSection>
        </div>
      </div>

      <NewTicketModal 
        isOpen={isNewTicketModalOpen} 
        onClose={() => setIsNewTicketModalOpen(false)} 
        onSuccess={refreshTickets} 
      />

      <TicketDetailModal 
        ticket={selectedTicket}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSuccess={refreshTickets}
      />
    </div>
  );
}

function FilterSection({ title, children }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{title}</label>
      {children}
    </div>
  );
}

