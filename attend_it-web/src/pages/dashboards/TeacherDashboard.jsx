import React from 'react';

// 1. Mock Data: Simulating the AI Risk Levels and Student Data
const mockStudents = [
  { id: 101, name: "Liam Santos", attendance: "82%", riskLevel: "High Risk", recentAbsences: 3, status: "Needs Intervention" },
  { id: 102, name: "Sophia Reyes", attendance: "91%", riskLevel: "Moderate", recentAbsences: 1, status: "Monitoring" },
  { id: 103, name: "Ethan Cruz", attendance: "98%", riskLevel: "Low Risk", recentAbsences: 0, status: "Good" },
  { id: 104, name: "Mia Fernandez", attendance: "75%", riskLevel: "Critical", recentAbsences: 5, status: "Case Escalated" }
];

export default function TeacherDashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teacher Dashboard</h1>
        <p className="text-slate-500 mt-1">Monitor daily attendance and AI-computed student risk levels.</p>
      </header>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-2xl shadow-sm text-left transition-colors">
          <p className="font-bold text-lg">📝 Take Attendance</p>
          <p className="text-blue-200 text-sm mt-1">Record today's class attendance</p>
        </button>
        <button className="bg-white border border-slate-200 hover:border-blue-300 p-6 rounded-2xl shadow-sm text-left transition-colors">
          <p className="font-bold text-slate-800 text-lg">💬 Open Messages</p>
          <p className="text-slate-500 text-sm mt-1">Check parent document uploads</p>
        </button>
        <button className="bg-white border border-slate-200 hover:border-blue-300 p-6 rounded-2xl shadow-sm text-left transition-colors">
          <p className="font-bold text-slate-800 text-lg">📊 Generate Report</p>
          <p className="text-slate-500 text-sm mt-1">Export monthly analytics</p>
        </button>
      </div>

      {/* AI Risk Level Table (Directly from your Capstone Objectives) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-lg">At-Risk Student Monitoring</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200">Student Name</th>
                <th className="p-4 font-bold border-b border-slate-200">Attendance %</th>
                <th className="p-4 font-bold border-b border-slate-200">AI Risk Level</th>
                <th className="p-4 font-bold border-b border-slate-200">Case Status</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                  <td className="p-4 font-bold text-slate-800">{student.name}</td>
                  <td className="p-4 text-slate-600 font-medium">{student.attendance}</td>
                  <td className="p-4">
                    {/* Dynamic colors based on AI Risk Level */}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      student.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' :
                      student.riskLevel === 'High Risk' ? 'bg-orange-100 text-orange-700' :
                      student.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {student.riskLevel}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-sm">{student.status}</td>
                  <td className="p-4 text-right">
                    <button className="text-blue-600 font-bold text-sm hover:underline mr-4">Message Parent</button>
                    <button className="text-slate-500 font-bold text-sm hover:underline">View Case</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}