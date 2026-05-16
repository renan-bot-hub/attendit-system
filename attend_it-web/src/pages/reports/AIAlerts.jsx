// AI Alerts & Recommendations (Fig. 10). Lists pattern-flagged students
// with risk score and prescriptive actions; supports Under Review,
// Escalate to POD, and Dismiss.

import React, { useEffect, useState } from 'react';
import {
  Sparkles, RefreshCw, AlertTriangle, ShieldAlert, BellRing, ArrowUpRight,
  CheckCircle2, XCircle, Send,
} from 'lucide-react';
import { aiAlertService } from '../../services/aiAlertService';

// AI Alerts & Recommendations (manuscript Fig. 10). Cards show the flagged
// pattern, risk score, and the system's prescriptive recommendations. Teachers
// can mark Under Review, Escalate to POD (creates a Case), or Dismiss.
export default function AIAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status    = statusFilter;
      if (riskFilter   !== 'All') params.riskLevel = riskFilter;
      const res = await aiAlertService.list(params);
      setAlerts(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, riskFilter]);

  const runAnalysis = async () => {
    setRunning(true);
    setError('');
    setOk('');
    try {
      const res = await aiAlertService.run();
      setOk(`Analysis complete — ${res.data.created} new, ${res.data.refreshed} refreshed.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Run failed.');
    } finally {
      setRunning(false);
      setTimeout(() => setOk(''), 4000);
    }
  };

  const setStatus = async (id, status) => {
    try {
      const res = await aiAlertService.update(id, { status });
      setAlerts((cur) => cur.map((a) => (a._id === id ? { ...a, ...res.data } : a)));
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  const escalate = async (id) => {
    try {
      await aiAlertService.escalate(id);
      setOk('Escalated to POD — case opened.');
      load();
      setTimeout(() => setOk(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Escalation failed.');
    }
  };

  const riskStyle = (lvl) => ({
    'Critical':    'bg-red-100 text-red-700 border-red-200',
    'High Risk':   'bg-orange-100 text-orange-700 border-orange-200',
    'Medium Risk': 'bg-amber-100 text-amber-700 border-amber-200',
    'Low Risk':    'bg-emerald-100 text-emerald-700 border-emerald-200',
  }[lvl] || 'bg-slate-100 text-slate-700 border-slate-200');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-wrap gap-4 justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-violet-500" /> AI Alerts & Recommendations
          </h1>
          <p className="text-slate-500 mt-2">
            Pattern-detected attendance risks with prescriptive next-step recommendations.
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={running}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Running…' : 'Run Pattern Analysis'}
        </button>
      </div>

      {error && <Banner type="error">{error}</Banner>}
      {ok    && <Banner type="ok">{ok}</Banner>}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-wrap gap-3">
        <Select label="Status" value={statusFilter} onChange={setStatusFilter}
          options={['All', 'New', 'Under Review', 'Actioned', 'Dismissed']} />
        <Select label="Risk Level" value={riskFilter} onChange={setRiskFilter}
          options={['All', 'Critical', 'High Risk', 'Medium Risk', 'Low Risk']} />
      </div>

      {loading ? (
        <p className="text-slate-400 p-8 text-center">Loading…</p>
      ) : alerts.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500">
          <Sparkles className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="font-medium">No alerts match these filters.</p>
          <p className="text-sm mt-1">Try "Run Pattern Analysis" to scan for new ones.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {alerts.map((a) => (
            <div key={a._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {a.section || a.student?.section || '—'} • Flagged {new Date(a.flaggedOn).toLocaleDateString()}
                  </p>
                  <h3 className="text-lg font-black text-slate-900 leading-tight mt-1">
                    {a.student?.name || 'Unknown student'}
                  </h3>
                  <p className="text-xs text-slate-500">{a.student?.studentId || '—'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${riskStyle(a.riskLevel)}`}>
                  {a.riskLevel}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <Stat label="Pattern" value={a.pattern} mono />
                <Stat label="Detail" value={a.patternDetail} mono />
                <Stat label="Risk Score" value={`${a.riskScore}/100`} accent={a.riskScore >= 75 ? 'text-red-600' : a.riskScore >= 55 ? 'text-orange-600' : 'text-amber-600'} />
              </div>

              {a.recommendations?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Recommendations</p>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {a.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <ArrowUpRight className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${
                  a.status === 'New' ? 'bg-blue-50 text-blue-700' :
                  a.status === 'Under Review' ? 'bg-amber-50 text-amber-700' :
                  a.status === 'Actioned' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>{a.status}</span>

                <div className="ml-auto flex flex-wrap gap-2">
                  {a.status !== 'Actioned' && a.status !== 'Dismissed' && (
                    <button
                      onClick={() => setStatus(a._id, 'Under Review')}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center gap-1"
                    >
                      <BellRing className="w-3 h-3" /> Mark Under Review
                    </button>
                  )}
                  {a.status !== 'Actioned' && (
                    <button
                      onClick={() => escalate(a._id)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                    >
                      <ShieldAlert className="w-3 h-3" /> Escalate to POD
                    </button>
                  )}
                  {a.status !== 'Dismissed' && (
                    <button
                      onClick={() => setStatus(a._id, 'Dismissed')}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" /> Dismiss
                    </button>
                  )}
                </div>
              </div>

              {a.student?.parentEmail && (
                <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
                  <Send className="w-3 h-3" /> Parent: {a.student.parentName || a.student.parentEmail}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent, mono }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold ${accent || 'text-slate-800'} ${mono ? 'font-mono tracking-tight' : ''}`}>{value || '—'}</p>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex flex-col">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Banner({ type, children }) {
  const cls = type === 'error'
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700';
  const Icon = type === 'error' ? AlertTriangle : CheckCircle2;
  return (
    <div className={`mb-4 p-3 rounded-lg border text-sm flex items-center gap-2 ${cls}`}>
      <Icon className="w-4 h-4" /> {children}
    </div>
  );
}
