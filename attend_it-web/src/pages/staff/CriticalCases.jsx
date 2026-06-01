// Critical Cases (Fig. 17). Escalated cases + students past the critical
// absence threshold. POD can schedule a conference or resolve inline.

import React, { useEffect, useMemo, useState } from 'react';
import { ShieldAlert, CalendarPlus, CheckCircle2, X } from 'lucide-react';
import { caseService } from '../../services/caseService';
import { conferenceService } from '../../services/conferenceService';
import { attendService } from '../../services/attendService';
import { useSchool } from '../../context/useSchool';

// Staff Critical Cases (manuscript Fig. 17). Shows students with 5+ absences
// (or whatever critical threshold the admin configured) plus all escalated
// cases. POD can schedule a conference inline or resolve a case.
export default function CriticalCases() {
  const { settings } = useSchool();
  const [cases, setCases] = useState([]);
  const [risk, setRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confFor, setConfFor] = useState(null);   // case being scheduled
  const [form, setForm] = useState({ date: '', time: '', location: '', agenda: '', attendees: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [casesRes, riskRes] = await Promise.all([
        caseService.getCases({ status: 'Escalated' }),
        attendService.getRiskAnalysis(),
      ]);
      setCases(casesRes.data);
      setRisk(riskRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load critical cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Combine: escalated cases + flagged students who hit the absence threshold but don't yet have a case
  const overThreshold = useMemo(() => {
    const threshold = settings.criticalTotalAbsences || 5;
    const inCases = new Set(cases.map((c) => c.student?._id?.toString()));
    return risk.filter((r) => r.absentCount >= threshold && !inCases.has(r.studentId?.toString()));
  }, [risk, cases, settings.criticalTotalAbsences]);

  const resolve = async (id) => {
    try {
      await caseService.updateStatus(id, 'Resolved');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Resolve failed.');
    }
  };

  const submitConference = async (e) => {
    e.preventDefault();
    try {
      await conferenceService.create({
        caseRef: confFor._id,
        date: form.date,
        time: form.time,
        location: form.location,
        agenda: form.agenda,
        attendees: form.attendees.split(',').map((a) => a.trim()).filter(Boolean),
      });
      setConfFor(null);
      setForm({ date: '', time: '', location: '', agenda: '', attendees: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Schedule failed.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-red-500" /> Critical Cases
        </h1>
        <p className="text-slate-500 mt-2">
          Students past the critical-absence threshold ({settings.criticalTotalAbsences || 5}+) and cases escalated for disciplinary action.
        </p>
      </div>

      {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <section className="mb-8">
        <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3">Escalated Cases</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? <p className="p-6 text-center text-slate-500 text-sm">Loading…</p>
          : cases.length === 0 ? <p className="p-6 text-center text-slate-400 text-sm">No escalated cases.</p>
          : (
            <div className="divide-y divide-slate-100">
              {cases.map((c) => (
                <div key={c._id} className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 text-sm">{c.student?.name}</h3>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded">{c.riskLevel}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{c.status}</span>
                    </div>
                    <p className="text-xs text-slate-500">{c.student?.studentId || '—'} • {c.student?.section || '—'} • {c.type}</p>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{c.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => setConfFor(c)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1">
                      <CalendarPlus className="w-3 h-3" /> Schedule
                    </button>
                    <button onClick={() => resolve(c._id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3">
          Students Past Threshold (no case opened yet)
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? <p className="p-6 text-center text-slate-500 text-sm">Loading…</p>
          : overThreshold.length === 0 ? <p className="p-6 text-center text-slate-400 text-sm">No students past the threshold without an open case.</p>
          : (
            <div className="divide-y divide-slate-100">
              {overThreshold.map((r) => (
                <div key={r.studentId} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.section || '—'} • {r.absentCount} absences ({r.consecutiveAbsences} consecutive)</p>
                  </div>
                  <span className="text-sm font-black text-red-600">{r.attendanceRate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {confFor && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Schedule Conference</h3>
              <button onClick={() => setConfFor(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitConference} className="p-6 space-y-4">
              <Row label="Case" value={`${confFor.student?.name} — ${confFor.type}`} />
              <Field label="Date *"><input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="cc-input" /></Field>
              <Field label="Time"><input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="02:00 PM" className="cc-input" /></Field>
              <Field label="Location"><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="POD Office" className="cc-input" /></Field>
              <Field label="Attendees (comma-separated)"><input value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} placeholder="Maria Santos (Parent), Mr. Reyes (Teacher)" className="cc-input" /></Field>
              <Field label="Agenda"><textarea rows={3} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} className="cc-input" /></Field>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setConfFor(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-sm">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.cc-input{width:100%;padding:.5rem .75rem;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.875rem;background:#fff;outline:none}.cc-input:focus{box-shadow:0 0 0 2px rgba(155,13,46,.25);border-color:#9B0D2E}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}
