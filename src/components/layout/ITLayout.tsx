import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import NewTicketModal from '@/features/tickets/components/NewTicketModal';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function ITLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authed, setAuthed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem('it_session');
    if (!session) {
      setAuthed(true); // Should probably redirect to login here if production
    } else {
      setAuthed(true);
    }
  }, [navigate]);

  if (!authed) return null;

  return (
    <div className={`h-screen w-screen overflow-hidden ${isDarkMode ? 'bg-gray-900 text-gray-100 dark' : 'bg-[#f0f4f8] text-gray-900 dark:text-white'} relative font-sans transition-colors duration-300`}>
      {/* Decorative Background for Glass Effect */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[100px]"></div>
      </div>

      <Sidebar 
        sidebarOpen={sidebarOpen} 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode} 
        pathname={location.pathname} 
      />

      <Topbar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        isDarkMode={isDarkMode} 
        onNewTicketClick={() => setIsNewTicketModalOpen(true)} 
      />

      {/* Main Area */}
      <main className="absolute top-24 bottom-0 left-0 right-0 z-10 overflow-auto lg:pl-[19rem] px-4 lg:pr-8 pb-8">
        <div className="w-full">
          <Outlet context={{ openNewTicketModal: () => setIsNewTicketModalOpen(true) }} />
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <NewTicketModal 
        isOpen={isNewTicketModalOpen} 
        onClose={() => setIsNewTicketModalOpen(false)} 
        onSuccess={() => {}} 
      />
    </div>
  );
}
