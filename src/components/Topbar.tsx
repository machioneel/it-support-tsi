import { Search, Plus, Bell, HelpCircle, Grid, Menu } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  isDarkMode: boolean;
  onNewTicketClick: () => void;
}

export default function Topbar({ sidebarOpen, setSidebarOpen, isDarkMode, onNewTicketClick }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <header className={`h-16 fixed top-4 left-4 right-4 lg:left-[18rem] lg:right-8 z-40 flex items-center justify-between px-4 sm:px-6 transition-colors duration-300 rounded-2xl liquid-panel`}>
      <div className="flex items-center gap-4 flex-1">
        <button 
          className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search */}
        <div className="hidden sm:flex items-center relative max-w-md w-full">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3" />
          <input 
            type="text" 
            placeholder="Search tickets, users, or keywords" 
            className="w-full pl-9 pr-12 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
          <div className="absolute right-3 flex items-center gap-1">
             <span className="text-xs text-gray-400 dark:text-gray-500 font-medium border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 bg-white dark:bg-gray-800">⌘</span>
             <span className="text-xs text-gray-400 dark:text-gray-500 font-medium border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 bg-white dark:bg-gray-800">K</span>
          </div>
        </div>
      </div>

      {/* Topbar Actions */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <button 
          onClick={onNewTicketClick}
          className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>

        <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} mx-1 hidden sm:block`}></div>

        {/* Notifications */}
        <div className="relative flex items-center justify-center">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative flex items-center justify-center ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'} transition-colors`}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white border-[1.5px] border-white">
              3
            </span>
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-10 w-64 liquid-panel rounded-xl shadow-lg z-50 text-gray-800 dark:text-gray-100 border-t-0">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700/50 font-semibold text-sm">Notifications</div>
              <div className="p-4 text-xs text-center text-gray-500 dark:text-gray-400">No new notifications</div>
            </div>
          )}
        </div>

        <button className={`flex items-center justify-center ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'} transition-colors hidden sm:flex`}>
          <HelpCircle className="w-5 h-5" />
        </button>
        <button className={`flex items-center justify-center ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'} transition-colors hidden sm:flex`}>
          <Grid className="w-5 h-5" />
        </button>

        <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} mx-1 hidden sm:block`}></div>

        {/* User Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 text-left"
          >
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              alt="User" 
              className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'} border`}
            />
            <div className="hidden sm:block">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700 dark:text-gray-200'} leading-tight`}>Agung</p>
              <p className={`text-[11px] ${isDarkMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'} leading-tight`}>IT Support</p>
            </div>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 mt-4 w-48 liquid-panel rounded-xl shadow-lg z-50 text-gray-800 dark:text-gray-100 border-t-0">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700/50 font-semibold text-sm">Agung Pratama</div>
              <div className="p-2 space-y-1">
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:bg-gray-800/50 rounded-md transition-colors" onClick={() => navigate('/settings')}>Profile</button>
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors" onClick={() => {
                  sessionStorage.removeItem('it_session');
                  navigate('/login');
                }}>Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
