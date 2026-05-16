// Administrator Hub (Fig. 20). User counts, attendance KPIs, school-wide
// trend chart, case distribution by risk level, and a system health panel.

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, ShieldCheck, AlertTriangle, TrendingUp, FileText,
  CheckCircle2, Activity, Server, Database,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { attendService } from '../../services/attendService';
import { caseService } from '../../services/caseService';
import { useSchool } from '../../context/useSchool';

// Administrator Hub — manuscript Fig. 20.
// Adds: school-wide attendance trend chart, case distribution by risk level,
// and a system-health panel (API status, total records, server time).
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { settings } = useSchool();

  const [users, setUsers]     = useState([]);
  const [summary, setSummary] = useState({});
  const [risk, setRisk]       = useState([]);
  const [cases, setCases]     = useState([]);
  const [trend, setTrend]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [apiUp, setApiUp]     = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, sRes, rRes, cRes, tRes] = await Promise.all([
          userService.getAllUsers(),
          attendService.getSummary(),
          attendService.getRiskAnalysis(),
          caseService.getCases(),
          attendService.getTrend(14),
        ]);
        setUsers(uRes.data); setSummary(sRes.data); setRisk(rRes.data);
        setCases(cRes.data); setTrend(tRes.data);
        setApiUp(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
        setApiUp(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const counts = useMemo(() => ({
    students: users.filter((u) => u.role === 'student').length,
    teachers: users.filter((u) => u.role === 'teacher').length,
    staff:    users.filter((u) => u.role === 'staff').length,
    admins:   users.filter((u) => u.role === 'admin').length,
    inactive: users.filter((u) => !u.isActive).length,
  }), [users]);

  const caseDistribution = useMemo(() => {
    const tally = { 'Critical': 0, 'High Risk': 0, 'Medium Risk': 0, 'Low Risk': 0 };
    for (const c of cases) tally[c.riskLevel] = (tally[c.riskLevel] || 0) + 1;
    const total = cases.length || 1;
    return Object.entries(tally).map(([level, value]) => ({ level, value, pct: Math.round((value / total) * 100) }));
  }, [cases]);

  const criticalRisk = risk.filter((r) => r.riskLevel === 'Critical').length;
  const highRisk     = risk.filter((r) => r.riskLevel === 'High Risk').length;
  const openCases    = cases.filter((c) => ['Open', 'Pending'].includes(c.status)).length;
  const escalated    = cases.filter((c) => c.status === 'Escalated').length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-wrap gap-4 justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Administrator Hub</h1>
          <p className="text-slate-500 mt-2">{settings.schoolName} • {settings.schoolType} • AY {settings.academicYear}</p>
        </div>
        <button onClick={() => navigate('/users')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm">
          <Users className="w-4 h-4" /> Manage Users
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KPI label="Students" value={loading ? '—' : counts.students} icon={<GraduationCap className="w-4 h-4" />} accent="text-emerald-600" />
        <KPI label="Teachers" value={loading ? '—' : counts.teachers} icon={<Users className="w-4 h-4" />} accent="text-blue-600" />
        <KPI label="Staff (POD)" value={loading ? '—' : counts.staff} icon={<ShieldCheck className="w-4 h-4" />} accent="text-rose-600" />
        <KPI label="Admins" value={loading ? '—' : counts.admins} icon={<ShieldCheck className="w-4 h-4" />} accent="text-amber-600" />
        <KPI label="Inactive" value={loading ? '—' : counts.inactive} icon={<Users className="w-4 h-4" />} accent="text-slate-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Big label="Overall Attendance Rate" value={loading ? '—' : `${summary.overallRate || 0}%`} accent="text-blue-600" icon={<TrendingUp className="w-6 h-6" />} />
        <Big label="At Risk"        value={loading ? '—' : criticalRisk + highRisk} sub={`${criticalRisk} Critical • ${highRisk} High`} accent="text-red-600" icon={<AlertTriangle className="w-6 h-6" />} />
        <Big label="Cases (Open + Escalated)" value={loading ? '—' : openCases + escalated} sub={`${escalated} escalated`} accent="text-amber-600" icon={<FileText className="w-6 h-6" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-slate-800 text-lg">School-wide Attendance Trend</h2>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <TrendChart trend={trend} loading={loading} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-bold text-slate-800 text-lg mb-3">Case Distribution by Risk Level</h2>
          {loading ? <p className="text-slate-400 text-sm text-center py-6">Loading…</p>
          : cases.length === 0 ? <p className="text-slate-400 text-sm text-center py-6">No cases yet.</p>
          : (
            <div className="space-y-2">
              {caseDistribution.map((d) => (
                <div key={d.level}>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{d.level}</span>
                    <span className="text-slate-500">{d.value} ({d.pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${
                      d.level === 'Critical'    ? 'bg-red-500' :
                      d.level === 'High Risk'   ? 'bg-orange-500' :
                      d.level === 'Medium Risk' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-lg">Top At-Risk Students</h2>
            <button onClick={() => navigate('/analytics')} className="text-blue-600 text-sm font-bold hover:underline">Full Analytics →</button>
          </div>
          <div className="divide-y divide-slate-100">
            {loading && <p className="p-6 text-slate-400 text-sm text-center">Loading…</p>}
            {!loading && risk.length === 0 && <p className="p-6 text-slate-400 text-sm text-center">No attendance data yet.</p>}
            {risk.slice(0, 6).map((r) => (
              <div key={r.studentId} className="p-4 flex justify-between items-center hover:bg-slate-50">
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
                  }`}>{r.riskLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Activity className="w-4 h-4" /> System Health</h3>
          <Health icon={<Server className="w-4 h-4" />} label="API" status={apiUp === null ? '...' : apiUp ? 'Online' : 'Offline'} ok={apiUp} />
          <Health icon={<Database className="w-4 h-4" />} label="Records" status={`${summary.totalSessions || 0} sessions`} ok={true} />
          <Health icon={<CheckCircle2 className="w-4 h-4" />} label="Server Time" status={new Date().toLocaleTimeString()} ok={true} />
          <Health icon={<Users className="w-4 h-4" />} label="Active Users" status={`${users.filter((u) => u.isActive).length}/${users.length}`} ok={true} />
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, icon, accent }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <span className={accent}>{icon}</span>
      </div>
      <h2 className={`text-2xl font-black ${accent}`}>{value}</h2>
    </div>
  );
}

function Big({ label, value, sub, icon, accent }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <span className={accent}>{icon}</span>
      </div>
      <h2 className={`text-3xl font-black ${accent}`}>{value}</h2>
      {sub && <p className="text-xs text-slate-500 mt-2 font-medium">{sub}</p>}
    </div>
  );
}

function Health({ icon, label, status, ok }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/70 last:border-0">
      <div className="flex items-center gap-2 text-slate-300 text-sm">
        {icon} {label}
      </div>
      <span className={`text-xs font-bold ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>{status}</span>
    </div>
  );
}

function TrendChart({ trend, loading }) {
  if (loading) return <p className="text-slate-400 text-sm text-center py-10">Loading…</p>;
  if (!trend?.length) return <p className="text-slate-400 text-sm text-center py-10">No data yet.</p>;
  const W = 600, H = 160, pad = 24;
  const dx = (W - pad * 2) / Math.max(trend.length - 1, 1);
  const points = trend.map((t, i) => {
    const x = pad + i * dx;
    const y = pad + (H - pad * 2) * (1 - (t.rate || 0) / 100);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40">
      {[0, 50, 100].map((g) => {
        const y = pad + (H - pad * 2) * (1 - g / 100);
        return <g key={g}>
          <line x1={pad} x2={W - pad} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
          <text x={2} y={y + 3} fontSize="10" fill="#94a3b8">{g}</text>
        </g>;
      })}
      <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />
      {trend.map((t, i) => {
        const x = pad + i * dx;
        const y = pad + (H - pad * 2) * (1 - (t.rate || 0) / 100);
        return <g key={i}>
          <circle cx={x} cy={y} r="3" fill="#3b82f6" />
          {i === 0 || i === trend.length - 1 ? (
            <text x={x} y={H - 4} fontSize="9" fill="#94a3b8" textAnchor="middle">
              {new Date(t.date).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
            </text>
          ) : null}
        </g>;
      })}
    </svg>
  );
}
