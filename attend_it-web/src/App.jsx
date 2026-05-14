import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import RoleRoute from './components/auth/RoleRoute';
import { SchoolProvider } from './context/SchoolContext';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

import AdminDashboard from './pages/dashboards/AdminDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';

import UserManagement from './pages/admin/UserManagement';
import SystemConfig from './pages/admin/SystemConfig';

import TakeAttendance from './pages/attendance/TakeAttendance';
import AttendanceLedger from './pages/attendance/AttendanceLedger';

import Inbox from './pages/messages/Inbox';
import CaseManager from './pages/messages/CaseManager';

import Analytics from './pages/reports/Analytics';
import Reports from './pages/reports/Reports';

import Profile from './pages/profile/Profile';
import NotFound from './pages/NotFound';

const ADMIN = ['admin'];
const STAFF = ['admin', 'teacher'];
const ALL   = ['admin', 'teacher', 'student'];

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
            <Route path="/student" element={<RoleRoute roles={['student']}><StudentDashboard /></RoleRoute>} />

            {/* Admin-only */}
            <Route path="/users"  element={<RoleRoute roles={ADMIN}><UserManagement /></RoleRoute>} />
            <Route path="/config" element={<RoleRoute roles={ADMIN}><SystemConfig /></RoleRoute>} />

            {/* Staff-only */}
            <Route path="/attendance" element={<RoleRoute roles={STAFF}><TakeAttendance /></RoleRoute>} />
            <Route path="/analytics"  element={<RoleRoute roles={STAFF}><Analytics /></RoleRoute>} />
            <Route path="/reports"    element={<RoleRoute roles={STAFF}><Reports /></RoleRoute>} />

            {/* Everyone */}
            <Route path="/ledger"  element={<RoleRoute roles={ALL}><AttendanceLedger /></RoleRoute>} />
            <Route path="/inbox"   element={<RoleRoute roles={ALL}><Inbox /></RoleRoute>} />
            <Route path="/cases"   element={<RoleRoute roles={ALL}><CaseManager /></RoleRoute>} />
            <Route path="/profile" element={<RoleRoute roles={ALL}><Profile /></RoleRoute>} />

            {/* Default landing after login */}
            <Route index element={<RoleHome />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </SchoolProvider>
  );
}

function RoleHome() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')   return <Navigate to="/admin" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}
