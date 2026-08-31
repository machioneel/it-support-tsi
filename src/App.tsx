import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EmployeePortal from '@/pages/EmployeePortal';
import ITLogin from '@/pages/ITLogin';
import ITDashboard from '@/pages/ITDashboard';
import ITTickets from '@/pages/ITTickets';
import ITKnowledgeBase from '@/pages/ITKnowledgeBase';
import ITUsers from '@/pages/ITUsers';
import ITReports from '@/pages/ITReports';
import ITSettings from '@/pages/ITSettings';
import ITLayout from '@/components/ITLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmployeePortal />} />
        <Route path="/login" element={<ITLogin />} />
        <Route element={<ITLayout />}>
          <Route path="/dashboard" element={<ITDashboard />} />
          <Route path="/tickets" element={<ITTickets />} />
          <Route path="/knowledge-base" element={<ITKnowledgeBase />} />
          <Route path="/users" element={<ITUsers />} />
          <Route path="/reports" element={<ITReports />} />
          <Route path="/settings" element={<ITSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
