// Parent Documents review (Fig. 13). Teacher accepts or rejects
// excuse letters / health certs submitted from the mobile app.

import React, { useEffect, useMemo, useState } from 'react';
import {
  FolderCheck, CheckCircle, XCircle, Clock, FileText, FileDown, Search, Trash2,
} from 'lucide-react';
import { documentService } from '../../services/documentService';
import { authService } from '../../services/authService';

// Parent Documents review (manuscript Fig. 13). Teachers review excuse letters
// and health certificates submitted by parents from the mobile app and accept
// or reject them.
export default function ParentDocuments() {
  const isAdmin = authService.getCurrentUser()?.role === 'admin';
  const [docs, setDocs] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, accepted: 0, rejected: 0, total: 0 });
  const [tab, setTab] = useState('Pending');     // Pending | Accepted | Rejected | All
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        documentService.list(),
        documentService.summary(),
      ]);
      setDocs(listRes.data);
      setSummary(sumRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = docs;
    if (tab === 'Pending')  list = list.filter((d) => d.status === 'Pending Review');
    if (tab === 'Accepted') list = list.filter((d) => d.status === 'Accepted');
    if (tab === 'Rejected') list = list.filter((d) => d.status === 'Rejected');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        (d.student?.name || '').toLowerCase().includes(q) ||
        (d.documentType || '').toLowerCase().includes(q));
    }
    return list;
  }, [docs, tab, search]);

  const handleDelete = async (d) => {
    if (!window.confirm(`Delete this ${d.documentType.toLowerCase()} for ${d.student?.name || 'student'}?`)) return;
    try {
      await documentService.remove(d._id);
      setDocs((cur) => cur.filter((x) => x._id !== d._id));
      load();  // refresh summary counts
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const review = async (id, status) => {
    try {
      const res = await documentService.review(id, status, reviewNote);
      setDocs((cur) => cur.map((d) => (d._id === id ? res.data : d)));
      if (selected?._id === id) setSelected(res.data);
      load();  // refresh summary
      setReviewNote('');
    } catch (err) {
      setError(err.response?.data?.message || 'Review failed.');
    }
  };

  const statusBadge = (s) => {
    const map = {
      'Pending Review': 'bg-amber-50 text-amber-700',
      'Accepted':       'bg-emerald-50 text-emerald-700',
      'Rejected':       'bg-rose-50 text-rose-700',
    };
    return <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${map[s] || 'bg-slate-100 text-slate-600'}`}>{s}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <FolderCheck className="w-7 h-7 text-blue-500" /> Parent Documents
        </h1>
        <p className="text-slate-500 mt-2">
          Review excuse letters and health certificates submitted by parents from the mobile app.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CountTile active={tab === 'All'}      label="Total"    value={summary.total}    onClick={() => setTab('All')} />
        <CountTile active={tab === 'Pending'}  label="Pending"  value={summary.pending}  onClick={() => setTab('Pending')}  accent="text-amber-600"   icon={<Clock className="w-4 h-4" />} />
        <CountTile active={tab === 'Accepted'} label="Accepted" value={summary.accepted} onClick={() => setTab('Accepted')} accent="text-emerald-600" icon={<CheckCircle className="w-4 h-4" />} />
        <CountTile active={tab === 'Rejected'} label="Rejected" value={summary.rejected} onClick={() => setTab('Rejected')} accent="text-rose-600"    icon={<XCircle className="w-4 h-4" />} />
      </div>

      {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student or type…"
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? <p className="p-8 text-center text-slate-500">Loading…</p>
        : filtered.length === 0 ? <p className="p-8 text-center text-slate-400 text-sm">No documents in this tab.</p>
        : (
          <div className="divide-y divide-slate-100">
            {filtered.map((d) => (
              <div key={d._id} className="p-4 hover:bg-slate-50">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <h3 className="font-bold text-slate-800 text-sm">{d.student?.name || 'Unknown'}</h3>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {d.documentType}
                      </span>
                      {statusBadge(d.status)}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {d.student?.studentId || '—'} • {d.student?.section || '—'} •
                      Parent: {d.parentName || d.student?.parentName || '—'} •
                      Absence: {d.absenceDate ? new Date(d.absenceDate).toLocaleDateString() : '—'}
                    </p>
                    {d.reason && <p className="text-sm text-slate-700 mt-1 line-clamp-2">{d.reason}</p>}
                    {d.fileName && (
                      <button className="mt-2 text-blue-600 text-xs font-bold inline-flex items-center hover:text-blue-800">
                        <FileDown className="w-3 h-3 mr-1" /> {d.fileName}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    {d.status === 'Pending Review' ? (
                      <button onClick={() => setSelected(d)} className="text-xs font-bold text-blue-600 hover:text-blue-800">Review</button>
                    ) : (
                      <p className="text-[10px] text-slate-400">
                        Reviewed {d.reviewedAt ? new Date(d.reviewedAt).toLocaleDateString() : ''}
                      </p>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleDelete(d)} className="text-xs font-bold text-rose-600 hover:text-rose-800 inline-flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Review Document</h3>
              <button onClick={() => { setSelected(null); setReviewNote(''); }} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Row label="Student" value={`${selected.student?.name || '—'} (${selected.student?.section || '—'})`} />
              <Row label="Type" value={selected.documentType} />
              <Row label="Parent" value={selected.parentName || selected.student?.parentName || '—'} />
              <Row label="Absence Date" value={selected.absenceDate ? new Date(selected.absenceDate).toLocaleDateString() : '—'} />
              {selected.reason && <Row label="Reason" value={selected.reason} block />}
              {selected.fileName && (
                <div className="bg-slate-100 border border-dashed border-slate-300 rounded-lg p-3 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700">{selected.fileName}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Review note (optional)</label>
                <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { review(selected._id, 'Rejected'); setSelected(null); }} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-sm flex items-center">
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </button>
                <button onClick={() => { review(selected._id, 'Accepted'); setSelected(null); }} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" /> Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CountTile({ label, value, accent, onClick, active, icon }) {
  return (
    <button onClick={onClick} className={`bg-white p-4 rounded-2xl border text-left transition-all ${active ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}>
      <div className="flex justify-between items-start mb-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        {icon && <span className={accent}>{icon}</span>}
      </div>
      <p className={`text-2xl font-black ${accent || 'text-slate-800'}`}>{value}</p>
    </button>
  );
}

function Row({ label, value, block }) {
  return (
    <div className={block ? '' : 'flex justify-between items-center'}>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm text-slate-700 ${block ? 'mt-1 whitespace-pre-wrap' : 'font-medium'}`}>{value}</p>
    </div>
  );
}
