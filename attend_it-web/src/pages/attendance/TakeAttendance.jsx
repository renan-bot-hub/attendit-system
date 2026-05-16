// Take Attendance — manual roster checklist for teachers. Includes a
// quick "create new session" modal and bulk "Mark All Present" action.

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Save, CheckSquare, Plus } from 'lucide-react';
import { attendService } from '../../services/attendService';
import { userService } from '../../services/userService';
import { sessionService } from '../../services/sessionService';

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
        // restore last-used session if still valid, else pick most recent active
        const saved = localStorage.getItem('activeSessionId');
        const validSaved = sessionsRes.data.find((s) => s._id === saved);
        if (validSaved) setActiveSessionId(saved);
        else if (sessionsRes.data.length > 0) setActiveSessionId(sessionsRes.data[0]._id);
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

  // Update a single student's status in local state
  const handleStatusChange = (id, newStatus) => {
    setStudents(students.map((s) => (s._id === id ? { ...s, status: newStatus } : s)));
  };

  // Set every student to the same status at once
  const markAll = (status) => {
    setStudents(students.map((s) => ({ ...s, status })));
  };

  // Submit the whole roster to the backend for the active session
  const handleSave = async () => {
    if (!activeSessionId) {
      setError('Please select or create a session first.');
      return;
    }
    if (students.length === 0) {
      setError('No students to mark. Add students via User Management.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const records = students.map((s) => ({ studentId: s._id, status: s.status }));
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
      setSessions([res.data, ...sessions]);
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

  const activeSession = sessions.find((s) => s._id === activeSessionId);

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Take Attendance</h1>
          <p className="text-slate-500 mt-2">Manual attendance checklist for teachers.</p>
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
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No sessions yet — create one to start.</p>
          ) : (
            <select
              value={activeSessionId}
              onChange={(e) => setActiveSessionId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sessions.map((s) => (
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
            <p className="text-xs text-slate-500">{students.length} Students Enrolled</p>
          </div>
          <button
            onClick={() => markAll('Present')}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <CheckSquare className="w-4 h-4 mr-2" /> Mark All Present
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {students.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              No students found. Add students through User Management.
            </div>
          )}
          {students.map((student) => (
            <div key={student._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                  {student.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{student.name}</h3>
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
            disabled={saving || !activeSessionId || students.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center transition-colors shadow-sm disabled:opacity-60"
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
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Section *</label>
                <input
                  required
                  value={newSession.section}
                  onChange={(e) => setNewSession({ ...newSession, section: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Grade 10 - A"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                <input
                  value={newSession.subject}
                  onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">
                  Cancel
                </button>
                <button type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 shadow-sm">
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
