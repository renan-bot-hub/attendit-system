import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle, XCircle, FileEdit, X } from 'lucide-react';
import { conferenceService } from '../../services/conferenceService';

// Disciplinary Actions & Conferences (manuscript Fig. 18). POD schedules parent
// conferences, tracks attendance/outcome, and closes them.
const STATUS_TABS = ['All', 'Scheduled', 'Completed', 'Cancelled'];

export default function Conferences() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('Scheduled');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ status: 'Completed', outcome: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await conferenceService.list();
      setItems(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conferences.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => tab === 'All' ? items : items.filter((c) => c.status === tab), [items, tab]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await conferenceService.update(editing._id, { status: form.status, outcome: form.outcome });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  const statusBadge = (s) => {
    const map = {
      Scheduled: 'bg-blue-50 text-blue-700',
      Completed: 'bg-emerald-50 text-emerald-700',
      Cancelled: 'bg-slate-100 text-slate-600',
    };
    return <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${map[s]}`}>{s}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarDays className="w-7 h-7 text-blue-500" /> Disciplinary Actions & Conferences
        </h1>
        <p className="text-slate-500 mt-2">Track parent–teacher conferences scheduled by the Prefect of Discipline.</p>
      </div>

      {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>{t}</button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? <p className="p-6 text-center text-slate-500 text-sm">Loading…</p>
        : filtered.length === 0 ? <p className="p-6 text-center text-slate-400 text-sm">No conferences in this tab.</p>
        : (
          <div className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <div key={c._id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800">{c.student?.name || '—'}</h3>
                    <p className="text-xs text-slate-500">
                      {c.student?.studentId || '—'} • {c.student?.section || '—'}
                    </p>
                  </div>
                  {statusBadge(c.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-600">
                  <div><b>Date:</b> {new Date(c.date).toLocaleDateString()}</div>
                  <div><b>Time:</b> {c.time || '—'}</div>
                  <div><b>Location:</b> {c.location || '—'}</div>
                  <div><b>Risk:</b> {c.caseRef?.riskLevel || '—'}</div>
                </div>
                {c.attendees?.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">Attendees: {c.attendees.join(', ')}</p>
                )}
                {c.agenda && <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{c.agenda}</p>}
                {c.outcome && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Outcome</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.outcome}</p>
                  </div>
                )}

                {c.status === 'Scheduled' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setEditing(c); setForm({ status: 'Completed', outcome: '' }); }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Mark Completed
                    </button>
                    <button
                      onClick={() => { setEditing(c); setForm({ status: 'Cancelled', outcome: '' }); }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                )}
                {c.status !== 'Scheduled' && (
                  <button
                    onClick={() => { setEditing(c); setForm({ status: c.status, outcome: c.outcome || '' }); }}
                    className="mt-3 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-1"
                  >
                    <FileEdit className="w-3 h-3" /> Edit outcome
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Update Conference</h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">{editing.student?.name} • {new Date(editing.date).toLocaleDateString()}</p>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="conf-input">
                  <option>Scheduled</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Outcome notes</label>
                <textarea value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} rows={4}
                  className="conf-input" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.conf-input{width:100%;padding:.5rem .75rem;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.875rem;background:#fff;outline:none}.conf-input:focus{box-shadow:0 0 0 2px rgba(59,130,246,.5);border-color:#3b82f6}`}</style>
    </div>
  );
}
