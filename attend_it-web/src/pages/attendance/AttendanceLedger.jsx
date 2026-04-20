import React from 'react';

export default function AttendanceLedger() {
  const history = [
    { id: 1, date: '2026-04-20', student: 'Liam Santos', status: 'Absent', correctedBy: 'None' },
    { id: 2, date: '2026-04-20', student: 'Sophia Reyes', status: 'Present', correctedBy: 'Admin' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 text-left">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Attendance Ledger</h1>
        <p className="text-slate-500 mt-1 font-medium">The official authoritative record of all attendance data.</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-bold border-b border-slate-200">Date</th>
              <th className="p-4 font-bold border-b border-slate-200">Student</th>
              <th className="p-4 font-bold border-b border-slate-200">Status</th>
              <th className="p-4 font-bold border-b border-slate-200 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map(item => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
                <td className="p-4 font-medium text-slate-600">{item.date}</td>
                <td className="p-4 font-bold text-slate-800">{item.student}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-blue-600 text-sm font-bold hover:underline">Correct Entry</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}