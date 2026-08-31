import { useState } from 'react';
import { 
  Download, 
  Ticket, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ChevronDown,
  MoreVertical,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReports } from '../lib/useReports';

export default function ITReports() {
  const { metrics, loading } = useReports();
  const { totalTickets, resolvedTickets, avgResolutionTime, slaCompliance, statusCounts, categoryCounts, topAgents } = metrics;

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track performance and analyze IT support data</p>
          </div>
          <div>
            <button className="flex items-center gap-2 px-4 py-2 liquid-card rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-800/50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto hide-scrollbar">
          <button className="py-3 border-b-2 border-blue-600 text-blue-600 font-medium text-sm whitespace-nowrap">Overview</button>
          <button className="py-3 border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 font-medium text-sm whitespace-nowrap transition-colors">Tickets</button>
          <button className="py-3 border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 font-medium text-sm whitespace-nowrap transition-colors">SLA</button>
          <button className="py-3 border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 font-medium text-sm whitespace-nowrap transition-colors">Agents</button>
          <button className="py-3 border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 font-medium text-sm whitespace-nowrap transition-colors">Knowledge Base</button>
          <button className="py-3 border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 font-medium text-sm whitespace-nowrap transition-colors">Customer Satisfaction</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Tickets" value={totalTickets.toString()} trend="+18%" icon={Ticket} color="text-blue-600" bg="bg-blue-50" />
          <StatCard title="Resolved Tickets" value={resolvedTickets.toString()} trend="+21%" icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
          <StatCard title="Average Response Time" value={avgResolutionTime} trend="+18%" icon={Clock} color="text-purple-600" bg="bg-purple-50" />
          <StatCard title="SLA Compliance" value={`${slaCompliance}%`} trend="+6%" icon={ShieldCheck} color="text-orange-600" bg="bg-orange-50" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Tickets Over Time */}
          <div className="liquid-card rounded-xl p-5">
             <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Tickets Over Time</h3>
              <button className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 hover:text-gray-700 dark:text-gray-200">
                Last 7 Days <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="h-48 flex items-end relative pb-6 px-2">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                 <polyline points="0,35 15,30 30,15 45,25 60,35 75,30 90,10 100,15" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                 {/* Points */}
                 <circle cx="0" cy="35" r="1.5" fill="#3B82F6" />
                 <circle cx="15" cy="30" r="1.5" fill="#3B82F6" />
                 <circle cx="30" cy="15" r="1.5" fill="#3B82F6" />
                 <circle cx="45" cy="25" r="1.5" fill="#3B82F6" />
                 <circle cx="60" cy="35" r="1.5" fill="#3B82F6" />
                 <circle cx="75" cy="30" r="1.5" fill="#3B82F6" />
                 <circle cx="90" cy="10" r="1.5" fill="#3B82F6" />
              </svg>
              {/* X Axis Labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                 <span>May 21</span><span>May 22</span><span>May 23</span><span>May 24</span><span>May 25</span><span>May 26</span><span>May 27</span>
              </div>
            </div>
          </div>

          {/* Tickets by Status */}
          <div className="liquid-card rounded-xl p-5">
             <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Tickets by Status</h3>
              <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
            </div>
             <div className="flex items-center gap-8 h-48">
              <div className="relative w-36 h-36 rounded-full border-[14px] border-blue-500 flex items-center justify-center mx-auto" style={{ borderRightColor: '#F59E0B', borderBottomColor: '#10B981', borderLeftColor: '#8B5CF6'}}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalTickets}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                </div>
              </div>
              <div className="flex-1 space-y-3 text-sm">
                <StatusLegend color="bg-blue-500" label="Open" count={statusCounts['Open']} percentage={totalTickets ? `${Math.round((statusCounts['Open']/totalTickets)*100)}%` : '0%'} />
                <StatusLegend color="bg-yellow-500" label="In Progress" count={statusCounts['In Progress']} percentage={totalTickets ? `${Math.round((statusCounts['In Progress']/totalTickets)*100)}%` : '0%'} />
                <StatusLegend color="bg-purple-500" label="Pending" count={statusCounts['Pending']} percentage={totalTickets ? `${Math.round((statusCounts['Pending']/totalTickets)*100)}%` : '0%'} />
                <StatusLegend color="bg-green-500" label="Resolved" count={statusCounts['Resolved']} percentage={totalTickets ? `${Math.round((statusCounts['Resolved']/totalTickets)*100)}%` : '0%'} />
                <StatusLegend color="bg-gray-400" label="Closed" count={statusCounts['Closed']} percentage={totalTickets ? `${Math.round((statusCounts['Closed']/totalTickets)*100)}%` : '0%'} />
              </div>
            </div>
          </div>

          {/* Tickets by Category */}
          <div className="liquid-card rounded-xl p-5">
             <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white">Tickets by Category</h3>
              <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <HBar label="Hardware" value={categoryCounts['Hardware'].toString()} percentage={totalTickets ? `${Math.round((categoryCounts['Hardware']/totalTickets)*100)}%` : '0%'} width={totalTickets ? `${Math.round((categoryCounts['Hardware']/totalTickets)*100)}%` : '0%'} color="bg-blue-600" />
              <HBar label="Software" value={categoryCounts['Software'].toString()} percentage={totalTickets ? `${Math.round((categoryCounts['Software']/totalTickets)*100)}%` : '0%'} width={totalTickets ? `${Math.round((categoryCounts['Software']/totalTickets)*100)}%` : '0%'} color="bg-blue-600" />
              <HBar label="Network" value={categoryCounts['Network'].toString()} percentage={totalTickets ? `${Math.round((categoryCounts['Network']/totalTickets)*100)}%` : '0%'} width={totalTickets ? `${Math.round((categoryCounts['Network']/totalTickets)*100)}%` : '0%'} color="bg-blue-600" />
              <HBar label="Accounts & Access" value={categoryCounts['Account & Access'].toString()} percentage={totalTickets ? `${Math.round((categoryCounts['Account & Access']/totalTickets)*100)}%` : '0%'} width={totalTickets ? `${Math.round((categoryCounts['Account & Access']/totalTickets)*100)}%` : '0%'} color="bg-blue-600" />
              <HBar label="Other" value={categoryCounts['Other'].toString()} percentage={totalTickets ? `${Math.round((categoryCounts['Other']/totalTickets)*100)}%` : '0%'} width={totalTickets ? `${Math.round((categoryCounts['Other']/totalTickets)*100)}%` : '0%'} color="bg-blue-600" />
            </div>
          </div>

          {/* Average Response & Resolution Time */}
          <div className="liquid-card rounded-xl p-5">
             <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Average Response & Resolution Time</h3>
              <button className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 hover:text-gray-700 dark:text-gray-200">
                Last 7 Days <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-4 text-xs font-medium text-gray-600">
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Response Time (avg)</div>
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Resolution Time (avg)</div>
            </div>
            <div className="h-40 flex items-end relative pb-6 px-2">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                 {/* Resolution Time (Green, higher) */}
                 <polyline points="0,15 15,13 30,14 45,12 60,15 75,18 90,19 100,18" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                 <circle cx="45" cy="12" r="1.5" fill="#10B981" />
                 
                 {/* Response Time (Blue, lower) */}
                 <polyline points="0,30 15,28 30,29 45,26 60,29 75,32 90,30 100,29" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                 <circle cx="45" cy="26" r="1.5" fill="#3B82F6" />
              </svg>
               {/* Y Axis Grid lines hint */}
               <div className="absolute left-0 top-0 bottom-6 w-full flex flex-col justify-between border-l border-gray-100 dark:border-gray-700/50">
                 <div className="w-full border-t border-gray-100 dark:border-gray-700/50 border-dashed"></div>
                 <div className="w-full border-t border-gray-100 dark:border-gray-700/50 border-dashed"></div>
                 <div className="w-full border-t border-gray-100 dark:border-gray-700/50 border-dashed"></div>
               </div>
               <div className="absolute -left-4 top-0 bottom-6 flex flex-col justify-between text-[10px] text-gray-400 dark:text-gray-500 py-1 items-end">
                 <span>5h</span><span>3h</span><span>1h</span><span>0h</span>
               </div>
               {/* X Axis */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 dark:text-gray-500 pl-2">
                 <span>May 21</span><span>May 22</span><span>May 23</span><span>May 24</span><span>May 25</span><span>May 26</span><span>May 27</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Agents */}
        <div className="liquid-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Performing Agents</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700/50">
                <tr>
                  <th className="px-5 py-3">Agent</th>
                  <th className="px-5 py-3 text-center">Tickets Resolved</th>
                  <th className="px-5 py-3 text-center">Average Response Time</th>
                  <th className="px-5 py-3 text-center">Average Resolution Time</th>
                  <th className="px-5 py-3">SLA Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {topAgents.length > 0 ? (
                  topAgents.map((agent, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img src={agent.avatar} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700/50" />
                          <span className="font-medium text-gray-900 dark:text-white">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center font-medium text-gray-900 dark:text-white">{agent.resolved}</td>
                      <td className="px-5 py-3 text-center text-gray-700 dark:text-gray-200">{agent.avgResp}</td>
                      <td className="px-5 py-3 text-center text-gray-700 dark:text-gray-200">{agent.avgRes}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 dark:text-white w-8">{agent.sla}%</span>
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden max-w-[100px]">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${agent.sla}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">No agent data available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
            <Link to="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View full report <ChevronDown className="w-4 h-4 -rotate-90" />
            </Link>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full xl:w-72 space-y-6 shrink-0 flex flex-col">
        {/* Filters Panel */}
        <div className="liquid-card rounded-xl p-5">
           <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Filters</h3>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">Reset</button>
          </div>
          <div className="space-y-4">
            <FilterSection title="Date Range">
               <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <input type="text" value="May 21, 2025 - May 27, 2025" readOnly className="w-full pl-9 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 cursor-pointer" />
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </FilterSection>

            <FilterSection title="Group By">
              <Dropdown label="Day" />
            </FilterSection>
            
            <FilterSection title="Category">
              <Dropdown label="All Categories" />
            </FilterSection>
            
            <FilterSection title="Status">
              <Dropdown label="All Statuses" />
            </FilterSection>
            
            <FilterSection title="Priority">
              <Dropdown label="All Priorities" />
            </FilterSection>
            
            <FilterSection title="Agent">
              <Dropdown label="All Agents" />
            </FilterSection>
            
            <FilterSection title="Department">
              <Dropdown label="All Departments" />
            </FilterSection>
            
            <div className="pt-2">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Report Downloads */}
        <div className="liquid-card rounded-xl p-5 flex-1 h-fit">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Report Downloads</h3>
          <div className="space-y-3">
             <DownloadItem title="Tickets Overview (PDF)" date="May 27, 2025, 10:30 AM" />
             <DownloadItem title="SLA Report (Excel)" date="May 26, 2025, 04:15 PM" />
             <DownloadItem title="Agent Performance (PDF)" date="May 25, 2025, 11:20 AM" />
          </div>
          <div className="mt-5 text-center">
             <Link to="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all reports</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers
function StatCard({ title, value, trend, icon: Icon, color, bg }: any) {
  return (
    <div className="liquid-card rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <span className="font-medium text-green-600 flex items-center">
          ↑ {trend}
        </span>
        <span className="text-gray-500 dark:text-gray-400">from last month</span>
      </div>
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

function HBar({ label, value, percentage, width, color }: any) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium mb-1.5">
        <span className="text-gray-700 dark:text-gray-200">{label}</span>
        <span className="text-gray-900 dark:text-white">{value} <span className="text-gray-400 dark:text-gray-500 font-normal">({percentage})</span></span>
      </div>
      <div className="w-full h-4 bg-gray-100 dark:bg-gray-700/50 rounded-sm overflow-hidden">
        <div className={`h-full ${color} rounded-sm`} style={{ width }}></div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{title}</label>
      {children}
    </div>
  );
}

function Dropdown({ label }: { label: string }) {
  return (
    <div className="relative">
      <button className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-800/50">
        <span>{label}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </button>
    </div>
  );
}

function DownloadItem({ title, date }: { title: string, date: string }) {
  return (
     <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:bg-gray-700/50 transition-colors rounded-lg group cursor-pointer">
       <div className="flex items-center gap-3">
         <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
           <FileText className="w-4 h-4" />
         </div>
         <div>
           <div className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{title}</div>
           <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{date}</div>
         </div>
       </div>
       <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 p-1 liquid-card rounded opacity-0 group-hover:opacity-100 transition-all">
         <Download className="w-3.5 h-3.5" />
       </button>
     </div>
  );
}
