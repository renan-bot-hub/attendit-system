import React, { useState } from 'react';
import { ClipboardCheck, MessageCircle, FileBarChart } from 'lucide-react';

export default function TeacherDashboard() {
  // 1. Dynamic Data State
  const [atRiskStudents, setAtRiskStudents] = useState([
    { id: 1, name: 'Liam Santos', attendance: 82, riskLevel: 'High Risk', caseStatus: 'Needs Intervention' },
    { id: 2, name: 'Sophia Reyes', attendance: 91, riskLevel: 'Moderate', caseStatus: 'Monitoring' },
    { id: 3, name: 'Ethan Cruz', attendance: 98, riskLevel: 'Low Risk', caseStatus: 'Good' },
    { id: 4, name: 'Mia Fernandez', attendance: 75, riskLevel: 'Critical', caseStatus: 'Case Escalated' },
  ]);

  // 2. Helper to dynamically color the AI Risk badges
  const getRiskBadgeStyle = (level) => {
    switch (level) {
      case 'Low Risk':
        return 'bg-green-100 text-green-700';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-700';
      case 'High Risk':
        return 'bg-orange-100 text-orange-700';
      case 'Critical':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  // 3. Functional Handlers for Dashboard Actions
  const handleQuickAction = (actionName) => {
    alert(`Navigating to ${actionName} module...`);
  };

  const handleMessageParent = (studentName) => {
    alert(`Opening direct message interface for ${studentName}'s parent/guardian.`);
  };

  const handleViewCase = (studentName) => {
    alert(`Opening Case Manager details for ${studentName}.`);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teacher Dashboard</h1>
        <p className="text-slate-500 mt-2">Monitor daily attendance and AI-computed student risk levels.</p>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Active Action Card */}
        <button 
          onClick={() => handleQuickAction('Take Attendance')}
          className="bg-blue-600 text-white p-6 rounded-2xl shadow-sm text-left hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-100 focus:outline-none"
        >
          <div className="flex items-center mb-2">
            <ClipboardCheck className="w-5 h-5 mr-2" />
            <h3 className="font-bold text-lg">Take Attendance</h3>
          </div>
          <p className="text-blue-100 text-sm">Record today's class attendance</p>
        </button>

        {/* Secondary Action Cards */}
        <button 
          onClick={() => handleQuickAction('Open Messages')}
          className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left hover:bg-slate-50 transition-colors focus:ring-4 focus:ring-slate-100 focus:outline-none group"
        >
          <div className="flex items-center mb-2 text-slate-800 group-hover:text-blue-600 transition-colors">
            <MessageCircle className="w-5 h-5 mr-2 text-slate-400 group-hover:text-blue-500" />
            <h3 className="font-bold text-lg">Open Messages</h3>
          </div>
          <p className="text-slate-500 text-sm">Check parent document uploads</p>
        </button>

        <button 
          onClick={() => handleQuickAction('Generate Report')}
          className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left hover:bg-slate-50 transition-colors focus:ring-4 focus:ring-slate-100 focus:outline-none group"
        >
          <div className="flex items-center mb-2 text-slate-800 group-hover:text-blue-600 transition-colors">
            <FileBarChart className="w-5 h-5 mr-2 text-slate-400 group-hover:text-blue-500" />
            <h3 className="font-bold text-lg">Generate Report</h3>
          </div>
          <p className="text-slate-500 text-sm">Export monthly analytics</p>
        </button>

      </div>

      {/* At-Risk Student Monitoring Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Table Header */}
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">At-Risk Student Monitoring</h2>
        </div>

        {/* Table Columns Setup */}
        <div className="grid grid-cols-5 gap-4 p-4 border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-1">Student Name</div>
          <div className="col-span-1">Attendance %</div>
          <div className="col-span-1">AI Risk Level</div>
          <div className="col-span-1">Case Status</div>
          <div className="col-span-1 text-right pr-4">Actions</div>
        </div>

        {/* Table Body (Mapping through the data) */}
        <div className="divide-y divide-slate-100">
          {atRiskStudents.map((student) => (
            <div key={student.id} className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
              
              <div className="font-bold text-slate-900 text-sm">
                {student.name}
              </div>
              
              <div className="text-slate-600 text-sm font-medium">
                {student.attendance}%
              </div>
              
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBadgeStyle(student.riskLevel)}`}>
                  {student.riskLevel}
                </span>
              </div>
              
              <div className="text-slate-500 text-sm">
                {student.caseStatus}
              </div>
              
              <div className="flex gap-4 justify-end text-sm pr-2">
                <button 
                  onClick={() => handleMessageParent(student.name)}
                  className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
                >
                  Message Parent
                </button>
                <button 
                  onClick={() => handleViewCase(student.name)}
                  className="text-slate-500 font-medium hover:text-slate-800 transition-colors"
                >
                  View Case
                </button>
              </div>

            </div>
          ))}

          {/* Empty State Fallback */}
          {atRiskStudents.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No at-risk students currently detected by AI.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}