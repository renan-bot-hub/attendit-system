import React, { useState } from 'react';
import { Settings, Save, CheckCircle } from 'lucide-react';

export default function SystemSettings() {
  // 1. System Configuration State
  const [threshold, setThreshold] = useState(3);
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [activeSections, setActiveSections] = useState(24);
  
  // Save Action State
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 2. Handlers
  const handleManageSections = () => {
    alert('Opening Section Management Modal...');
  };

  const handleSaveConfig = () => {
    setIsSaving(true);
    
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);

      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Configuration</h1>
        </div>
        
        {/* Success / Save Button */}
        <div className="flex items-center">
          {showSuccess && (
            <span className="text-emerald-600 font-bold flex items-center mr-4 animate-pulse">
              <CheckCircle className="w-5 h-5 mr-1" /> Settings Saved!
            </span>
          )}
          <button 
            onClick={handleSaveConfig}
            disabled={isSaving}
            className={`flex items-center px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-sm ${
              isSaving ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        
        {/*Attendance Thresholds */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center mb-6">
            <Settings className="w-6 h-6 text-slate-400 mr-2" />
            <h2 className="text-lg font-bold text-slate-900">Attendance Thresholds</h2>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <p className="text-slate-600 font-medium">Consecutive absences to trigger 'High Risk' flag:</p>
            <input 
              type="number" 
              min="1"
              max="10"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-20 text-center font-bold text-blue-600 border border-slate-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Academic Year & Sections */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Academic Year & Sections</h2>
          
          <div className="space-y-3">
            {/* Academic Year Row */}
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
              <p className="text-slate-600 font-medium">Current Academic Year</p>
              <select 
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="font-bold text-blue-600 bg-transparent border-none focus:ring-0 cursor-pointer text-right appearance-none"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>

            {/* Active Sections Row */}
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
              <p className="text-slate-600 font-medium">Active Sections</p>
              <p className="font-bold text-blue-600">{activeSections} Sections</p>
            </div>
          </div>

          {/* Manage Sections Action */}
          <div className="mt-6">
            <button 
              onClick={handleManageSections}
              className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors flex items-center"
            >
              + Manage Sections
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}