// Take Attendance — manual roster checklist for teachers. Includes a
// quick "create new session" modal and bulk "Mark All Present" action.

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Save,
  CheckSquare,
  Plus,
} from 'lucide-react';
import { attendService } from '../../services/attendService';
import { userService } from '../../services/userService';
import { sessionService } from '../../services/sessionService';
import {
  cleanStudentName,
  inferGradeLevel,
  normalizeSectionKey,
  sectionObjectComparator,
  studentInitials,
} from '../../utils/display';

// Class roster checklist for marking Present / Late / Absent and saving to a session
export default function TakeAttendance() {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Quick session creator
  const [showCreate, setShowCreate] = useState(false);
  const [newSession, setNewSession] = useState({ className: '', section: '', subject: '' });

  useEffect(() => {
    const init = async () => {
      try {
        const [studentsRes, sessionsRes] = await Promise.all([
          userService.getAllUsers(),
          sessionService.getSessions(),
        ]);
        const studentList = studentsRes.data
          .filter((u) => u.role === 'student' && u.isActive)
          .map((s) => ({ ...s, status: 'Present' }));
        setStudents(studentList);
        setSessions(sessionsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (activeSessionId) localStorage.setItem('activeSessionId', activeSessionId);
  }, [activeSessionId]);

  const usableSessions = useMemo(() => sessions
    .filter((session) => session.active !== false)
    .filter((session) => isSameLocalDate(session.date, new Date()))
    .filter((session) => countStudentsForSection(students, session.section) > 0)
    .sort((a, b) => String(a.section || '').localeCompare(String(b.section || ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    })), [sessions, students]);

  useEffect(() => {
    if (loading) return;

    const currentSession = usableSessions.find((session) => session._id === activeSessionId);
    if (currentSession) return;

    const saved = localStorage.getItem('activeSessionId');
    const savedSession = usableSessions.find((session) => session._id === saved);
    if (savedSession) {
      setActiveSessionId(savedSession._id);
      return;
    }

    if (usableSessions.length > 0) {
      setActiveSessionId(usableSessions[0]._id);
      return;
    }

    setActiveSessionId('');
    localStorage.removeItem('activeSessionId');
  }, [activeSessionId, loading, usableSessions]);

  const activeSession = usableSessions.find((s) => s._id === activeSessionId);
  const activeSessionSection = normalizeSectionKey(activeSession?.section);
  const rosterStudents = activeSessionSection
    ? students.filter((student) => normalizeSectionKey(student.section || student.gradeSection) === activeSessionSection)
    : [];
  const availableSections = useMemo(() => {
    const byName = new Map();
    for (const student of students) {
      const name = student.section || student.gradeSection;
      if (!name) continue;
      byName.set(name, { name, gradeLevel: student.gradeLevel || inferGradeLevel(name) });
    }
    return [...byName.values()].sort(sectionObjectComparator);
  }, [students]);

  // Update a single student's status in local state
  const handleStatusChange = (id, newStatus) => {
    setStudents((current) => current.map((s) => (s._id === id ? { ...s, status: newStatus } : s)));
  };

  // Set every student to the same status at once
  const markAll = (status) => {
    const rosterIds = new Set(rosterStudents.map((student) => student._id));
    setStudents((current) => current.map((s) => (rosterIds.has(s._id) ? { ...s, status } : s)));
  };

  // Submit the whole roster to the backend for the active session
  const handleSave = async () => {
    if (!activeSessionId) {
      setError('Please select or create a session first.');
      return;
    }
    if (rosterStudents.length === 0) {
      setError('No active students found for the selected session section.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const records = rosterStudents.map((s) => ({ studentId: s._id, status: s.status }));
      await attendService.submitManual(activeSessionId, records);
      setSuccessMsg('Attendance saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Create a new class session and select it as active
  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const res = await sessionService.createSession(newSession);
      setSessions((current) => [res.data, ...current]);
      setActiveSessionId(res.data._id);
      setShowCreate(false);
      setNewSession({ className: '', section: '', subject: '' });
      setSuccessMsg('Session created');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create session.');
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Take Attendance</h1>
          <p className="text-slate-500 mt-2">Manual attendance checklist for selected class sessions.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Date</p>
          <p className="text-slate-800 font-semibold">{today}</p>
        </div>
      </div>

      {/* Session bar */}
      <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Session</label>
          {usableSessions.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No sessions yet — create one to start.</p>
          ) : (
            <select
              value={activeSessionId}
              onChange={(e) => setActiveSessionId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {usableSessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.className} — {s.section} {s.subject ? `(${s.subject})` : ''} • {new Date(s.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" /> New Session
        </button>
        {activeSession && (
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-sm font-bold">
            {rosterStudents.length} enrolled
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{successMsg}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-800">
              {activeSession ? `${activeSession.className} • ${activeSession.section}` : 'No Session Selected'}
            </h2>
            <p className="text-xs text-slate-500">{rosterStudents.length} Students Enrolled</p>
          </div>
          <button
            onClick={() => markAll('Present')}
            className="text-sm font-bold text-brand-600 hover:text-brand-800 bg-brand-50 px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <CheckSquare className="w-4 h-4 mr-2" /> Mark All Present
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {rosterStudents.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              No active students found for this session section.
            </div>
          )}
          {rosterStudents.map((student) => (
            <div key={student._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                  {studentInitials(student.name)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{cleanStudentName(student.name)}</h3>
                  <p className="text-xs text-slate-500 font-medium">{student.studentId || student.email}</p>
                </div>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                {['Present', 'Late', 'Absent'].map((status) => {
                  const activeStyles = {
                    Present: 'bg-emerald-500 text-white shadow-sm',
                    Late:    'bg-amber-500 text-white shadow-sm',
                    Absent:  'bg-red-500 text-white shadow-sm',
                  };
                  const icons = {
                    Present: <CheckCircle className="w-4 h-4 mr-1.5" />,
                    Late:    <Clock className="w-4 h-4 mr-1.5" />,
                    Absent:  <XCircle className="w-4 h-4 mr-1.5" />,
                  };
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(student._id, status)}
                      className={`flex items-center px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                        student.status === status ? activeStyles[status] : 'text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {icons[status]} {status}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !activeSessionId || rosterStudents.length === 0}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center transition-colors shadow-sm disabled:opacity-60"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-black text-slate-900">New Session</h3>
            </div>
            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Class Name *</label>
                <input
                  required
                  value={newSession.className}
                  onChange={(e) => setNewSession({ ...newSession, className: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Section *</label>
                <select
                  required
                  value={newSession.section}
                  onChange={(e) => setNewSession({ ...newSession, section: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select section...</option>
                  {availableSections.map((section) => (
                    <option key={section.name} value={section.name}>
                      {section.name} {section.gradeLevel ? `(${section.gradeLevel})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                <input
                  value={newSession.subject}
                  onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Optional"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">
                  Cancel
                </button>
                <button type="submit"
                  className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg text-sm hover:bg-brand-700 shadow-sm">
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function countStudentsForSection(students = [], section = '') {
  const wanted = normalizeSectionKey(section);
  if (!wanted) return 0;
  return students.filter((student) =>
    normalizeSectionKey(student.section || student.gradeSection) === wanted
  ).length;
}

function isSameLocalDate(value, compareTo) {
  const left = new Date(value);
  const right = new Date(compareTo);
  if (Number.isNaN(left.getTime()) || Number.isNaN(right.getTime())) return false;

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
