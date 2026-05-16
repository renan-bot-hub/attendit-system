// Root component. Wires the router, role guards, and SchoolContext.
// Routes are gated by role; the index route sends each user to their
// role-appropriate dashboard.

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import RoleRoute from './components/auth/RoleRoute';
import { SchoolProvider } from './context/SchoolContext';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

import AdminDashboard   from './pages/dashboards/AdminDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import StaffDashboard   from './pages/dashboards/StaffDashboard';

import UserManagement    from './pages/admin/UserManagement';
import SystemConfig      from './pages/admin/SystemConfig';
import StudentManagement from './pages/admin/StudentManagement';

import TakeAttendance   from './pages/attendance/TakeAttendance';
import AttendanceLedger from './pages/attendance/AttendanceLedger';

import Threads      from './pages/messages/Threads';
import CaseManager  from './pages/messages/CaseManager';
import ParentDocuments from './pages/messages/ParentDocuments';
import Announcements   from './pages/messages/Announcements';

import AIAlerts      from './pages/reports/AIAlerts';
import Analytics     from './pages/reports/Analytics';
import Reports       from './pages/reports/Reports';
import CriticalCases from './pages/staff/CriticalCases';
import Conferences   from './pages/staff/Conferences';

import Profile from './pages/profile/Profile';
import NotFound from './pages/NotFound';

const ADMIN     = ['admin'];
const STAFF_POD = ['admin', 'staff'];
const TEACHERS  = ['admin', 'teacher'];
const ALL       = ['admin', 'teacher', 'staff'];

// Root component: wires up routing, the school-settings provider, and role guards
export default function App() {
  return (
    <SchoolProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected layout */}
          <Route element={<MainLayout />}>
            {/* Role-specific dashboards */}
            <Route path="/admin"   element={<RoleRoute roles={ADMIN}><AdminDashboard /></RoleRoute>} />
            <Route path="/teacher" element={<RoleRoute roles={['teacher']}><TeacherDashboard /></RoleRoute>} />
            <Route path="/staff"   element={<RoleRoute roles={['staff']}><StaffDashboard /></RoleRoute>} />

            {/* Admin-only */}
            <Route path="/users"    element={<RoleRoute roles={ADMIN}><UserManagement /></RoleRoute>} />
            <Route path="/students" element={<RoleRoute roles={ADMIN}><StudentManagement /></RoleRoute>} />
            <Route path="/config"   element={<RoleRoute roles={ADMIN}><SystemConfig /></RoleRoute>} />

            {/* Teacher / admin */}
            <Route path="/attendance" element={<RoleRoute roles={TEACHERS}><TakeAttendance /></RoleRoute>} />
            <Route path="/ai-alerts"  element={<RoleRoute roles={ALL}><AIAlerts /></RoleRoute>} />
            <Route path="/analytics"  element={<RoleRoute roles={ALL}><Analytics /></RoleRoute>} />
            <Route path="/reports"    element={<RoleRoute roles={ALL}><Reports /></RoleRoute>} />
            <Route path="/documents"  element={<RoleRoute roles={ALL}><ParentDocuments /></RoleRoute>} />

            {/* Staff / POD */}
            <Route path="/critical-cases" element={<RoleRoute roles={STAFF_POD}><CriticalCases /></RoleRoute>} />
            <Route path="/conferences"    element={<RoleRoute roles={STAFF_POD}><Conferences /></RoleRoute>} />

            {/* Everyone authenticated */}
            <Route path="/ledger"        element={<RoleRoute roles={ALL}><AttendanceLedger /></RoleRoute>} />
            <Route path="/inbox"         element={<RoleRoute roles={ALL}><Threads /></RoleRoute>} />
            <Route path="/cases"         element={<RoleRoute roles={ALL}><CaseManager /></RoleRoute>} />
            <Route path="/announcements" element={<RoleRoute roles={ALL}><Announcements /></RoleRoute>} />
            <Route path="/profile"       element={<RoleRoute roles={ALL}><Profile /></RoleRoute>} />

            {/* Default landing after login */}
            <Route index element={<RoleHome />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </SchoolProvider>
  );
}

// Sends each user to their role-appropriate dashboard from /
function RoleHome() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')   return <Navigate to="/admin"   replace />;
  if (user.role === 'staff')   return <Navigate to="/staff"   replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/login" replace />;
}
