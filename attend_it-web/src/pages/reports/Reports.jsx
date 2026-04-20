import React, { useState } from 'react';

const initialReports = [
  { id: 'REP-001', name: "March 2026 Monthly Attendance Summary", date: "2026-04-01", type: "PDF", size: "2.4 MB" },
  { id: 'REP-002', name: "At-Risk Students Q1 Escalation Flagging", date: "2026-03-28", type: "CSV", size: "1.1 MB" },
  { id: 'REP-003', name: "Teacher Intervention & Messaging Log", date: "2026-03-15", type: "PDF", size: "3.5 MB" }
];

export default function Reports() {
  const [reports, setReports] = useState(initialReports);
  const [reportType, setReportType] = useState('Comprehensive Attendance');
  const [format, setFormat] = useState('PDF');

  // 🛑 MOCK FUNCTION: Generate a new report
  const handleGenerate = (e) => {
    e.preventDefault();
    
    const newReport = {
      id: `REP-00${reports.length + 1}`,
      name: `${reportType} Export`,
      date: new Date().toISOString().split('T')[0], // Today's date
      type: format,
      size: format === 'PDF' ? '1.8 MB' : '0.5 MB'
    };

    // Add new report to the top of the list
    setReports([newReport, ...reports]);
    alert("Report generated successfully!");
  };

  // 🛑 MOCK FUNCTION: Simulate downloading
  const handleDownload = (name) => {
    alert(`Downloading: ${name}...`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Reports</h1>
        <p className="text-slate-500 mt-1">Generate, configure, and export official data.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Generator Form */}
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
                <option>Comprehensive Attendance</option>
                <option>AI Risk Analysis Export</option>
                <option>Intervention Case Logs</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date Range</label>
              <input type="date" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none mb-2" />
              <input type="date" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Format</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input type="radio" name="format" value="PDF" checked={format === 'PDF'} onChange={(e) => setFormat(e.target.value)} /> PDF
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input type="radio" name="format" value="CSV" checked={format === 'CSV'} onChange={(e) => setFormat(e.target.value)} /> CSV
                </label>
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg mt-4 transition-colors">
              Generate Report
            </button>
          </form>
        </div>

        {/* Recent Reports List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-lg">Report History</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {reports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">{report.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Generated: {report.date} • {report.size}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded text-xs font-black uppercase ${report.type === 'PDF' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {report.type}
                  </span>
                  <button onClick={() => handleDownload(report.name)} className="text-blue-600 font-bold text-sm hover:underline">
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}