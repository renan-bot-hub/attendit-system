import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, ShieldCheck, BookOpen, AlertTriangle, CheckCircle2,
  TrendingUp, Settings as SettingsIcon, ClipboardCheck, FileText,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { attendService } from '../../services/attendService';
import { caseService } from '../../services/caseService';
import { useSchool } from '../../context/useSchool';

// Admin home page: full-system KPIs, at-risk students, quick actions
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { settings } = useSchool();

  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({});
  const [risk, setRisk] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, sRes, rRes, cRes] = await Promise.all([
          userService.getAllUsers(),
          attendService.getSummary(),
          attendService.getRiskAnalysis(),
          caseService.getCases(),
        ]);
        setUsers(uRes.data);
        setSummary(sRes.data);
        setRisk(rRes.data);
        setCases(cRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const counts = {
    students: users.filter((u) => u.role === 'student').length,
    teachers: users.filter((u) => u.role === 'teacher').length,
    admins:   users.filter((u) => u.role === 'admin').length,
    inactive: users.filter((u) => !u.isActive).length,
  };

  const criticalRisk = risk.filter((r) => r.riskLevel === 'Critical').length;
  const highRisk = risk.filter((r) => r.riskLevel === 'High Risk').length;
  const pendingCases = cases.filter((c) => c.status === 'Pending').length;

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex flex-wrap gap-4 justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Administrator Hub</h1>
          <p className="text-slate-500 mt-2">
            {settings.schoolName} • {settings.schoolType} • AY {settings.academicYear}
          </p>
        </div>
        <button
          onClick={() => navigate('/users')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm"
        >
          <Users className="w-4 h-4" /> Manage Users
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPI label="Students" value={loading ? '—' : counts.students} icon={<GraduationCap className="w-5 h-5" />} accent="text-emerald-600" />
        <KPI label="Teachers" value={loading ? '—' : counts.teachers} icon={<Users className="w-5 h-5" />} accent="text-blue-600" />
        <KPI label="Admins" value={loading ? '—' : counts.admins} icon={<ShieldCheck className="w-5 h-5" />} accent="text-amber-600" />
        <KPI label="Inactive" value={loading ? '—' : counts.inactive} icon={<Users className="w-5 h-5" />} accent="text-slate-500" />
      </div>

      {/* Attendance health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Big label="Overall Attendance Rate" value={loading ? '—' : `${summary.overallRate || 0}%`} accent="text-blue-600" icon={<TrendingUp className="w-6 h-6" />} />
        <Big label="At Risk" value={loading ? '—' : criticalRisk + highRisk} sub={`${criticalRisk} Critical • ${highRisk} High`} accent="text-red-600" icon={<AlertTriangle className="w-6 h-6" />} />
        <Big label="Pending Cases" value={loading ? '—' : pendingCases} sub={`${cases.length} total`} accent="text-amber-600" icon={<FileText className="w-6 h-6" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent risk list */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-lg">Top At-Risk Students</h2>
            <button onClick={() => navigate('/analytics')} className="text-blue-600 text-sm font-bold hover:underline">
              Full Analytics →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {loading && <p className="p-6 text-slate-400 text-sm text-center">Loading…</p>}
            {!loading && risk.length === 0 && (
              <p className="p-6 text-slate-400 text-sm text-center">No attendance data yet — record some sessions to begin tracking.</p>
            )}
            {risk.slice(0, 6).map((r) => (
              <div key={r.studentId} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.section || '—'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900">{r.attendanceRate}%</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    r.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' :
                    r.riskLevel === 'High Risk' ? 'bg-orange-100 text-orange-700' :
                    r.riskLevel === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {r.riskLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4">Quick Actions</h3>
          <QuickBtn onClick={() => navigate('/users')} icon={<Users className="w-4 h-4" />}>Manage Users</QuickBtn>
          <QuickBtn onClick={() => navigate('/attendance')} icon={<ClipboardCheck className="w-4 h-4" />}>Take Attendance</QuickBtn>
          <QuickBtn onClick={() => navigate('/ledger')} icon={<BookOpen className="w-4 h-4" />}>Attendance Ledger</QuickBtn>
          <QuickBtn onClick={() => navigate('/cases')} icon={<FileText className="w-4 h-4" />}>Case Manager</QuickBtn>
          <QuickBtn onClick={() => navigate('/reports')} icon={<CheckCircle2 className="w-4 h-4" />}>Generate Reports</QuickBtn>
          <QuickBtn onClick={() => navigate('/config')} icon={<SettingsIcon className="w-4 h-4" />}>School Settings</QuickBtn>
        </div>
      </div>
    </div>
  );
}

// Small stat tile (count + icon)
function KPI({ label, value, icon, accent }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <span className={accent}>{icon}</span>
      </div>
      <h2 className={`text-3xl font-black ${accent}`}>{value}</h2>
    </div>
  );
}

// Larger headline stat (with sub-text)
function Big({ label, value, sub, icon, accent }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <span className={accent}>{icon}</span>
      </div>
      <h2 className={`text-4xl font-black ${accent}`}>{value}</h2>
      {sub && <p className="text-xs text-slate-500 mt-2 font-medium">{sub}</p>}
    </div>
  );
}

// Sidebar-style action button for the dark "quick actions" panel
function QuickBtn({ onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className="w-full mb-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors"
    >
      {icon} {children}
    </button>
  );
}
