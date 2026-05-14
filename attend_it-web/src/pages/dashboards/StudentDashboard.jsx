import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Clock, XCircle, MessageCircle, FileText, TrendingUp, AlertCircle,
} from 'lucide-react';
import { attendService } from '../../services/attendService';
import { caseService } from '../../services/caseService';
import { authService } from '../../services/authService';
import { useSchool } from '../../context/useSchool';

// Student home page: own attendance rate, recent records, cases
export default function StudentDashboard() {
  const navigate = useNavigate();
  const me = authService.getCurrentUser();
  const { settings } = useSchool();

  const [records, setRecords] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [ledgerRes, casesRes] = await Promise.all([
          attendService.getLedger(),
          caseService.getCases(),
        ]);
        setRecords(ledgerRes.data);
        setCases(casesRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const total = records.length;
  const present = records.filter((r) => r.status === 'Present').length;
  const late = records.filter((r) => r.status === 'Late').length;
  const absent = records.filter((r) => r.status === 'Absent').length;
  const rate = total === 0 ? 0 : Math.round(((present + late) / total) * 100);

  const riskLevel =
    total === 0 ? 'No Data' :
    rate < settings.attendanceCriticalBelow ? 'Critical' :
    rate < settings.attendanceHighRiskBelow ? 'High Risk' :
    rate < settings.attendanceModerateBelow ? 'Moderate' : 'Low Risk';

  const riskColor = {
    'No Data': 'bg-slate-100 text-slate-600',
    'Low Risk': 'bg-emerald-100 text-emerald-700',
    'Moderate': 'bg-amber-100 text-amber-700',
    'High Risk': 'bg-orange-100 text-orange-700',
    'Critical': 'bg-red-100 text-red-700',
  }[riskLevel];

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto">

      <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome, {me?.name?.split(' ')[0]}!</h1>
          <p className="text-slate-500 mt-2">
            {settings.schoolName} • {me?.section || me?.gradeLevel || 'Student'} • AY {settings.academicYear}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider ${riskColor}`}>
          {riskLevel}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Tile label="Attendance Rate" value={loading ? '—' : `${rate}%`} accent="text-blue-600" icon={<TrendingUp className="w-5 h-5" />} />
        <Tile label="Present" value={loading ? '—' : present} accent="text-emerald-600" icon={<CheckCircle className="w-5 h-5" />} />
        <Tile label="Late" value={loading ? '—' : late} accent="text-amber-600" icon={<Clock className="w-5 h-5" />} />
        <Tile label="Absent" value={loading ? '—' : absent} accent="text-red-600" icon={<XCircle className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent records */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Recent Attendance</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading && <p className="p-6 text-slate-400 text-sm text-center">Loading...</p>}
            {!loading && records.length === 0 && (
              <p className="p-6 text-slate-400 text-sm text-center">No attendance recorded yet.</p>
            )}
            {records.slice(0, 8).map((r) => (
              <div key={r._id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {r.sessionId?.className || 'Class'} • {r.sessionId?.section || ''}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(r.timestamp)}</p>
                </div>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Right column: cases + quick actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 text-lg">My Cases</h2>
              <button
                onClick={() => navigate('/cases')}
                className="text-blue-600 text-sm font-bold hover:underline"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {loading && <p className="p-6 text-slate-400 text-sm text-center">Loading...</p>}
              {!loading && cases.length === 0 && (
                <p className="p-6 text-slate-400 text-sm text-center">No cases submitted.</p>
              )}
              {cases.slice(0, 4).map((c) => (
                <div key={c._id} className="p-4">
                  <p className="text-sm font-bold text-slate-800">{c.type}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>
                  <div className="mt-2">
                    <CaseStatus status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold mb-3 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Quick Actions</h3>
            <button
              onClick={() => navigate('/cases')}
              className="w-full mb-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Submit Excuse Letter
            </button>
            <button
              onClick={() => navigate('/inbox')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> Message Teacher
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Small stat tile shown at the top of the dashboard
function Tile({ label, value, accent, icon }) {
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

// Color-coded badge for attendance status
function StatusPill({ status }) {
  const map = {
    Present: 'bg-emerald-100 text-emerald-700',
    Late: 'bg-amber-100 text-amber-700',
    Absent: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

// Color-coded badge for a case's approval state
function CaseStatus({ status }) {
  const map = {
    Pending: 'bg-amber-100 text-amber-700',
    Approved: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${map[status] || ''}`}>
      {status}
    </span>
  );
}
