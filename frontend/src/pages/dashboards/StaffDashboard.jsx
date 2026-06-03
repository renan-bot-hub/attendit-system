// Prefect of Discipline (POD) dashboard (Fig. 16). High-risk case queue,
// upcoming conferences, awaiting-document count.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, CalendarDays, FolderCheck, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { caseService } from '../../services/caseService';
import { conferenceService } from '../../services/conferenceService';
import { documentService } from '../../services/documentService';
import { authService } from '../../services/authService';
import { useSchool } from '../../context/useSchool';

// Prefect of Discipline (POD) home — manuscript Fig. 16.
// Tiles: high-risk cases, scheduled conferences, awaiting documents, resolved.
export default function StaffDashboard() {
  const navigate = useNavigate();
  const me = authService.getCurrentUser();
  const { settings } = useSchool();

  const [summary, setSummary] = useState({ total: 0, open: 0, escalated: 0, resolved: 0 });
  const [conferences, setConferences] = useState([]);
  const [docs, setDocs] = useState({ pending: 0, accepted: 0, rejected: 0, total: 0 });
  const [highRiskCases, setHighRiskCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, confRes, docRes, casesRes] = await Promise.all([
          caseService.getSummary(),
          conferenceService.list({ status: 'Scheduled' }),
          documentService.summary(),
          caseService.getCases({ status: 'Escalated' }),
        ]);
        setSummary(sumRes.data);
        setConferences(confRes.data);
        setDocs(docRes.data);
        setHighRiskCases(casesRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load POD dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-wrap gap-4 justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Office of the Prefect of Discipline
          </h1>
          <p className="text-slate-500 mt-2">
            Hello {me?.name?.split(' ')[0]} • {settings.schoolName} • AY {settings.academicYear}
          </p>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Tile label="High Priority Cases" value={loading ? '—' : summary.escalated} icon={<ShieldAlert className="w-5 h-5" />} accent="text-red-600"
          onClick={() => navigate('/critical-cases')} />
        <Tile label="Pending Conferences" value={loading ? '—' : conferences.length} icon={<CalendarDays className="w-5 h-5" />} accent="text-brand-600"
          onClick={() => navigate('/conferences')} />
        <Tile label="Awaiting Documents" value={loading ? '—' : docs.pending} icon={<FolderCheck className="w-5 h-5" />} accent="text-amber-600"
          onClick={() => navigate('/documents')} />
        <Tile label="Resolved (term)" value={loading ? '—' : summary.resolved} icon={<CheckCircle2 className="w-5 h-5" />} accent="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">High Priority Cases Queue</h2>
              <p className="text-xs text-slate-500">Cases escalated to your office</p>
            </div>
            <button onClick={() => navigate('/critical-cases')} className="text-brand-600 text-sm font-bold hover:underline">View all →</button>
          </div>
          <div className="divide-y divide-slate-100">
            {loading && <p className="p-6 text-center text-slate-500 text-sm">Loading…</p>}
            {!loading && highRiskCases.length === 0 && <p className="p-6 text-center text-slate-400 text-sm">No high risk cases.</p>}
            {highRiskCases.slice(0, 6).map((c) => (
              <div key={c._id} className="p-4 hover:bg-slate-50">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{c.student?.name}</p>
                    <p className="text-xs text-slate-500">{c.student?.section || '—'} • {c.type}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-2 py-1 rounded">{c.riskLevel}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{c.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-lg">Upcoming Conferences</h2>
            <button onClick={() => navigate('/conferences')} className="text-brand-600 text-xs font-bold hover:underline">Manage</button>
          </div>
          <div className="divide-y divide-slate-100">
            {loading && <p className="p-6 text-center text-slate-500 text-sm">Loading…</p>}
            {!loading && conferences.length === 0 && <p className="p-6 text-center text-slate-400 text-sm">None scheduled.</p>}
            {conferences.slice(0, 6).map((c) => (
              <div key={c._id} className="p-4">
                <p className="font-bold text-slate-800 text-sm">{c.student?.name || '—'}</p>
                <p className="text-xs text-slate-500">
                  {new Date(c.date).toLocaleDateString()} {c.time ? `at ${c.time}` : ''}
                </p>
                {c.location && <p className="text-[10px] text-slate-400 mt-1">{c.location}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-slate-900 text-white rounded-2xl p-6 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
        <p className="text-sm text-slate-300">
          Tip: cases with <span className="text-amber-300 font-bold">{settings.criticalTotalAbsences}+</span> total
          absences or <span className="text-amber-300 font-bold">{settings.consecutiveAbsenceThreshold}+</span> consecutive
          absences are auto-flagged by the AI Alerts module.
        </p>
      </div>
    </div>
  );
}

function Tile({ label, value, icon, accent, onClick }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper onClick={onClick}
      className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200 text-left transition-all ${onClick ? 'hover:border-brand-400 hover:shadow' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <span className={accent}>{icon}</span>
      </div>
      <h2 className={`text-3xl font-black ${accent}`}>{value}</h2>
    </Wrapper>
  );
}
