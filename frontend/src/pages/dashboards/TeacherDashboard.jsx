// Teacher Dashboard (Fig. 8). Headline tiles, weekly trend SVG,
// absences-per-weekday bar chart, at-risk list, and recent parent
// document submissions.

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, FileBarChart, AlertCircle, BookOpen, Users, FolderCheck,
  AlertTriangle, ShieldAlert, TrendingUp,
} from 'lucide-react';
import { attendService } from '../../services/attendService';
import { sessionService } from '../../services/sessionService';
import { documentService } from '../../services/documentService';
import { authService } from '../../services/authService';
import { useSchool } from '../../context/useSchool';
import { normalizeRiskLevel } from '../../utils/riskLevels';

// Teacher Dashboard — manuscript Fig. 8.
// Adds: consecutive-absence cases tile, warning/critical counts, weekly
// trend (line chart in SVG), absences-per-week bar chart, recent parent
// submissions list. Built without chart libs to avoid extra dependencies.
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const me = authService.getCurrentUser();
  const { settings } = useSchool();

  const [risk, setRisk]       = useState([]);
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary]   = useState({});
  const [trend, setTrend]       = useState([]);
  const [docs, setDocs]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, sRes, sumRes, tRes, dRes] = await Promise.all([
          attendService.getRiskAnalysis(),
          sessionService.getSessions(),
          attendService.getSummary(),
          attendService.getTrend(14),
          documentService.list({ status: 'Pending Review' }),
        ]);
        setRisk(rRes.data);
        setSessions(sRes.data);
        setSummary(sumRes.data);
        setTrend(tRes.data);
        setDocs(dRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const counts = useMemo(() => {
    const high     = risk.filter((r) => normalizeRiskLevel(r.riskLevel) === 'High').length;
    const moderate = risk.filter((r) => normalizeRiskLevel(r.riskLevel) === 'Moderate').length;
    const consecutive = risk.filter((r) => r.consecutiveAbsences >= settings.consecutiveAbsenceThreshold).length;
    const warning  = risk.filter((r) => r.absentCount >= settings.warningTotalAbsences && r.absentCount < settings.criticalTotalAbsences).length;
    const highAbsences = risk.filter((r) => r.absentCount >= settings.criticalTotalAbsences).length;
    return { high, moderate, consecutive, warning, highAbsences };
  }, [risk, settings]);

  // Per-weekday absence tally over the trend window
  const weeklyBars = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const tally = Array(7).fill(0);
    for (const t of trend) {
      const day = new Date(t.date).getDay();
      tally[day] += t.absent || 0;
    }
    return labels.map((label, i) => ({ label, value: tally[i] }));
  }, [trend]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-wrap gap-4 justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hello, {me?.name?.split(' ')[0]}!</h1>
          <p className="text-slate-500 mt-2">
            {me?.department || 'Faculty'} • {settings.schoolName} • AY {settings.academicYear}
          </p>
        </div>
        <button onClick={() => navigate('/attendance')} className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm">
          <ClipboardCheck className="w-4 h-4" /> Take Attendance
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      {/* Headline tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <Tile label="My Sessions"        value={loading ? '—' : sessions.length} icon={<BookOpen className="w-4 h-4" />} accent="text-brand-600" />
        <Tile label="Total Students"     value={loading ? '—' : summary.totalStudents || 0} icon={<Users className="w-4 h-4" />} accent="text-emerald-600" />
        <Tile label="Overall Rate"       value={loading ? '—' : `${summary.overallRate || 0}%`} icon={<FileBarChart className="w-4 h-4" />} accent="text-amber-600" />
        <Tile label="High"               value={loading ? '—' : counts.high} icon={<AlertCircle className="w-4 h-4" />} accent="text-red-600" />
        <Tile label="Moderate"           value={loading ? '—' : counts.moderate} icon={<AlertTriangle className="w-4 h-4" />} accent="text-amber-600" />
        <Tile label="Consecutive Cases"  value={loading ? '—' : counts.consecutive} icon={<ShieldAlert className="w-4 h-4" />} accent="text-orange-600" />
        <Tile label="Warning / High"     value={loading ? '—' : `${counts.warning} / ${counts.highAbsences}`} icon={<AlertTriangle className="w-4 h-4" />} accent="text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Weekly Attendance Trend</h2>
              <p className="text-xs text-slate-500">Last 14 days, all teachers combined</p>
            </div>
            <TrendingUp className="w-5 h-5 text-brand-500" />
          </div>
          <TrendChart trend={trend} loading={loading} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-bold text-slate-800 text-lg mb-3">Absences per Weekday</h2>
          <BarChart bars={weeklyBars} loading={loading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">At-Risk Students</h2>
            <p className="text-slate-500 text-sm">Below {settings.attendanceHighRiskBelow}% attendance</p>
          </div>
          {loading ? <p className="p-6 text-center text-slate-400 text-sm">Loading…</p>
          : risk.length === 0 ? <p className="p-6 text-center text-slate-400 text-sm">No data yet.</p>
          : (
            <div className="divide-y divide-slate-100">
              {risk.slice(0, 8).map((r) => (
                <div key={r.studentId} className="p-4 flex items-center justify-between hover:bg-slate-50 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-sm truncate">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.section || '—'} • {r.absentCount} absent ({r.consecutiveAbsences} consecutive)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          r.attendanceRate >= settings.attendanceModerateBelow ? 'bg-emerald-500' :
                          r.attendanceRate >= settings.attendanceHighRiskBelow ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${r.attendanceRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-black text-slate-900 w-12 text-right">{r.attendanceRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2"><FolderCheck className="w-4 h-4 text-brand-500" /> Recent Parent Submissions</h2>
            <button onClick={() => navigate('/documents')} className="text-brand-600 text-xs font-bold hover:underline">View</button>
          </div>
          {loading ? <p className="p-6 text-center text-slate-400 text-sm">Loading…</p>
          : docs.length === 0 ? <p className="p-6 text-center text-slate-400 text-sm">No pending submissions.</p>
          : (
            <div className="divide-y divide-slate-100">
              {docs.slice(0, 6).map((d) => (
                <div key={d._id} className="p-4">
                  <p className="font-bold text-slate-800 text-sm">{d.student?.name}</p>
                  <p className="text-xs text-slate-500">{d.documentType} • {new Date(d.createdAt).toLocaleDateString()}</p>
                  {d.reason && <p className="text-xs text-slate-600 mt-1 line-clamp-1">{d.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, accent, icon }) {
  return (
    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <span className={accent}>{icon}</span>
      </div>
      <h2 className={`text-2xl font-black ${accent}`}>{value}</h2>
    </div>
  );
}

// Tiny inline SVG line chart so we don't pull in a chart library
function TrendChart({ trend, loading }) {
  if (loading) return <p className="text-slate-400 text-sm text-center py-10">Loading…</p>;
  if (!trend?.length) return <p className="text-slate-400 text-sm text-center py-10">No data yet.</p>;
  const W = 480, H = 140, pad = 18;
  const maxRate = 100;
  const dx = (W - pad * 2) / Math.max(trend.length - 1, 1);
  const points = trend.map((t, i) => {
    const x = pad + i * dx;
    const y = pad + (H - pad * 2) * (1 - (t.rate || 0) / maxRate);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36">
      {[0, 25, 50, 75, 100].map((g) => {
        const y = pad + (H - pad * 2) * (1 - g / 100);
        return <g key={g}>
          <line x1={pad} x2={W - pad} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
          <text x={2} y={y + 3} fontSize="9" fill="#94a3b8">{g}</text>
        </g>;
      })}
      <polyline fill="none" stroke="#9B0D2E" strokeWidth="2" points={points} />
      {trend.map((t, i) => {
        const x = pad + i * dx;
        const y = pad + (H - pad * 2) * (1 - (t.rate || 0) / maxRate);
        return <circle key={i} cx={x} cy={y} r="2.5" fill="#9B0D2E" />;
      })}
    </svg>
  );
}

function BarChart({ bars, loading }) {
  if (loading) return <p className="text-slate-400 text-sm text-center py-10">Loading…</p>;
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="flex items-end justify-between gap-2 h-32 px-1">
      {bars.map((b) => (
        <div key={b.label} className="flex-1 flex flex-col items-center justify-end">
          <div className="text-[10px] text-slate-500 mb-1">{b.value}</div>
          <div className="w-full bg-rose-100 rounded-t" style={{ height: `${(b.value / max) * 80}%`, minHeight: 2 }} />
          <div className="text-[10px] font-bold text-slate-400 mt-1">{b.label}</div>
        </div>
      ))}
    </div>
  );
}
