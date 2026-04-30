import React, { useState } from 'react';
import { Search, X, Check, Edit2 } from 'lucide-react';

export default function AttendanceLedger() {
  // 1. Initial Dummy Data
  const [entries, setEntries] = useState([
    { id: 1, date: '2026-04-20', student: 'Liam Santos', status: 'Absent' },
    { id: 2, date: '2026-04-20', student: 'Sophia Reyes', status: 'Present' },
    { id: 3, date: '2026-04-20', student: 'Ethan Cruz', status: 'Late' },
    { id: 4, date: '2026-04-19', student: 'Mia Garcia', status: 'Present' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  
  // State for the correction modal
  const [editingEntry, setEditingEntry] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  // Helper to color-code the status pills
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-700';
      case 'Absent':
        return 'bg-red-100 text-red-700';
      case 'Late':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  // Filter entries based on search input
  const filteredEntries = entries.filter(entry => 
    entry.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.date.includes(searchTerm)
  );

  // Handle opening the modal
  const openCorrectionModal = (entry) => {
    setEditingEntry(entry);
    setNewStatus(entry.status);
  };

  // Handle saving the new status
  const handleSaveCorrection = () => {
    setEntries(entries.map(entry => 
      entry.id === editingEntry.id ? { ...entry, status: newStatus } : entry
    ));
    setEditingEntry(null); // Close modal
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Attendance Ledger</h1>
        <p className="text-slate-500 mt-2">The official authoritative record of all attendance data.</p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Toolbar (Search) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-100 bg-white text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div>Date</div>
          <div>Student</div>
          <div>Status</div>
          <div className="text-right">Action</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-100">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
              <div className="text-sm text-slate-600 font-medium">{entry.date}</div>
              <div className="text-sm font-bold text-slate-900">{entry.student}</div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(entry.status)}`}>
                  {entry.status}
                </span>
              </div>
              <div className="text-right">
                <button 
                  onClick={() => openCorrectionModal(entry)}
                  className="text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors inline-flex items-center"
                >
                  <Edit2 className="w-3 h-3 mr-1.5" /> Correct Entry
                </button>
              </div>
            </div>
          ))}
          
          {filteredEntries.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No records found.
            </div>
          )}
        </div>
      </div>

      {/* Correction Modal Overlay */}
      {editingEntry && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Correct Attendance Record</h3>
              <button onClick={() => setEditingEntry(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Student</p>
                <p className="text-slate-900 font-medium">{editingEntry.student}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">New Status</p>
                <div className="flex gap-2">
                  {['Present', 'Absent', 'Late'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setNewStatus(status)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border ${
                        newStatus === status 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button 
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCorrection}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center shadow-sm"
              >
                <Check className="w-4 h-4 mr-1.5" /> Save Correction
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}