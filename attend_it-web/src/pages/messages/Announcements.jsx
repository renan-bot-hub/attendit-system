// School-wide Announcements (Fig. 15). Admins and POD publish;
// everyone reads. Optional per-section targeting.

import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, X, Trash2 } from 'lucide-react';
import { announcementService } from '../../services/announcementService';
import { authService } from '../../services/authService';

// School-wide Announcements (manuscript Fig. 15). Admins and POD post; everyone
// else reads. We deliberately keep the format simple — title + body + optional
// target sections — to match the read-only feed shown in the manuscript.
export default function Announcements() {
  const me = authService.getCurrentUser();
  const canPost = me?.role === 'admin' || me?.role === 'staff';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', targetSections: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await announcementService.list();
      setItems(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const targetSections = form.targetSections
        ? form.targetSections.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      await announcementService.create({ title: form.title, body: form.body, targetSections });
      setShowNew(false);
      setForm({ title: '', body: '', targetSections: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Post failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await announcementService.remove(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-brand-500" /> Announcements
          </h1>
          <p className="text-slate-500 mt-2">School-wide notices.</p>
        </div>
        {canPost && (
          <button onClick={() => setShowNew(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm">
            <Plus className="w-4 h-4 mr-1" /> New Announcement
          </button>
        )}
      </div>

      {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      {loading ? <p className="p-8 text-slate-500 text-center">Loading…</p>
      : items.length === 0 ? <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500">
          <Megaphone className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="font-medium">No announcements posted yet.</p>
        </div>
      : (
        <div className="space-y-4">
          {items.map((a) => (
            <article key={a._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{a.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Posted by {a.postedBy?.name || '—'} ({a.postedBy?.role || '—'}) on {new Date(a.publishedAt || a.createdAt).toLocaleString()}
                  </p>
                </div>
                {(me?.role === 'admin' || a.postedBy?._id === me?.id) && (
                  <button onClick={() => remove(a._id)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{a.body}</p>
              {a.targetSections?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {a.targetSections.map((s) => (
                    <span key={s} className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2 py-1 rounded">{s}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">New Announcement</h3>
              <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={create} className="p-6 space-y-4">
              <Field label="Title *">
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="ann-input" />
              </Field>
              <Field label="Body *">
                <textarea required rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="ann-input" />
              </Field>
              <Field label="Target Sections (comma-separated, leave blank for everyone)">
                <input value={form.targetSections} onChange={(e) => setForm({ ...form, targetSections: e.target.value })}
                  placeholder="e.g. Grade 10 - A, Grade 11 - B"
                  className="ann-input" />
              </Field>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-sm disabled:opacity-60">
                  {submitting ? 'Posting…' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.ann-input{width:100%;padding:.5rem .75rem;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.875rem;background:#fff;outline:none}.ann-input:focus{box-shadow:0 0 0 2px rgba(155,13,46,.25);border-color:#9B0D2E}`}</style>
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
