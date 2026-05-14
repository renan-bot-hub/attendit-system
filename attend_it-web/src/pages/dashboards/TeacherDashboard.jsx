import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, MessageCircle, FileBarChart, X, AlertCircle, BookOpen, Users, Send,
} from 'lucide-react';
import { attendService } from '../../services/attendService';
import { sessionService } from '../../services/sessionService';
import { messageService } from '../../services/messageService';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { useSchool } from '../../context/SchoolContext';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const me = authService.getCurrentUser();
  const { settings } = useSchool();

  const [atRisk, setAtRisk] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, sRes, sumRes] = await Promise.all([
          attendService.getRiskAnalysis(),
          sessionService.getSessions(),
          attendService.getSummary(),
        ]);
        setAtRisk(rRes.data);
        setSessions(sRes.data);
        setSummary(sumRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleMessageStudent = (student) => {
    setSelectedStudent(student);
    setMessageText(`Hi, this is ${me?.name}. I noticed your attendance is at ${student.attendanceRate}%. Let's discuss how I can support you.`);
  };

  const handleSendMessage = async () => {
    if (!selectedStudent || !messageText.trim()) return;
    setSending(true);
    try {
      // Resolve recipient ID — risk records use studentId as the User._id
      await messageService.sendMessage(selectedStudent.studentId, messageText.trim());
      setSuccessMsg(`Message sent to ${selectedStudent.name}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setSelectedStudent(null);
      setMessageText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">

      <div className="mb-8 flex flex-wrap gap-4 justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Hello, {me?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-2">
            {me?.department || 'Faculty'} • {settings.schoolName} • AY {settings.academicYear}
          </p>
        </div>
        <button
          onClick={() => navigate('/attendance')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm"
        >
          <ClipboardCheck className="w-4 h-4" /> Take Attendance
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{successMsg}</div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPI label="My Sessions" value={loading ? '—' : sessions.length} accent="text-blue-600" icon={<BookOpen className="w-5 h-5" />} />
        <KPI label="Total Students" value={loading ? '—' : summary.totalStudents || 0} accent="text-emerald-600" icon={<Users className="w-5 h-5" />} />
        <KPI label="Overall Rate" value={loading ? '—' : `${summary.overallRate || 0}%`} accent="text-amber-600" icon={<FileBarChart className="w-5 h-5" />} />
        <KPI label="At-Risk" value={loading ? '—' : atRisk.filter((r) => r.riskLevel === 'Critical' || r.riskLevel === 'High Risk').length} accent="text-red-600" icon={<AlertCircle className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* At-risk students */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">At-Risk Students</h2>
            <p className="text-slate-500 text-sm">Below {settings.attendanceHighRiskBelow}% attendance</p>
          </div>
          {loading ? (
            <p className="p-6 text-slate-400 text-sm text-center">Loading…</p>
          ) : atRisk.length === 0 ? (
            <p className="p-6 text-slate-400 text-sm text-center">No data yet. Take some attendance to populate this.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {atRisk.slice(0, 8).map((r) => (
                <div key={r.studentId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-sm truncate">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.section || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          r.attendanceRate >= settings.attendanceModerateBelow ? 'bg-emerald-500' :
                          r.attendanceRate >= settings.attendanceHighRiskBelow ? 'bg-amber-500' :
                          r.attendanceRate >= settings.attendanceCriticalBelow ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${r.attendanceRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-black text-slate-900 w-12 text-right">{r.attendanceRate}%</span>
                  </div>
                  <button
                    onClick={() => handleMessageStudent(r)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Message
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-lg">My Sessions</h2>
            <button onClick={() => navigate('/attendance')} className="text-blue-600 text-sm font-bold hover:underline">
              +New
            </button>
          </div>
          {loading ? (
            <p className="p-6 text-slate-400 text-sm text-center">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="p-6 text-slate-400 text-sm text-center">No sessions yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.slice(0, 6).map((s) => (
                <div key={s._id} className="p-4">
                  <p className="font-bold text-slate-800 text-sm">{s.className}</p>
                  <p className="text-xs text-slate-500">{s.section} {s.subject ? `• ${s.subject}` : ''}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">
                    {new Date(s.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-900">Message {selectedStudent.name}</h3>
                <p className="text-xs text-slate-500">Attendance: {selectedStudent.attendanceRate}% • {selectedStudent.riskLevel}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <textarea
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !messageText.trim()}
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1"
                >
                  <Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, accent, icon }) {
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
