// Triggered Threads (Fig. 12). Teacher opens a thread about a student;
// parent/guardian conversations. Either side can Close / Reopen.

import React, { useEffect, useRef, useState } from 'react';
import {
  Search, Send, Plus, X, Lock, Unlock, MessageCircle, ShieldAlert,
} from 'lucide-react';
import { messageService } from '../../services/messageService';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';

// Triggered Threads (manuscript Fig. 12).
// Threads are teacher-initiated; parents only participate while the thread is
// Open. "Close Thread" ends the conversation; "Reopen Thread" brings it back.
export default function Threads() {
  const me = authService.getCurrentUser();
  const role = me?.role;

  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  const [showNew, setShowNew] = useState(false);
  const [students, setStudents] = useState([]);
  const [newThread, setNewThread] = useState({ studentId: '', topic: 'Attendance' });

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      const res = await messageService.listThreads(params);
      setThreads(res.data);
      if (res.data.length > 0 && !active) setActive(res.data[0]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load threads.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const res = await messageService.getMessages(id);
      setMessages(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages.');
    }
  };

  useEffect(() => {
    fetchThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (active?._id) fetchMessages(active._id);
  }, [active?._id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const canOpenThread = ['teacher', 'admin', 'staff'].includes(role);
  const canCloseThread = (t) =>
    role === 'admin' || (t?.teacher?._id === me?.id || t?.teacher === me?.id);

  const send = async (e) => {
    e.preventDefault();
    if (!active || !input.trim() || active.status === 'Closed') return;
    const text = input.trim();
    setInput('');
    try {
      const res = await messageService.sendMessage(active._id, text);
      setMessages((cur) => [...cur, res.data]);
      fetchThreads();
    } catch (err) {
      setError(err.response?.data?.message || 'Send failed.');
    }
  };

  const closeThread = async () => {
    try {
      await messageService.closeThread(active._id);
      fetchThreads();
      const refreshed = (await messageService.listThreads()).data.find((t) => t._id === active._id);
      if (refreshed) setActive(refreshed);
    } catch (err) {
      setError(err.response?.data?.message || 'Close failed.');
    }
  };

  const reopenThread = async () => {
    try {
      await messageService.reopenThread(active._id);
      fetchThreads();
      const refreshed = (await messageService.listThreads()).data.find((t) => t._id === active._id);
      if (refreshed) setActive(refreshed);
    } catch (err) {
      setError(err.response?.data?.message || 'Reopen failed.');
    }
  };

  const openNewModal = async () => {
    setShowNew(true);
    try {
      const res = await userService.getAllUsers();
      setStudents(res.data.filter((u) => u.role === 'student' && u.isActive));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students.');
    }
  };

  const createThread = async (e) => {
    e.preventDefault();
    if (!newThread.studentId) return;
    try {
      const res = await messageService.createThread(newThread);
      setShowNew(false);
      setNewThread({ studentId: '', topic: 'Attendance' });
      fetchThreads();
      setActive(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed.');
    }
  };

  const filtered = threads.filter((t) =>
    (t.student?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.topic || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-4 flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Triggered Threads</h1>
          <p className="text-slate-500 mt-2">
            Teacher-initiated parent or guardian conversations stay open until they are closed by an authorized user.
          </p>
        </div>
        {canOpenThread && (
          <button onClick={openNewModal} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm">
            <Plus className="w-4 h-4 mr-1" /> Open Thread
          </button>
        )}
      </div>

      {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="flex-1 flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        <div className="w-1/3 border-r border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search threads…"
                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option>All</option>
              <option>Open</option>
              <option>Closed</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && <p className="p-6 text-center text-slate-500 text-sm">Loading…</p>}
            {!loading && filtered.length === 0 && <p className="p-6 text-center text-slate-400 text-sm">No threads.</p>}

            {filtered.map((t) => (
              <button
                key={t._id}
                onClick={() => setActive(t)}
                className={`w-full text-left p-4 border-b border-slate-50 transition-colors ${
                  active?._id === t._id ? 'bg-brand-50/50 border-l-4 border-brand-500' : 'hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-800 text-sm truncate">{t.student?.name || 'Student'}</h3>
                  <span className="text-[10px] text-slate-400">{formatTime(t.lastMessageAt)}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {t.topic} • {t.student?.section || '—'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    t.status === 'Open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>{t.status}</span>
                  {t.caseRef && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-700 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Case
                    </span>
                  )}
                  {t.unread > 0 && <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{t.unread}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="w-2/3 flex flex-col bg-slate-50/30">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageCircle className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-medium text-slate-500">Select a thread to view messages.</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center">
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-800 truncate">
                    {active.student?.name || 'Student'} <span className="text-slate-400 font-normal">— {active.topic}</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Parent: {active.student?.parentName || active.student?.parentEmail || '—'} • Section: {active.student?.section || '—'}
                  </p>
                </div>
                {canCloseThread(active) && (
                  active.status === 'Open' ? (
                    <button onClick={closeThread} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg px-3 py-2 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Close Thread
                    </button>
                  ) : (
                    <button onClick={reopenThread} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg px-3 py-2 flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5" /> Reopen
                    </button>
                  )
                )}
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-3">
                {messages.length === 0 && <p className="text-center text-slate-400 text-sm">No messages yet.</p>}
                {messages.map((m) => {
                  const isMe = (m.sender?._id || m.sender) === me?.id;
                  return (
                    <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-brand-500 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">
                          {m.sender?.name || '—'} {m.sender?.role ? `(${m.sender.role})` : ''}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-brand-100' : 'text-slate-400'}`}>{formatTime(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <div className="p-4 bg-white border-t border-slate-200">
                {active.status === 'Closed' ? (
                  <p className="text-center text-sm text-slate-500 italic">Thread is closed — reopen to continue the conversation.</p>
                ) : (
                  <form onSubmit={send} className="flex items-center gap-3">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type a message…"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button type="submit" disabled={!input.trim()} className="p-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-full disabled:opacity-50">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-900">Open Thread</h3>
              <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={createThread} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student *</label>
                <select required value={newThread.studentId} onChange={(e) => setNewThread({ ...newThread, studentId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select student…</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} — {s.section || s.gradeLevel || '—'} {s.parentEmail ? `(parent: ${s.parentEmail})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Topic</label>
                <input value={newThread.topic} onChange={(e) => setNewThread({ ...newThread, topic: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-sm">Open</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
