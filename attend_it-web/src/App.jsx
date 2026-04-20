import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Dashboard Pages
import AdminDashboard from './pages/dashboards/AdminDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import SystemConfig from './pages/admin/SystemConfig';

// Attendance Pages
import TakeAttendance from './pages/attendance/TakeAttendance';
import AttendanceLedger from './pages/attendance/AttendanceLedger.jsx';

// Messages Pages
import Inbox from './pages/messages/Inbox';
import CaseManager from './pages/messages/CaseManager';

// Reports Pages
import Analytics from './pages/reports/Analytics';
import Reports from './pages/reports/Reports';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes (Wrapped in Sidebar Layout) */}
        <Route element={<MainLayout />}>
          {/* Dashboards */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/teacher" element={<TeacherDashboard />} />

          {/* Admin Specific */}
          <Route path="/users" element={<UserManagement />} />
          <Route path="/config" element={<SystemConfig />} />
          
          {/* Attendance Module */}
          <Route path="/attendance" element={<TakeAttendance />} />
          <Route path="/ledger" element={<AttendanceLedger />} />
          
          {/* Messaging Module */}
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/cases" element={<CaseManager />} />
          
          {/* Reports & Analytics */}
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}