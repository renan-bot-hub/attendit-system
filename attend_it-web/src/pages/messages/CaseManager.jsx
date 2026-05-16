// Cases & Interventions (Fig. 11). Tab counters (Total/Open/Escalated/
// Resolved), risk-level filter, master/detail layout, escalate-to-POD,
// and admin-only delete.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, FileText, CheckCircle, XCircle, AlertCircle, ShieldAlert,
  Eye, Plus, X, FileDown, Trash2,
} from 'lucide-react';
import { caseService } from '../../services/caseService';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';

// Cases & Interventions (manuscript Fig. 11).
// Layout: counts strip + tabs (Total/Open/Escalated/Resolved) + risk filter +
// master/detail. Teachers/Staff/Admins can open cases for any student.
export default function CaseManager() {
  const currentUser = authService.getCurrentUser();
  const role = currentUser?.role;
  const isStaff  = role === 'teacher' || role === 'admin' || role === 'staff';
  const isPOD    = role === 'staff'   || role === 'admin';
  const isAdmin  = role === 'admin';

  const [cases, setCases] = useState([]);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('All');             // All | Open | Escalated | Resolved
  const [risk, setRisk] = useState('All');           // All | Critical | High Risk | Medium Risk | Low Risk
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [newCase, setNewCase] = useState({
    studentId: '', type: 'Attendance Intervention', description: '',
    fileName: '', riskLevel: 'Medium Risk',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await caseService.getCases();
      setCases(res.data);
      if (res.data.length > 0 && !selected) setSelected(res.data[0]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cases.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await userService.getAllUsers();
      setStudents(res.data.filter((u) => u.role === 'student'));
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchCases();
    if (isStaff) fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => ({
    total:     cases.length,
    open:      cases.filter((c) => ['Open', 'Pending'].includes(c.status)).length,
    escalated: cases.filter((c) => c.status === 'Escalated').length,
    resolved:  cases.filter((c) => ['Resolved', 'Approved', 'Rejected'].includes(c.status)).length,
  }), [cases]);

  const filtered = useMemo(() => {
    let list = cases;
    if (tab === 'Open')      list = list.filter((c) => ['Open', 'Pending'].includes(c.status));
    if (tab === 'Escalated') list = list.filter((c) => c.status === 'Escalated');
    if (tab === 'Resolved')  list = list.filter((c) => ['Resolved', 'Approved', 'Rejected'].includes(c.status));
    if (risk !== 'All')      list = list.filter((c) => c.riskLevel === risk);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        (c.student?.name || '').toLowerCase().includes(q) ||
        (c.student?.studentId || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [cases, tab, risk, search]);

  const action = async (id, status) => {
    try {
      const res = await caseService.updateStatus(id, status);
      setCases((cur) => cur.map((c) => (c._id === id ? res.data : c)));
      if (selected?._id === id) setSelected(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  const escalate = async (id) => {
    try {
      await caseService.escalate(id);
      fetchCases();
    } catch (err) {
      setError(err.response?.data?.message || 'Escalation failed.');
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete this case for ${c.student?.name || 'student'}? This cannot be undone.`)) return;
    try {
      await caseService.remove(c._id);
      setCases((cur) => cur.filter((x) => x._id !== c._id));
      if (selected?._id === c._id) setSelected(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await caseService.createCase(newCase);
      setCases([res.data, ...cases]);
      setSelected(res.data);
      setShowNew(false);
      setNewCase({ studentId: '', type: 'Attendance Intervention', description: '', fileName: '', riskLevel: 'Medium Risk' });
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      Open:      'bg-blue-50 text-blue-700',
      Pending:   'bg-amber-50 text-amber-700',
      Escalated: 'bg-red-50 text-red-700',
      Approved:  'bg-emerald-50 text-emerald-700',
      Rejected:  'bg-rose-50 text-rose-700',
      Resolved:  'bg-emerald-50 text-emerald-700',
    };
    return <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
  };

  const riskBadge = (lvl) => {
    const map = {
      'Critical':    'bg-red-100 text-red-700',
      'High Risk':   'bg-orange-100 text-orange-700',
      'Medium Risk': 'bg-amber-100 text-amber-700',
      'Low Risk':    'bg-emerald-100 text-emerald-700',
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${map[lvl] || 'bg-slate-100 text-slate-600'}`}>{lvl}</span>;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '—';

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-4 flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cases & Interventions</h1>
          <p className="text-slate-500 mt-2">Track open interventions, escalations, and reviewed cases.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1" /> New Case
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <CountTile active={tab === 'All'}        label="Total"     value={counts.total}     onClick={() => setTab('All')} />
        <CountTile active={tab === 'Open'}       label="Open"      value={counts.open}      onClick={() => setTab('Open')} accent="text-blue-600" />
        <CountTile active={tab === 'Escalated'}  label="Escalated" value={counts.escalated} onClick={() => setTab('Escalated')} accent="text-red-600" />
        <CountTile active={tab === 'Resolved'}   label="Resolved"  value={counts.resolved}  onClick={() => setTab('Resolved')} accent="text-emerald-600" />
      </div>

      {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="flex-1 flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-white">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All</option>
              <option>Critical</option>
              <option>High Risk</option>
              <option>Medium Risk</option>
              <option>Low Risk</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && <p className="p-6 text-center text-slate-500 text-sm">Loading cases…</p>}
            {!loading && filtered.length === 0 && <p className="p-6 text-center text-slate-400 text-sm">No cases.</p>}

            {filtered.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelected(c)}
                className={`w-full text-left p-4 border-b border-slate-50 transition-colors ${
                  selected?._id === c._id ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{c.student?.name || 'Unknown'}</h3>
                    <p className="text-xs text-slate-500">{c.student?.studentId || '—'} • {c.student?.section || '—'}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">{formatDate(c.createdAt)}</span>
                </div>
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">{c.type}</span>
                  {riskBadge(c.riskLevel)}
                  {statusBadge(c.status)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="w-2/3 flex flex-col bg-slate-50/30">
          {selected ? (
            <>
              <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-slate-800">{selected.student?.name || 'Unknown'}</h2>
                    {statusBadge(selected.status)}
                    {riskBadge(selected.riskLevel)}
                  </div>
                  <p className="text-sm text-slate-500 font-medium">
                    ID: {selected.student?.studentId || '—'} • Section: {selected.student?.section || '—'} • Case: {selected._id?.slice(-6).toUpperCase()}
                  </p>
                  {selected.student?.parentName && (
                    <p className="text-xs text-slate-400 mt-1">Parent: {selected.student.parentName} ({selected.student.parentEmail || selected.student.parentPhone || '—'})</p>
                  )}
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <Card title="Description">
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selected.description}</p>
                </Card>

                {selected.openedBy && (
                  <Card title="Opened By">
                    <p className="text-slate-700 text-sm">
                      <span className="font-bold">{selected.openedBy.name}</span>{' '}
                      <span className="text-slate-400">({selected.openedBy.role})</span>{' '}
                      — {formatDate(selected.createdAt)}
                    </p>
                  </Card>
                )}

                {selected.reviewedBy && (
                  <Card title="Review">
                    <p className="text-slate-700 text-sm">
                      <span className="font-bold">{selected.reviewedBy.name}</span>{' '}
                      <span className="text-slate-400">({selected.reviewedBy.role})</span>{' '}
                      — {formatDate(selected.reviewedAt)}
                    </p>
                    {selected.reviewNote && <p className="text-slate-600 text-sm mt-1">{selected.reviewNote}</p>}
                  </Card>
                )}

                {selected.fileName && (
                  <Card title="Attached Document">
                    <div className="bg-slate-100 border border-dashed border-slate-300 rounded-lg p-4 flex items-center gap-3">
                      <FileText className="w-6 h-6 text-slate-400" />
                      <p className="text-sm font-medium text-slate-700">{selected.fileName}</p>
                      <button className="ml-auto text-blue-600 text-xs font-bold hover:text-blue-800 flex items-center">
                        <FileDown className="w-3 h-3 mr-1" /> Download
                      </button>
                    </div>
                  </Card>
                )}
              </div>

              {isStaff && (
                <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 flex-wrap">
                  {['Open', 'Pending'].includes(selected.status) && (
                    <>
                      <button
                        onClick={() => escalate(selected._id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm flex items-center"
                      >
                        <ShieldAlert className="w-4 h-4 mr-2" /> Escalate to POD
                      </button>
                      <button
                        onClick={() => action(selected._id, 'Resolved')}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Mark Resolved
                      </button>
                    </>
                  )}
                  {selected.status === 'Escalated' && isPOD && (
                    <button
                      onClick={() => action(selected._id, 'Resolved')}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Close (Resolved)
                    </button>
                  )}
                  {['Resolved', 'Approved', 'Rejected'].includes(selected.status) && (
                    <button
                      onClick={() => action(selected._id, 'Open')}
                      className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold rounded-lg text-sm"
                    >
                      Reopen
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(selected)}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-sm flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Eye className="w-12 h-12 mb-4 text-slate-300" />
              <p className="font-medium text-lg text-slate-500">Select a case to view details</p>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-900">New Case</h3>
              <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <Field label="Student *">
                <select
                  required
                  value={newCase.studentId}
                  onChange={(e) => setNewCase({ ...newCase, studentId: e.target.value })}
                  className="cm-input"
                >
                  <option value="">Select student…</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.studentId ? `(${s.studentId})` : ''} {s.section ? `— ${s.section}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Type">
                <select value={newCase.type} onChange={(e) => setNewCase({ ...newCase, type: e.target.value })} className="cm-input">
                  <option>Attendance Intervention</option>
                  <option>Excuse Letter</option>
                  <option>Medical Certificate</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Risk Level">
                <select value={newCase.riskLevel} onChange={(e) => setNewCase({ ...newCase, riskLevel: e.target.value })} className="cm-input">
                  <option>Low Risk</option>
                  <option>Medium Risk</option>
                  <option>High Risk</option>
                  <option>Critical</option>
                </select>
              </Field>
              <Field label="Description *">
                <textarea
                  required rows={4}
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  className="cm-input"
                />
              </Field>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60 shadow-sm">
                  {submitting ? 'Submitting…' : 'Submit Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.cm-input{width:100%;padding:.5rem .75rem;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.875rem;background:#fff;outline:none}.cm-input:focus{box-shadow:0 0 0 2px rgba(59,130,246,.5);border-color:#3b82f6}`}</style>
    </div>
  );
}

function CountTile({ label, value, accent, onClick, active }) {
  return (
    <button onClick={onClick} className={`bg-white p-4 rounded-2xl border text-left transition-all ${active ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black mt-1 ${accent || 'text-slate-800'}`}>{value}</p>
    </button>
  );
}

function Card({ title, children }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">{children}</div>
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
