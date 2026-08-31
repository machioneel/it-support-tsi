import { Link } from 'react-router-dom';
import { Home, Ticket, BookOpen, Users, BarChart3, Settings, Moon } from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  pathname: string;
}

export default function Sidebar({ sidebarOpen, isDarkMode, setIsDarkMode, pathname }: SidebarProps) {
  const isActive = (path: string) => pathname === path;

  const NavItem = ({ to, icon: Icon, label, badge, isSubItem = false }: any) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`group relative flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 liquid-nav-item ${active
            ? 'liquid-nav-item-active text-blue-700 dark:text-blue-300'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
          } ${isSubItem ? 'ml-2' : ''}`}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={`w-5 h-5 transition-colors ${active ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'}`}
          />
          <span>{label}</span>
        </div>
        {badge && (
          <span className="py-0.5 px-2 rounded-full text-xs font-semibold text-blue-700 liquid-badge">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`fixed top-1/2 -translate-y-1/2 left-4 z-50 w-64 h-[calc(100vh-2rem)] rounded-[28px] flex flex-col transition-transform duration-300 ease-in-out liquid-panel ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'
        }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 shrink-0 relative">
        <div
          className="absolute bottom-0 left-6 right-6 h-px"
          style={{
            background: isDarkMode
              ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
          }}
        />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-300 liquid-icon-box">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">IT Support</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ticket Dashboard</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
        <NavItem to="/dashboard" icon={Home} label="Dashboard" />
        <NavItem to="/tickets" icon={Ticket} label="Tickets" />
        <NavItem to="/knowledge-base" icon={BookOpen} label="Knowledge Base" />
        <NavItem to="/users" icon={Users} label="Users" />
        <NavItem to="/reports" icon={BarChart3} label="Reports" />
        <NavItem to="/settings" icon={Settings} label="Settings" />
      </div>

      {/* Sidebar Footer */}
      <div
        className="p-4 relative"
        style={{
          borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.6)',
        }}
      >
        <div className="flex items-center justify-between px-2 text-sm font-medium">
          <div className="flex items-center gap-2">
            <Moon className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-gray-500'}`} />
            <span className={isDarkMode ? 'text-gray-200' : 'text-gray-600'}>Dark mode</span>
          </div>
          {/* Liquid glass toggle switch */}
          <div
            role="switch"
            aria-checked={isDarkMode}
            tabIndex={0}
            className="w-10 rounded-full flex items-center p-0.5 cursor-pointer transition-all duration-300 liquid-toggle-track"
            style={{ width: '2.5rem', height: '1.4rem' }}
            onClick={() => setIsDarkMode(!isDarkMode)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsDarkMode(!isDarkMode);
            }}
          >
            <div
              className="rounded-full transition-transform duration-300 liquid-toggle-thumb"
              style={{
                width: '1.1rem',
                height: '1.1rem',
                transform: isDarkMode ? 'translateX(1.05rem)' : 'translateX(0)',
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
