import React, { useState } from 'react';

export default function SystemConfig() {
  const [threshold, setThreshold] = useState(3);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Configuration</h1>
        <p className="text-slate-500 mt-1">Define school structure and AI behavioral rules.</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* AI Rule Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <span>⚙️</span> Attendance Thresholds
          </h2>
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-600">Consecutive absences to trigger 'High Risk' flag:</p>
            <input 
              type="number" 
              value={threshold} 
              onChange={(e) => setThreshold(e.target.value)}
              className="w-20 p-2 border border-slate-200 rounded-lg text-center font-bold text-blue-600"
            />
          </div>
        </div>

        {/* School Structure */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-bold text-lg text-slate-800 mb-4">Academic Year & Sections</h2>
          <div className="space-y-4">
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <span className="font-medium text-slate-700">Current Academic Year</span>
              <span className="font-bold text-blue-600">2025-2026</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <span className="font-medium text-slate-700">Active Sections</span>
              <span className="font-bold text-blue-600">24 Sections</span>
            </div>
          </div>
          <button className="mt-4 text-blue-600 font-bold text-sm hover:underline">+ Manage Sections</button>
        </div>
      </div>
    </div>
  );
}