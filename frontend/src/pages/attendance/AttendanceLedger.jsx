// Attendance Records (Fig. 9). Authoritative ledger with status, section,
// and Marked By filters; per-row Correct + admin-only Delete.

import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Check, Edit2, Filter, Trash2 } from 'lucide-react';
import { attendService } from '../../services/attendService';
import { authService } from '../../services/authService';
import {
  canonicalSectionName,
  cleanStudentName,
  sectionNameComparator,
} from '../../utils/display';

// Attendance Records (manuscript Fig. 9). Adds: status filter, section filter,
// "Marked By" column (Scan vs Manual). Inline correction modal keeps the
// existing per-row workflow.
export default function AttendanceLedger() {
  const isAdmin = authService.getCurrentUser()?.role === 'admin';
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('All');
  const [sectionFilter, setSection]   = useState('All');
  const [markedByFilter, setMarkedBy] = useState('All');
  const [dateFilter, setDateFilter]   = useState('Today');

  const [editing, setEditing] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAttendanceRecords = async () => {
    try {
      const res = await attendService.getLedger();
      setEntries(res.data);
      setError('');
    } catch {
      setError('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendanceRecords(); }, []);

  const sections = useMemo(() => {
    const set = new Set(entries.map((e) => entrySection(e)).filter(Boolean));
    return ['All', ...[...set].sort(sectionNameComparator)];
  }, [entries]);

  useEffect(() => {
    if (sectionFilter !== 'All' && !sections.includes(sectionFilter)) {
      setSection('All');
    }
  }, [sectionFilter, sections]);

  const filtered = useMemo(() => {
    return entries
      .filter((entry) => {
      const studentName = cleanStudentName(entry.studentId?.name || '');
      const rawName = entry.studentId?.name || '';
      const date = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString('en-US') : '';
      const query = search.toLowerCase();
      const matchesSearch =
        studentName.toLowerCase().includes(query) ||
        rawName.toLowerCase().includes(query) ||
        (entry.studentId?.studentId || '').toLowerCase().includes(query) ||
        date.includes(search);
      const matchesStatus  = statusFilter   === 'All' || entry.status   === statusFilter;
      const matchesSection = sectionFilter  === 'All' || entrySection(entry) === sectionFilter;
      const matchesMarked  = markedByFilter === 'All' || entry.markedBy === markedByFilter;
      const matchesDate = dateFilter === 'All' || isWithinDateFilter(entry.timestamp, dateFilter);
      return matchesSearch && matchesStatus && matchesSection && matchesMarked && matchesDate;
    })
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }, [entries, search, statusFilter, sectionFilter, markedByFilter, dateFilter]);

  const statusStyle = (s) => ({
    Present: 'bg-emerald-100 text-emerald-700',
    Late:    'bg-amber-100 text-amber-700',
    Absent:  'bg-rose-100 text-rose-700',
  }[s] || 'bg-slate-100 text-slate-700');

  const markedStyle = (m) => ({
    Scan:   'bg-brand-100 text-brand-700',
    Manual: 'bg-brand-100 text-brand-700',
    Auto:   'bg-slate-100 text-slate-600',
  }[m] || 'bg-slate-100 text-slate-600');

  const openCorrectionModal = (entry) => {
    setEditing(entry);
    setNewStatus(entry.status);
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Delete attendance entry for ${entry.studentId?.name || 'student'} on ${entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : '—'}?`)) return;
    try {
      await attendService.removeEntry(entry._id);
      setEntries((cur) => cur.filter((e) => e._id !== entry._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleSaveCorrection = async () => {
    if (!editing || !newStatus) return;
    setSaving(true);
    try {
      const res = await attendService.correctEntry(editing._id, newStatus);
      setEntries((cur) => cur.map((e) => (e._id === editing._id ? res.data : e)));
      setEditing(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save correction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Attendance Records</h1>
        <p className="text-slate-500 mt-2">The official authoritative record of all attendance data.</p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or date…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <Filter className="w-3 h-3" /> Filters
          </div>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="Today">Today</option>
            <option value="Week">This Week</option>
            <option value="Month">This Month</option>
            <option value="All">All Dates</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="All">All Status</option>
            <option>Present</option>
            <option>Late</option>
            <option>Absent</option>
          </select>
          <select value={sectionFilter} onChange={(e) => setSection(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            {sections.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={markedByFilter} onChange={(e) => setMarkedBy(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="All">All Sources</option>
            <option>Scan</option>
            <option>Manual</option>
            <option>Auto</option>
          </select>
        </div>

        {loading ? <p className="p-8 text-center text-slate-500">Loading attendance records…</p>
        : (
          <>
            <div className="grid grid-cols-12 gap-3 p-4 border-b border-slate-100 bg-white text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Student</div>
              <div className="col-span-2">Section</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Marked By</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            <div className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No records found.</div>
              ) : filtered.map((entry) => (
                <div key={entry._id} className="grid grid-cols-12 gap-3 p-4 items-center hover:bg-slate-50 transition-colors text-sm">
                  <div className="col-span-2 text-slate-600 font-medium">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString('en-US') : '—'}
                  </div>
                  <div className="col-span-3 font-bold text-slate-900 truncate">{cleanStudentName(entry.studentId?.name) || '—'}</div>
                  <div className="col-span-2 text-slate-600">{entrySection(entry) || '—'}</div>
                  <div className="col-span-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle(entry.status)}`}>{entry.status}</span>
                  </div>
                  <div className="col-span-1">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${markedStyle(entry.markedBy || 'Manual')}`}>
                      {entry.markedBy || 'Manual'}
                    </span>
                  </div>
                  <div className="col-span-2 text-right flex justify-end gap-3">
                    <button onClick={() => openCorrectionModal(entry)}
                      className="text-brand-600 font-bold text-sm hover:text-brand-800 inline-flex items-center">
                      <Edit2 className="w-3 h-3 mr-1.5" /> Correct
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDelete(entry)}
                        className="text-rose-600 font-bold text-sm hover:text-rose-800 inline-flex items-center">
                        <Trash2 className="w-3 h-3 mr-1.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Correct Attendance Record</h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Student</p>
                <p className="text-slate-900 font-medium">{cleanStudentName(editing.studentId?.name) || '—'}</p>
                <p className="text-xs text-slate-500">{entrySection(editing) || '—'} • Originally {editing.markedBy || 'Manual'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">New Status</p>
                <div className="flex gap-2">
                  {['Present', 'Late', 'Absent'].map((status) => (
                    <button key={status} onClick={() => setNewStatus(status)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border ${newStatus === status ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSaveCorrection} disabled={saving} className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg text-sm hover:bg-brand-700 disabled:opacity-60 flex items-center shadow-sm">
                <Check className="w-4 h-4 mr-1.5" /> {saving ? 'Saving…' : 'Save Correction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function entrySection(entry) {
  return canonicalSectionName(
    entry?.studentId?.section || entry?.studentId?.gradeSection || entry?.sessionId?.section || ''
  );
}

function isWithinDateFilter(value, filter) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);

  if (filter === 'Today') {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return date >= start && date < end;
  }

  if (filter === 'Week') {
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return date >= weekStart && date < weekEnd;
  }

  if (filter === 'Month') {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return date >= monthStart && date < monthEnd;
  }

  return true;
}
