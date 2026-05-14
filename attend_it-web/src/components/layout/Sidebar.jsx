import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardCheck, BookOpen, MessageCircle, FileText,
  BarChart3, Settings, FileBarChart, UserCircle, LogOut, GraduationCap, Menu, X,
} from 'lucide-react';
import { useSchool } from '../../context/useSchool';

const ICONS = {
  dashboard: LayoutDashboard,
  users: Users,
  attendance: ClipboardCheck,
  ledger: BookOpen,
  inbox: MessageCircle,
  cases: FileText,
  analytics: BarChart3,
  config: Settings,
  reports: FileBarChart,
  profile: UserCircle,
};

const NAV = {
  admin: [
    { key: 'dashboard', name: 'Dashboard',         path: '/admin' },
    { key: 'users',     name: 'User Management',   path: '/users' },
    { key: 'attendance',name: 'Take Attendance',   path: '/attendance' },
    { key: 'ledger',    name: 'Attendance Ledger', path: '/ledger' },
    { key: 'inbox',     name: 'Inbox',             path: '/inbox' },
    { key: 'cases',     name: 'Case Manager',      path: '/cases' },
    { key: 'analytics', name: 'Analytics Hub',     path: '/analytics' },
    { key: 'reports',   name: 'Reports',           path: '/reports' },
    { key: 'config',    name: 'School Settings',   path: '/config' },
    { key: 'profile',   name: 'My Profile',        path: '/profile' },
  ],
  teacher: [
    { key: 'dashboard', name: 'Dashboard',         path: '/teacher' },
    { key: 'attendance',name: 'Take Attendance',   path: '/attendance' },
    { key: 'ledger',    name: 'Attendance Ledger', path: '/ledger' },
    { key: 'inbox',     name: 'Inbox',             path: '/inbox' },
    { key: 'cases',     name: 'Case Manager',      path: '/cases' },
    { key: 'analytics', name: 'Analytics Hub',     path: '/analytics' },
    { key: 'reports',   name: 'Reports',           path: '/reports' },
    { key: 'profile',   name: 'My Profile',        path: '/profile' },
  ],
  student: [
    { key: 'dashboard', name: 'Dashboard',         path: '/student' },
    { key: 'ledger',    name: 'My Attendance',     path: '/ledger' },
    { key: 'inbox',     name: 'Messages',          path: '/inbox' },
    { key: 'cases',     name: 'My Cases',          path: '/cases' },
    { key: 'profile',   name: 'My Profile',        path: '/profile' },
  ],
};

// Role-aware navigation: shows the correct menu for admin/teacher/student
export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSchool();
  const [open, setOpen] = useState(false);

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const role = user?.role || 'student';
  const links = NAV[role] || NAV.student;

  // Clear session and return to login
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = (user?.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const roleAccent = {
    admin: 'text-amber-400',
    teacher: 'text-blue-400',
    student: 'text-emerald-400',
  }[role] || 'text-blue-400';

  const content = (
    <div className="w-64 bg-slate-900 text-white h-full flex flex-col shadow-2xl">
      {/* Brand */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="w-7 h-7 text-blue-500" />
          <h2 className="text-lg font-black text-white tracking-tight leading-tight truncate">
            {settings.schoolName}
          </h2>
        </div>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
          {settings.schoolType} school • AY {settings.academicYear}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = ICONS[link.key] || LayoutDashboard;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
            <p className={`text-[10px] font-black uppercase tracking-widest ${roleAccent}`}>
              {role} Access
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-all text-xs font-bold"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white px-4 py-3 flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-sm truncate">{settings.schoolName}</span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block">{content}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative">
            {content}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-[-3rem] bg-slate-800 text-white p-2 rounded-full"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
