// Role-aware sidebar navigation. Three nav sets (admin / teacher / staff),
// school branding from SchoolContext, small-screen drawer, and sign-out.

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardCheck, BookOpen, MessageCircle, FileText,
  BarChart3, Settings, FileBarChart, UserCircle, LogOut, Menu, X,
  ShieldAlert, Megaphone, CalendarDays, FolderCheck, IdCard,
} from 'lucide-react';
import SchoolMark from '../branding/SchoolMark';
import { useSchool } from '../../context/useSchool';
import { authService } from '../../services/authService';

const ICONS = {
  dashboard: LayoutDashboard,
  users: Users,
  students: IdCard,
  attendance: ClipboardCheck,
  ledger: BookOpen,
  inbox: MessageCircle,
  cases: FileText,
  documents: FolderCheck,
  alerts: ShieldAlert,
  analytics: BarChart3,
  config: Settings,
  reports: FileBarChart,
  profile: UserCircle,
  critical: ShieldAlert,
  conferences: CalendarDays,
  announcements: Megaphone,
};

// Role-aware navigation: admin / teacher / staff (Prefect of Discipline)
const NAV = {
  admin: [
    { key: 'dashboard',     name: 'Dashboard',                  path: '/admin' },
    { key: 'users',         name: 'User Management',            path: '/users' },
    { key: 'students',      name: 'Students & Sections',        path: '/students' },
    { key: 'attendance',    name: 'Take Attendance',            path: '/attendance' },
    { key: 'ledger',        name: 'Attendance Records',         path: '/ledger' },
    { key: 'alerts',        name: 'AI Alerts',                  path: '/ai-alerts' },
    { key: 'cases',         name: 'Cases & Interventions',      path: '/cases' },
    { key: 'documents',     name: 'Parent Documents',           path: '/documents' },
    { key: 'inbox',         name: 'Triggered Threads',          path: '/inbox' },
    { key: 'announcements', name: 'Announcements',              path: '/announcements' },
    { key: 'analytics',     name: 'Analytics Hub',              path: '/analytics' },
    { key: 'reports',       name: 'Reports',                    path: '/reports' },
    { key: 'config',        name: 'School Settings',            path: '/config' },
    { key: 'profile',       name: 'My Profile',                 path: '/profile' },
  ],
  teacher: [
    { key: 'dashboard',     name: 'Dashboard',                  path: '/teacher' },
    { key: 'attendance',    name: 'Take Attendance',            path: '/attendance' },
    { key: 'ledger',        name: 'Attendance Records',         path: '/ledger' },
    { key: 'alerts',        name: 'AI Alerts',                  path: '/ai-alerts' },
    { key: 'cases',         name: 'Cases & Interventions',      path: '/cases' },
    { key: 'documents',     name: 'Parent Documents',           path: '/documents' },
    { key: 'inbox',         name: 'Triggered Threads',          path: '/inbox' },
    { key: 'announcements', name: 'Announcements',              path: '/announcements' },
    { key: 'analytics',     name: 'Analytics Hub',              path: '/analytics' },
    { key: 'reports',       name: 'Reports',                    path: '/reports' },
    { key: 'profile',       name: 'My Profile',                 path: '/profile' },
  ],
  staff: [
    { key: 'dashboard',     name: 'POD Dashboard',              path: '/staff' },
    { key: 'critical',      name: 'High Priority Cases',        path: '/critical-cases' },
    { key: 'conferences',   name: 'Conferences',                path: '/conferences' },
    { key: 'cases',         name: 'Cases & Interventions',      path: '/cases' },
    { key: 'documents',     name: 'Parent Documents',           path: '/documents' },
    { key: 'inbox',         name: 'Triggered Threads',          path: '/inbox' },
    { key: 'announcements', name: 'Announcements',              path: '/announcements' },
    { key: 'alerts',        name: 'AI Alerts',                  path: '/ai-alerts' },
    { key: 'ledger',        name: 'Attendance Records',         path: '/ledger' },
    { key: 'reports',       name: 'Reports',                    path: '/reports' },
    { key: 'profile',       name: 'My Profile',                 path: '/profile' },
  ],
};

const ROLE_LABEL = {
  admin: 'Administrator',
  teacher: 'Faculty',
  staff: 'Prefect of Discipline',
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSchool();
  const [open, setOpen] = useState(false);

  const user = authService.getCurrentUser();
  const role = user?.role || 'teacher';
  const links = NAV[role] || NAV.teacher;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = (user?.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const roleAccent = {
    admin:   'text-amber-400',
    teacher: 'text-brand-400',
    staff:   'text-rose-400',
  }[role] || 'text-brand-400';

  const content = (
    <div className="sidebar-shell w-64 text-white h-full flex flex-col border-r border-white/10">
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <SchoolMark className="w-11 h-11 shrink-0 drop-shadow-sm" compact />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white leading-tight truncate">
              {settings.schoolName}
            </h2>
            <p className="text-[10px] font-bold text-brand-100 uppercase">Manila</p>
          </div>
        </div>
        <p className="text-white/60 text-[11px] font-medium">
          {settings.schoolType} school | AY {settings.academicYear}
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                  ? 'bg-white/10 text-white font-semibold border border-brand-300/30 shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white font-medium border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className={`text-[11px] font-semibold ${roleAccent}`}>
              {ROLE_LABEL[role] || role}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] text-white/75 hover:text-white px-3 py-2 rounded-lg transition-all text-xs font-semibold border border-white/10"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 sidebar-shell text-white px-4 py-3 flex items-center justify-between z-20 border-b border-white/10">
        <div className="flex items-center gap-2">
          <SchoolMark className="w-8 h-8 shrink-0" compact />
          <span className="font-semibold text-sm truncate">{settings.schoolName}</span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <aside className="hidden md:block">{content}</aside>

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
