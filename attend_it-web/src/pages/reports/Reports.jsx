import React, { useState } from 'react';
import { attendService } from '../../services/attendService';
import { caseService } from '../../services/caseService';

// Report generator: pick a type, download as CSV
export default function Reports() {
  const [reportType, setReportType] = useState('Attendance Ledger');
  const [format, setFormat] = useState('CSV');
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Convert an array of rows to a CSV string given a column schema
  const toCSV = (rows, columns) => {
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const header = columns.map((c) => escape(c.label)).join(',');
    const body = rows.map((r) => columns.map((c) => escape(c.get(r))).join(',')).join('\n');
    return header + '\n' + body;
  };

  // Trigger a browser download for a blob of text content
  const download = (filename, content, type = 'text/csv') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fetch the picked report type, convert to CSV, and trigger download
  const handleGenerate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      let filename = '';
      let content = '';

      if (reportType === 'Attendance Ledger') {
        const res = await attendService.getLedger();
        const cols = [
          { label: 'Date',    get: (r) => r.timestamp ? new Date(r.timestamp).toLocaleString() : '' },
          { label: 'Student', get: (r) => r.studentId?.name || '' },
          { label: 'Section', get: (r) => r.studentId?.section || '' },
          { label: 'Class',   get: (r) => r.sessionId?.className || '' },
          { label: 'Status',  get: (r) => r.status || '' },
        ];
        content = toCSV(res.data, cols);
        filename = `attendance_ledger_${Date.now()}.csv`;
      } else if (reportType === 'Risk Analysis') {
        const res = await attendService.getRiskAnalysis();
        const cols = [
          { label: 'Student',         get: (r) => r.name },
          { label: 'Section',         get: (r) => r.section || '' },
          { label: 'Attendance Rate', get: (r) => `${r.attendanceRate}%` },
          { label: 'Risk Level',      get: (r) => r.riskLevel },
        ];
        content = toCSV(res.data, cols);
        filename = `risk_analysis_${Date.now()}.csv`;
      } else if (reportType === 'Case Logs') {
        const res = await caseService.getCases();
        const cols = [
          { label: 'Student',     get: (r) => r.student?.name || '' },
          { label: 'Type',        get: (r) => r.type },
          { label: 'Status',      get: (r) => r.status },
          { label: 'Submitted',   get: (r) => r.createdAt ? new Date(r.createdAt).toLocaleString() : '' },
          { label: 'Description', get: (r) => r.description || '' },
        ];
        content = toCSV(res.data, cols);
        filename = `case_logs_${Date.now()}.csv`;
      }

      download(filename, content);

      const sizeKB = (content.length / 1024).toFixed(1);
      setHistory([
        {
          id: `REP-${Date.now()}`,
          name: `${reportType} Export`,
          date: new Date().toISOString().split('T')[0],
          type: format,
          size: `${sizeKB} KB`,
        },
        ...history,
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Reports</h1>
        <p className="text-slate-500 mt-1">Generate, configure, and export official data.</p>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h2 className="font-bold text-slate-800 text-lg mb-4">Generate New Report</h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
              >
                <option>Attendance Ledger</option>
                <option>Risk Analysis</option>
                <option>Case Logs</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Format</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input type="radio" name="format" value="CSV" checked={format === 'CSV'} onChange={(e) => setFormat(e.target.value)} /> CSV
                </label>
              </div>
              <p className="text-xs text-slate-400 mt-1">PDF export requires a server-side renderer (not yet enabled).</p>
            </div>
            <button type="submit" disabled={busy}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg mt-4 transition-colors disabled:opacity-60">
              {busy ? 'Generating...' : 'Generate & Download'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-lg">Report History (this session)</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {history.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No reports generated yet this session.</div>
            ) : (
              history.map((report) => (
                <div key={report.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">{report.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Generated: {report.date} • {report.size}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-black uppercase ${report.type === 'PDF' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {report.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
