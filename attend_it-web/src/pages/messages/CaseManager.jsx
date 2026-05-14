import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, XCircle, AlertCircle, FileDown, Eye, Plus, X } from 'lucide-react';
import { caseService } from '../../services/caseService';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';

export default function CaseManager() {
  const currentUser = authService.getCurrentUser();
  const isStaff = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  const [cases, setCases] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New case modal
  const [showNew, setShowNew] = useState(false);
  const [newCase, setNewCase] = useState({
    studentId: '',
    type: 'Excuse Letter',
    description: '',
    fileName: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCases();
    if (isStaff) fetchStudents();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await caseService.getCases();
      setCases(res.data);
      if (res.data.length > 0) setSelectedCase(res.data[0]);
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
    } catch (err) {
      // silent — staff can still create cases without picking from list if students aren't available
    }
  };

  const handleAction = async (id, newStatus) => {
    try {
      const res = await caseService.updateStatus(id, newStatus);
      setCases(cases.map((c) => (c._id === id ? res.data : c)));
      if (selectedCase?._id === id) setSelectedCase(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update case.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...newCase };
      if (!isStaff) delete payload.studentId;
      const res = await caseService.createCase(payload);
      setCases([res.data, ...cases]);
      setSelectedCase(res.data);
      setShowNew(false);
      setNewCase({ studentId: '', type: 'Excuse Letter', description: '', fileName: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit case.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold"><AlertCircle className="w-3 h-3 mr-1" /> Pending</span>;
      case 'Approved':
        return <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle className="w-3 h-3 mr-1" /> Approved</span>;
      case 'Rejected':
        return <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
      default:
        return null;
    }
  };

  const filteredCases = cases.filter((c) => {
    const name = c.student?.name?.toLowerCase() || '';
    const sid = c.student?.studentId || '';
    const q = searchTerm.toLowerCase();
    return name.includes(q) || sid.includes(q);
  });

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col">

      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Case Manager</h1>
          <p className="text-slate-500 mt-2">Review medical certificates and manage student interventions.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1" /> New Case
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      <div className="flex-1 flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">

        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-white">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && <div className="p-6 text-center text-slate-500 text-sm">Loading cases...</div>}

            {!loading && filteredCases.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-sm">No cases found.</div>
            )}

            {filteredCases.map((c) => (
              <div
                key={c._id}
                onClick={() => setSelectedCase(c)}
                className={`p-4 border-b border-slate-50 cursor-pointer transition-colors ${
                  selectedCase?._id === c._id ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{c.student?.name || 'Unknown'}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {c.student?.studentId || '—'} • {c.student?.section || c.student?.gradeLevel || '—'}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{formatDate(c.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                    {c.type}
                  </span>
                  {getStatusBadge(c.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-2/3 flex flex-col bg-slate-50/30">
          {selectedCase ? (
            <>
              <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-slate-800">{selectedCase.student?.name || 'Unknown'}</h2>
                    {getStatusBadge(selectedCase.status)}
                  </div>
                  <p className="text-sm text-slate-500 font-medium">
                    ID: {selectedCase.student?.studentId || '—'} | Section: {selectedCase.student?.section || '—'} | Case: {selectedCase._id?.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider">Student Notes / Remarks</h3>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-600 text-sm leading-relaxed">{selectedCase.description}</p>
                  </div>
                </div>

                {selectedCase.reviewedBy && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider">Review</h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-sm">
                      <p className="text-slate-600">
                        <span className="font-bold">{selectedCase.reviewedBy.name}</span>
                        <span className="text-slate-400"> ({selectedCase.reviewedBy.role})</span>
                        {' '}— {formatDate(selectedCase.reviewedAt)}
                      </p>
                      {selectedCase.reviewNote && <p className="text-slate-600 mt-1">{selectedCase.reviewNote}</p>}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Attached Document</h3>
                    {selectedCase.fileName && (
                      <button className="text-blue-600 text-xs font-bold flex items-center hover:text-blue-800">
                        <FileDown className="w-3 h-3 mr-1" /> Download
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-200/50 border-2 border-slate-300 border-dashed rounded-xl h-64 flex flex-col items-center justify-center text-slate-500">
                    <FileText className="w-12 h-12 mb-3 text-slate-400" />
                    {selectedCase.fileName ? (
                      <>
                        <p className="font-semibold text-sm">{selectedCase.fileName}</p>
                        <p className="text-xs mt-1">Click to expand document viewer</p>
                      </>
                    ) : (
                      <p className="text-xs">No file attached</p>
                    )}
                  </div>
                </div>
              </div>

              {isStaff && (
                <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
                  {selectedCase.status === 'Pending' ? (
                    <>
                      <button
                        onClick={() => handleAction(selectedCase._id, 'Rejected')}
                        className="px-4 py-2 border-2 border-red-100 bg-red-50 text-red-600 font-bold rounded-lg text-sm hover:bg-red-100 transition-colors flex items-center"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject Case
                      </button>
                      <button
                        onClick={() => handleAction(selectedCase._id, 'Approved')}
                        className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-lg text-sm hover:bg-emerald-600 transition-colors shadow-sm flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Approve Leave
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAction(selectedCase._id, 'Pending')}
                      className="px-4 py-2 border border-slate-300 text-slate-600 font-semibold rounded-lg text-sm hover:bg-slate-50 transition-colors"
                    >
                      Revert to Pending
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
              {isStaff && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student *</label>
                  <select
                    required
                    value={newCase.studentId}
                    onChange={(e) => setNewCase({ ...newCase, studentId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select student...</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} {s.studentId ? `(${s.studentId})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                <select
                  value={newCase.type}
                  onChange={(e) => setNewCase({ ...newCase, type: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Excuse Letter</option>
                  <option>Medical Certificate</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">File Name (optional)</label>
                <input
                  type="text"
                  value={newCase.fileName}
                  onChange={(e) => setNewCase({ ...newCase, fileName: e.target.value })}
                  placeholder="med_cert_jan.pdf"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setShowNew(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60 shadow-sm">
                  {submitting ? 'Submitting...' : 'Submit Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
