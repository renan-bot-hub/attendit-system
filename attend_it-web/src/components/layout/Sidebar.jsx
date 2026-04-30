import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const role = user?.role || 'teacher';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Admin Links
  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'User Management', path: '/users', icon: '👥' },
    { name: 'Attendance Ledger', path: '/ledger', icon: '📖' },
    { name: 'Analytics Hub', path: '/analytics', icon: '📈' },
    { name: 'System Settings', path: '/config', icon: '⚙️' },
    { name: 'Reports', path: '/reports', icon: '📄' },
  ];

  // Teacher Links
  const teacherLinks = [
    { name: 'Dashboard', path: '/teacher', icon: '🏠' },
    { name: 'Take Attendance', path: '/attendance', icon: '✅' },
    { name: 'Attendance Ledger', path: '/ledger', icon: '📖' },
    { name: 'Inbox', path: '/inbox', icon: '💬' },
    { name: 'Case Manager', path: '/cases', icon: '🏥' },
    { name: 'Reports', path: '/reports', icon: '📄' },
  ];

  const links = role === 'admin' ? adminLinks : teacherLinks;

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-2xl z-10">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-black text-blue-500 tracking-wider">
          ATTEND<span className="text-white">IT</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1 font-medium italic">AI-DRIVEN ATTENDANCE MONITORING SYSTEM WITH PRESCRIPTIVE ANALYTICS FOR STUDENTS AND TEACHERS</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link 
              key={link.name} 
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${
                isActive 
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/50' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-sm">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-6 border-t border-slate-800 bg-slate-900/50">
        <div className="mb-4">
          <p className="text-sm font-bold text-white truncate">{user?.name || 'Authorized User'}</p>
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mt-1">
            {role} Access
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-500 text-slate-300 hover:text-white px-4 py-2.5 rounded-lg transition-all text-xs font-bold"
        >
          Logout
        </button>
      </div>
    </div>
  );
}