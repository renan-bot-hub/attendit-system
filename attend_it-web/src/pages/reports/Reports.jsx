import React, { useState } from 'react';
import { FileBarChart, FileText, FileSpreadsheet, Download, AlertTriangle } from 'lucide-react';
import { attendService } from '../../services/attendService';
import { caseService } from '../../services/caseService';
import { useSchool } from '../../context/useSchool';

// Reports — manuscript Fig. 14 + 19. Exports CSV, Excel (.xls via Excel-flavored
// HTML), and PDF (via the browser's print dialog with a styled template).
// We avoid pulling in jsPDF/xlsx so the bundle stays small.
const REPORTS = [
  { key: 'Attendance Records', desc: 'Per-row attendance with section, status, and source' },
  { key: 'Risk Analysis',      desc: 'Student-level risk tiers, attendance rate, and absence streaks' },
  { key: 'Case Logs',          desc: 'All cases with status, risk level, and review notes' },
];

export default function Reports() {
  const { settings } = useSchool();
  const [reportType, setReportType] = useState('Attendance Records');
  const [format, setFormat] = useState('CSV');
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const escapeHtml = (val) => {
    if (val === null || val === undefined) return '';
    return String(val).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  };

  const toCSV = (rows, columns) => {
    const header = columns.map((c) => escapeCsv(c.label)).join(',');
    const body = rows.map((r) => columns.map((c) => escapeCsv(c.get(r))).join(',')).join('\n');
    return header + '\n' + body;
  };

  const toExcelHTML = (rows, columns, title) => {
    // Excel opens this fine when saved with a .xls extension and the right MIME type.
    const head = columns.map((c) => `<th style="background:#1e293b;color:#fff;padding:6px 10px;text-align:left;border:1px solid #334155">${escapeHtml(c.label)}</th>`).join('');
    const body = rows.map((r) =>
      '<tr>' + columns.map((c) => `<td style="padding:5px 10px;border:1px solid #cbd5e1">${escapeHtml(c.get(r))}</td>`).join('') + '</tr>'
    ).join('');
    return `<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
      <body><h2>${escapeHtml(title)}</h2>
      <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table></body></html>`;
  };

  const toPDFHTML = (rows, columns, title) => {
    // Self-contained printable HTML. The user picks "Save as PDF" in the print dialog.
    const head = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');
    const body = rows.map((r) =>
      '<tr>' + columns.map((c) => `<td>${escapeHtml(c.get(r))}</td>`).join('') + '</tr>'
    ).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
      <style>
        body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 32px; color:#0f172a; }
        h1 { margin: 0 0 4px; font-size: 22px; }
        .meta { color:#64748b; font-size:12px; margin-bottom:18px; }
        table { width:100%; border-collapse:collapse; font-size:11px; }
        th { background:#0f172a; color:#fff; padding:8px 10px; text-align:left; }
        td { padding:6px 10px; border-bottom:1px solid #e2e8f0; }
        tr:nth-child(even) td { background:#f8fafc; }
        @media print { .noprint { display:none } }
      </style></head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p class="meta">${escapeHtml(settings.schoolName)} • AY ${escapeHtml(settings.academicYear)} • Generated ${new Date().toLocaleString()}</p>
        <p class="noprint" style="margin-bottom:14px"><button onclick="window.print()">Print / Save as PDF</button></p>
        <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
        <script>setTimeout(() => window.print(), 250);</script>
      </body></html>`;
  };

  const download = (filename, content, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openPrintable = (html) => {
    const w = window.open('', '_blank');
    if (!w) return setError('Popup blocked — please allow popups to export PDF.');
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const fetchRows = async (type) => {
    if (type === 'Attendance Records') {
      const res = await attendService.getLedger();
      return {
        rows: res.data,
        columns: [
          { label: 'Date',      get: (r) => r.timestamp ? new Date(r.timestamp).toLocaleString() : '' },
          { label: 'Student',   get: (r) => r.studentId?.name || '' },
          { label: 'Student ID',get: (r) => r.studentId?.studentId || '' },
          { label: 'Section',   get: (r) => r.studentId?.section || '' },
          { label: 'Class',     get: (r) => r.sessionId?.className || '' },
          { label: 'Status',    get: (r) => r.status || '' },
          { label: 'Marked By', get: (r) => r.markedBy || 'Manual' },
        ],
      };
    }
    if (type === 'Risk Analysis') {
      const res = await attendService.getRiskAnalysis();
      return {
        rows: res.data,
        columns: [
          { label: 'Student',           get: (r) => r.name },
          { label: 'Section',           get: (r) => r.section || '' },
          { label: 'Attendance Rate',   get: (r) => `${r.attendanceRate}%` },
          { label: 'Total Absences',    get: (r) => r.absentCount ?? 0 },
          { label: 'Consecutive',       get: (r) => r.consecutiveAbsences ?? 0 },
          { label: 'Risk Level',        get: (r) => r.riskLevel },
        ],
      };
    }
    if (type === 'Case Logs') {
      const res = await caseService.getCases();
      return {
        rows: res.data,
        columns: [
          { label: 'Student',     get: (r) => r.student?.name || '' },
          { label: 'Type',        get: (r) => r.type },
          { label: 'Risk',        get: (r) => r.riskLevel },
          { label: 'Status',      get: (r) => r.status },
          { label: 'Submitted',   get: (r) => r.createdAt ? new Date(r.createdAt).toLocaleString() : '' },
          { label: 'Description', get: (r) => r.description || '' },
        ],
      };
    }
    return { rows: [], columns: [] };
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { rows, columns } = await fetchRows(reportType);
      const title = `${reportType}`;
      const stamp = Date.now();
      let size = 0;
      if (format === 'CSV') {
        const content = toCSV(rows, columns);
        download(`${title.toLowerCase().replace(/\s+/g, '_')}_${stamp}.csv`, content, 'text/csv');
        size = content.length;
      } else if (format === 'Excel') {
        const content = toExcelHTML(rows, columns, title);
        download(`${title.toLowerCase().replace(/\s+/g, '_')}_${stamp}.xls`, content, 'application/vnd.ms-excel');
        size = content.length;
      } else if (format === 'PDF') {
        openPrintable(toPDFHTML(rows, columns, title));
        size = 0;
      }
      setHistory([{
        id: `REP-${stamp}`, name: `${reportType} Export`,
        date: new Date().toISOString().split('T')[0],
        type: format,
        size: size ? `${(size / 1024).toFixed(1)} KB` : '—',
      }, ...history]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setBusy(false);
    }
  };

  const fmtBadge = (fmt) => ({
    CSV:   'bg-emerald-100 text-emerald-700',
    Excel: 'bg-blue-100 text-blue-700',
    PDF:   'bg-rose-100 text-rose-700',
  }[fmt] || 'bg-slate-100 text-slate-600');

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <FileBarChart className="w-7 h-7 text-blue-500" /> System Reports
        </h1>
        <p className="text-slate-500 mt-1">Generate, configure, and export official data.</p>
      </header>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h2 className="font-bold text-slate-800 text-lg mb-4">Generate New Report</h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Report Type</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                {REPORTS.map((r) => <option key={r.key}>{r.key}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1">{REPORTS.find((r) => r.key === reportType)?.desc}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Format</label>
              <div className="grid grid-cols-3 gap-2">
                <FormatBtn icon={<FileSpreadsheet className="w-4 h-4" />} label="CSV"  active={format === 'CSV'}   onClick={() => setFormat('CSV')} />
                <FormatBtn icon={<FileSpreadsheet className="w-4 h-4" />} label="Excel" active={format === 'Excel'} onClick={() => setFormat('Excel')} />
                <FormatBtn icon={<FileText className="w-4 h-4" />}        label="PDF"   active={format === 'PDF'}   onClick={() => setFormat('PDF')} />
              </div>
              {format === 'PDF' && <p className="text-xs text-slate-400 mt-2">Opens in a new tab — use the browser print dialog to save as PDF.</p>}
              {format === 'Excel' && <p className="text-xs text-slate-400 mt-2">Saves as .xls — Microsoft Excel and Google Sheets open this directly.</p>}
            </div>
            <button type="submit" disabled={busy}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60">
              <Download className="w-4 h-4" /> {busy ? 'Generating…' : 'Generate & Download'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-lg">Report History (this session)</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {history.length === 0
              ? <div className="p-6 text-center text-slate-400 text-sm">No reports generated yet this session.</div>
              : history.map((r) => (
                  <div key={r.id} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{r.name}</p>
                      <p className="text-xs text-slate-500 mt-1">Generated: {r.date} • {r.size}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-black uppercase ${fmtBadge(r.type)}`}>{r.type}</span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormatBtn({ icon, label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg border text-xs font-bold transition-all ${
        active ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}>
      {icon} {label}
    </button>
  );
}
