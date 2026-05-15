import React, { useEffect, useMemo, useState } from 'react';
import {
  IdCard, Plus, X, Edit, Trash2, QrCode, RefreshCw, Search, Layers, Download,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { sectionService } from '../../services/sectionService';

// Student & Section Management (manuscript Fig. 22). Admin-only.
// Two tabs: Students (CRUD with parent contact + per-student QR backup
// regeneration) and Sections (CRUD with adviser assignment + student count).
// The QR shown here is the data-only token printed on the ID; the actual
// scanning happens on the mobile app.
export default function StudentManagement() {
  const [tab, setTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');

  // Student modal
  const [studentForm, setStudentForm] = useState(null);
  const [studentSubmitting, setStudentSubmitting] = useState(false);

  // Section modal
  const [sectionForm, setSectionForm] = useState(null);
  const [sectionSubmitting, setSectionSubmitting] = useState(false);

  // QR backup modal
  const [qrFor, setQrFor] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([userService.getAllUsers(), sectionService.list()]);
      const users = uRes.data;
      setStudents(users.filter((u) => u.role === 'student'));
      setTeachers(users.filter((u) => u.role === 'teacher'));
      setSections(sRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showOk = (msg) => { setOk(msg); setTimeout(() => setOk(''), 3000); };

  const filteredStudents = useMemo(() => {
    let list = students;
    if (sectionFilter !== 'All') list = list.filter((s) => s.section === sectionFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.studentId || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q));
    }
    return list;
  }, [students, sectionFilter, search]);

  // ---- Student CRUD ---------------------------------------------------------
  const openNewStudent = () => setStudentForm({
    _id: null, name: '', email: '', studentId: '', section: '', gradeLevel: '',
    parentName: '', parentEmail: '', parentPhone: '',
  });
  const openEditStudent = (s) => setStudentForm({ ...s });

  const saveStudent = async (e) => {
    e.preventDefault();
    setStudentSubmitting(true);
    try {
      if (studentForm._id) {
        await userService.updateUser(studentForm._id, { ...studentForm, role: 'student' });
        showOk('Student updated.');
      } else {
        await userService.createUser({ ...studentForm, role: 'student' });
        showOk('Student created — QR token generated.');
      }
      setStudentForm(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setStudentSubmitting(false);
    }
  };

  const deleteStudent = async (s) => {
    if (!window.confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    try {
      await userService.deleteUser(s._id);
      showOk('Student deleted.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const regenerateQr = async (s) => {
    if (!window.confirm(`Generate a new QR token for ${s.name}?\nThe old QR will stop working immediately.`)) return;
    try {
      const res = await userService.regenerateQr(s._id);
      setQrFor({ ...s, qrCode: res.data.qrCode });
      showOk('QR regenerated.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Regenerate failed.');
    }
  };

  // ---- Section CRUD ---------------------------------------------------------
  const openNewSection = () => setSectionForm({ _id: null, name: '', gradeLevel: '', adviser: '' });
  const openEditSection = (sec) => setSectionForm({ ...sec, adviser: sec.adviser?._id || '' });

  const saveSection = async (e) => {
    e.preventDefault();
    setSectionSubmitting(true);
    try {
      const payload = { name: sectionForm.name, gradeLevel: sectionForm.gradeLevel, adviser: sectionForm.adviser || null };
      if (sectionForm._id) {
        await sectionService.update(sectionForm._id, payload);
        showOk('Section updated.');
      } else {
        await sectionService.create(payload);
        showOk('Section created.');
      }
      setSectionForm(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSectionSubmitting(false);
    }
  };

  const deleteSection = async (sec) => {
    if (!window.confirm(`Delete section ${sec.name}?`)) return;
    try {
      await sectionService.remove(sec._id);
      showOk('Section deleted.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const downloadQrCard = () => {
    if (!qrFor) return;
    // Tiny printable card: name + ID + QR token text. Real QR rendering is
    // done by the mobile scanner; here we just hand over the printable token.
    const text =
      `Student: ${qrFor.name}\n` +
      `ID: ${qrFor.studentId || '—'}\n` +
      `Section: ${qrFor.section || '—'}\n` +
      `QR Token: ${qrFor.qrCode}\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${qrFor.studentId || 'student'}-qr.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <IdCard className="w-7 h-7 text-blue-500" /> Students & Sections
          </h1>
          <p className="text-slate-500 mt-2">Manage student records, sections, and QR backups.</p>
        </div>
      </div>

      {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
      {ok    && <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">{ok}</div>}

      <div className="flex gap-2 mb-4">
        <TabBtn active={tab === 'students'} onClick={() => setTab('students')}>Students</TabBtn>
        <TabBtn active={tab === 'sections'} onClick={() => setTab('sections')}>Sections</TabBtn>
      </div>

      {tab === 'students' ? (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-2">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name / ID / email…"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All</option>
                {sections.map((s) => <option key={s._id}>{s.name}</option>)}
              </select>
              <button onClick={openNewStudent} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm">
                <Plus className="w-4 h-4 mr-1" /> New Student
              </button>
            </div>

            {loading ? <p className="p-6 text-center text-slate-500">Loading…</p>
            : filteredStudents.length === 0 ? <p className="p-6 text-center text-slate-400">No students match these filters.</p>
            : (
              <div className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <div key={s._id} className="p-4 grid grid-cols-12 gap-3 items-center hover:bg-slate-50">
                    <div className="col-span-4 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{s.name}</p>
                      <p className="text-xs text-slate-500 truncate">{s.studentId || '—'} • {s.email}</p>
                    </div>
                    <div className="col-span-2 text-xs text-slate-600">{s.section || '—'}</div>
                    <div className="col-span-3 text-xs text-slate-600">
                      {s.parentName ? <>{s.parentName}<br/><span className="text-slate-400">{s.parentEmail || s.parentPhone || ''}</span></> : '—'}
                    </div>
                    <div className="col-span-3 flex justify-end gap-2 flex-wrap">
                      <button onClick={() => regenerateQr(s)} className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5" /> QR Backup
                      </button>
                      <button onClick={() => openEditStudent(s)} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => deleteStudent(s)} className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 italic">
            QR backup regenerates a fresh scan token for a student whose printed ID is lost. The mobile scanner picks up the new token immediately.
          </p>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-bold text-slate-600">{sections.length} section{sections.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={openNewSection} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm">
              <Plus className="w-4 h-4 mr-1" /> New Section
            </button>
          </div>
          {loading ? <p className="p-6 text-center text-slate-500">Loading…</p>
          : sections.length === 0 ? <p className="p-6 text-center text-slate-400">No sections yet.</p>
          : (
            <div className="divide-y divide-slate-100">
              {sections.map((sec) => (
                <div key={sec._id} className="p-4 grid grid-cols-12 gap-3 items-center hover:bg-slate-50">
                  <div className="col-span-3 font-bold text-slate-800 text-sm">{sec.name}</div>
                  <div className="col-span-2 text-xs text-slate-600">{sec.gradeLevel}</div>
                  <div className="col-span-3 text-xs text-slate-600">Adviser: {sec.adviser?.name || '—'}</div>
                  <div className="col-span-2 text-xs text-slate-600">{sec.studentCount} students</div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => openEditSection(sec)} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => deleteSection(sec)} className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Student modal --- */}
      {studentForm && (
        <Modal title={studentForm._id ? 'Edit Student' : 'New Student'} onClose={() => setStudentForm(null)}>
          <form onSubmit={saveStudent} className="space-y-4">
            <Field label="Full Name *">
              <input required value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} className="sm-input" />
            </Field>
            <Field label="Email *">
              <input required type="email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} className="sm-input" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Student ID">
                <input value={studentForm.studentId || ''} onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })} className="sm-input" />
              </Field>
              <Field label="Grade Level">
                <input value={studentForm.gradeLevel || ''} onChange={(e) => setStudentForm({ ...studentForm, gradeLevel: e.target.value })} className="sm-input" />
              </Field>
            </div>
            <Field label="Section">
              <select value={studentForm.section || ''} onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })} className="sm-input">
                <option value="">— None —</option>
                {sections.map((sec) => <option key={sec._id}>{sec.name}</option>)}
              </select>
            </Field>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Parent / Guardian (for mobile portal)</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Parent Name">
                  <input value={studentForm.parentName || ''} onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })} className="sm-input" />
                </Field>
                <Field label="Parent Email">
                  <input type="email" value={studentForm.parentEmail || ''} onChange={(e) => setStudentForm({ ...studentForm, parentEmail: e.target.value })} className="sm-input" />
                </Field>
              </div>
              <Field label="Parent Phone">
                <input value={studentForm.parentPhone || ''} onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })} className="sm-input" />
              </Field>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setStudentForm(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={studentSubmitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm disabled:opacity-60">
                {studentSubmitting ? 'Saving…' : studentForm._id ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* --- Section modal --- */}
      {sectionForm && (
        <Modal title={sectionForm._id ? 'Edit Section' : 'New Section'} onClose={() => setSectionForm(null)}>
          <form onSubmit={saveSection} className="space-y-4">
            <Field label="Section Name *">
              <input required value={sectionForm.name} onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} placeholder="Grade 10 - A" className="sm-input" />
            </Field>
            <Field label="Grade Level *">
              <input required value={sectionForm.gradeLevel} onChange={(e) => setSectionForm({ ...sectionForm, gradeLevel: e.target.value })} placeholder="Grade 10" className="sm-input" />
            </Field>
            <Field label="Adviser">
              <select value={sectionForm.adviser || ''} onChange={(e) => setSectionForm({ ...sectionForm, adviser: e.target.value })} className="sm-input">
                <option value="">— Unassigned —</option>
                {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setSectionForm(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={sectionSubmitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm disabled:opacity-60">
                {sectionSubmitting ? 'Saving…' : sectionForm._id ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* --- QR backup modal --- */}
      {qrFor && (
        <Modal title="QR Backup" onClose={() => setQrFor(null)}>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student</p>
              <p className="font-bold text-slate-800">{qrFor.name}</p>
              <p className="text-xs text-slate-500">{qrFor.studentId || '—'} • {qrFor.section || '—'}</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-6 text-center">
              <QrCode className="w-12 h-12 text-white/80 mx-auto mb-3" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Token</p>
              <p className="font-mono text-emerald-300 text-lg break-all mt-1">{qrFor.qrCode || '—'}</p>
            </div>
            <p className="text-xs text-slate-500 italic">
              Print this token onto a replacement ID card. The mobile scanner will recognize the new token on the student's next scan.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button onClick={() => setQrFor(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">Close</button>
              <button onClick={downloadQrCard} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-sm flex items-center gap-2">
                <Download className="w-4 h-4" /> Download Token
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`.sm-input{width:100%;padding:.5rem .75rem;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.875rem;background:#fff;outline:none}.sm-input:focus{box-shadow:0 0 0 2px rgba(59,130,246,.5);border-color:#3b82f6}`}</style>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider ${
        active ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      }`}>{children}</button>
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

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
