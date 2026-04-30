import React from 'react';

// Mock Data
const mockTeachers = [
  { id: 1, name: "Sarah Jenkins", email: "sarah@school.edu", status: "Active", department: "Mathematics" },
  { id: 2, name: "Mark Roberts", email: "mark@school.edu", status: "Offline", department: "Science" },
  { id: 3, name: "Elena Rostova", email: "elena@school.edu", status: "Active", department: "Literature" },
  { id: 4, name: "David Chen", email: "david@school.edu", status: "Active", department: "English" }
];

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Administrator Hub</h1>
          <p className="text-slate-500 mt-1">System-wide overview and user management.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all">
          + Add New Teacher
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Staff</p>
          <p className="text-3xl font-black text-blue-600 mt-2">{mockTeachers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Alerts</p>
          <p className="text-3xl font-black text-red-500 mt-2">12</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Health</p>
          <p className="text-3xl font-black text-green-500 mt-2">Optimal</p>
        </div>
      </div>

      {/* Teacher Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-lg">Staff Directory</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200">Name</th>
                <th className="p-4 font-bold border-b border-slate-200">Email</th>
                <th className="p-4 font-bold border-b border-slate-200">Department</th>
                <th className="p-4 font-bold border-b border-slate-200">Status</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                  <td className="p-4 font-bold text-slate-800">{teacher.name}</td>
                  <td className="p-4 text-slate-500">{teacher.email}</td>
                  <td className="p-4 text-slate-600 font-medium">{teacher.department}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      teacher.status === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-blue-600 font-bold text-sm hover:underline mr-4">Edit</button>
                    <button className="text-red-500 font-bold text-sm hover:underline">Remove</button>
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