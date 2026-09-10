import { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Download, 
  Search, 
  Filter, 
  ChevronDown, 
  MoreVertical,
  ShieldCheck,
  UserCog,
  Shield,
  Edit3,
  MessageSquare,
  Ticket,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useUsers } from '@/hooks/useUsers';
import AddUserModal from '@/features/users/components/AddUserModal';
import type { User } from '@/types/index';

interface ITUsersProps {
  /** Rendered inside the Settings page: use a section header and stack the detail panel. */
  embedded?: boolean;
}

export default function ITUsers({ embedded = false }: ITUsersProps) {
  const { users, loading, error, refreshUsers } = useUsers();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('Overview');

  const [roleFilter, setRoleFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Set the first user as default selected when users load
  if (users.length > 0 && !selectedUser && !loading) {
    setSelectedUser(users[0]);
  }

  const filteredUsers = users.filter(user => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!user.full_name.toLowerCase().includes(q) && 
          !user.email.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (roleFilter !== 'All' && user.role !== roleFilter) {
      return false;
    }
    return true;
  });

  const totalUsers = users.length;
  const techniciansCount = users.filter(u => u.role === 'Technician').length;
  const adminsCount = users.filter(u => u.role === 'Admin').length;
  const activeUsersCount = users.length; // Assuming all are active for now

  const totalFilteredUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalFilteredUsers / rowsPerPage);
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (validCurrentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalFilteredUsers);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className={embedded ? 'flex flex-col gap-6' : 'flex flex-col lg:flex-row gap-6'}>
      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            {embedded ? (
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Users</h2>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage IT staff accounts and their access to the IT Support system</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 liquid-card rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-800/50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button 
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={totalUsers.toString()} trend="+" icon={Users} color="text-blue-600" bg="bg-blue-50" />
          <StatCard title="Technicians" value={techniciansCount.toString()} trend="=" icon={UserCog} color="text-green-600" bg="bg-green-50" />
          <StatCard title="Admins" value={adminsCount.toString()} trend="=" icon={Shield} color="text-purple-600" bg="bg-purple-50" />
          <StatCard title="Active Users" value={activeUsersCount.toString()} trend="=" icon={ShieldCheck} color="text-blue-600" bg="bg-blue-50" />
        </div>

        {/* Table Area */}
        <div className="liquid-card rounded-xl overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search users..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-2 liquid-card rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-800/50">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>Filter</span>
              </button>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                  className="pl-3 pr-8 py-2 liquid-card rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-800/50 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="All">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Technician">Technician</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-transparent text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100/50 dark:border-gray-700/50">
                <tr>
                  <th className="px-5 py-3 w-10"><input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" /></th>
                  <th className="px-5 py-3 min-w-[200px]">User</th>
                  <th className="px-5 py-3 min-w-[250px]">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Last Active</th>
                  <th className="px-5 py-3 text-right">Tickets</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {loading ? (
                  <tr><td colSpan={9} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">Loading users...</td></tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">No users match your filter.</td></tr>
                ) : paginatedUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-gray-50 dark:bg-gray-800/50 transition-colors cursor-pointer ${selectedUser?.id === user.id ? 'bg-blue-50/30' : ''}`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-5 py-3"><input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" onClick={(e) => e.stopPropagation()}/></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0">
                          {user.full_name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white truncate">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                      <div className="truncate max-w-[230px]">{user.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-gray-900 dark:text-white">Active</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">-</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-white">-</td>
                    <td className="px-5 py-3 text-center">
                      <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 p-1 rounded hover:bg-gray-100 dark:bg-gray-700/50 transition-colors">
                        <MoreVertical className="w-4 h-4 mx-auto" />
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
              <span>Rows per page:</span>
              <select 
                value={rowsPerPage} 
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-6">
              <span>{totalFilteredUsers === 0 ? 0 : startIndex + 1}-{endIndex} of {totalFilteredUsers}</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className={`w-7 h-7 rounded flex items-center justify-center ${validCurrentPage === pageNum ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-100 dark:bg-gray-700/50'}`}
                    >
                      {pageNum}
                    </button>
                   );
                })}

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages || totalPages === 0}
                  className="p-1 rounded hover:bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - User Details */}
      {selectedUser && (
        <div className={`liquid-card rounded-xl flex flex-col shrink-0 self-start ${embedded ? 'w-full' : 'w-full lg:w-80 sticky top-20'}`}>
          {/* Profile Header */}
          <div className="p-6 pb-4 flex flex-col items-center text-center relative border-b border-gray-100 dark:border-gray-700/50">
            <button className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
            
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-3xl">
                {selectedUser.full_name.charAt(0)}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2 justify-center">
              {selectedUser.full_name} <RoleBadge role={selectedUser.role} />
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
          </div>

          {/* Profile Tabs */}
          <div className="flex px-6 border-b border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => setActiveProfileTab('Overview')}
              className={`flex-1 py-3 border-b-2 font-medium text-sm text-center ${activeProfileTab === 'Overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveProfileTab('Activity')}
              className={`flex-1 py-3 border-b-2 font-medium text-sm text-center ${activeProfileTab === 'Activity' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}
            >
              Activity
            </button>
            <button 
              onClick={() => setActiveProfileTab('Tickets')}
              className={`flex-1 py-3 border-b-2 font-medium text-sm text-center ${activeProfileTab === 'Tickets' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}
            >
              Tickets
            </button>
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-250px)]">
            
            {activeProfileTab === 'Overview' && (
              <>
                {/* User Info */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">User Information</h3>
                    <button className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <InfoRow label="Full Name" value={selectedUser.full_name} />
                    <InfoRow label="Role" value={selectedUser.role} />
                    <InfoRow label="Division" value={selectedUser.division} />
                    <InfoRow label="Phone" value={selectedUser.contact_number || '-'} />
                    <InfoRow label="Joined" value={selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '-'} />
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <span className="text-gray-900 dark:text-white font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700/50"></div>

                {/* Permissions */}
                <div>
                   <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Permissions</h3>
                   <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">Full system access</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Can manage all settings, users, and tickets.</p>
                      </div>
                   </div>
                </div>
              </>
            )}

            {activeProfileTab === 'Activity' && (
              <>
                {/* Recent Activity */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Activity</h3>
                    <Link to="#" className="text-blue-600 hover:text-blue-700 text-xs font-medium">View all</Link>
                  </div>
                  <div className="space-y-4">
                    <ActivityItem icon={Ticket} text="Updated ticket #TKT-1287" time="2 min ago" color="text-blue-600 bg-blue-50" />
                    <ActivityItem icon={MessageSquare} text="Commented on ticket #TKT-1286" time="15 min ago" color="text-purple-600 bg-purple-50" />
                    <ActivityItem icon={UserCog} text="Assigned ticket #TKT-1285" time="1 hour ago" color="text-blue-600 bg-blue-50" />
                  </div>
                </div>
              </>
            )}

            {activeProfileTab === 'Tickets' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Tickets by User</h3>
                    <Link to="#" className="text-blue-600 hover:text-blue-700 text-xs font-medium">View all</Link>
                  </div>
                  <div className="space-y-3">
                     <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">INC-20260831-001</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400">Software • Medium</p>
                       </div>
                       <span className="px-2 py-1 text-[10px] font-bold rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">In Progress</span>
                     </div>
                     <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">INC-20260831-002</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400">Hardware • High</p>
                       </div>
                       <span className="px-2 py-1 text-[10px] font-bold rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">Resolved</span>
                     </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}
      
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSuccess={refreshUsers}
      />
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

function RoleBadge({ role }: { role: string }) {
  const getColors = () => {
    switch(role) {
      case 'Admin': return 'text-purple-600 border-purple-200 bg-purple-50';
      case 'Technician': return 'text-blue-600 border-blue-200 bg-blue-50';
      default: return 'text-gray-600 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50';
    }
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border ${getColors()}`}>
      {role}
    </span>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-900 dark:text-white font-medium text-right">{value}</span>
    </div>
  );
}

function ActivityItem({ icon: Icon, text, time, color }: any) {
  return (
    <div className="flex items-start justify-between gap-3 group">
      <div className="flex gap-3">
        <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium leading-tight pt-1 group-hover:text-blue-600 transition-colors cursor-pointer">{text}</span>
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap pt-1">{time}</span>
    </div>
  );
}

