import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import LicenseList from '@/pages/LicenseList';
import AllocationList from '@/pages/AllocationList';
import ExpiryCalendar from '@/pages/ExpiryCalendar';
import UsageReport from '@/pages/UsageReport';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/licenses" element={<LicenseList />} />
        <Route path="/allocations" element={<AllocationList />} />
        <Route path="/calendar" element={<ExpiryCalendar />} />
        <Route path="/reports" element={<UsageReport />} />
      </Routes>
    </Router>
  );
}
