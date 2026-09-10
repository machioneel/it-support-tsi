import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EmployeePortal from '@/pages/EmployeePortal';
import ITLogin from '@/pages/ITLogin';
import AssetValidation from '@/pages/AssetValidation';
import ITDashboard from '@/pages/ITDashboard';
import ITTickets from '@/pages/ITTickets';
import ITKnowledgeBase from '@/pages/ITKnowledgeBase';
import ITEmployees from '@/pages/ITEmployees';
import ITReports from '@/pages/ITReports';
import ITSettings from '@/pages/ITSettings';
import ITLayout from '@/components/layout/ITLayout';
import ITAssets from '@/pages/ITAssets';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmployeePortal />} />
        <Route path="/login" element={<ITLogin />} />
        {/* Public: where a scanned asset barcode lands, no sign-in required */}
        <Route path="/validate/:assetTag" element={<AssetValidation />} />
        <Route element={<ITLayout />}>
          <Route path="/dashboard" element={<ITDashboard />} />
          <Route path="/tickets" element={<ITTickets />} />
          <Route path="/assets" element={<ITAssets />} />
          <Route path="/knowledge-base" element={<ITKnowledgeBase />} />
          <Route path="/employees" element={<ITEmployees />} />
          {/* Users moved into Settings */}
          <Route path="/users" element={<Navigate to="/settings" replace />} />
          <Route path="/reports" element={<ITReports />} />
          <Route path="/settings" element={<ITSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
