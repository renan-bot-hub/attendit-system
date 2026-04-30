import React, { useState } from 'react';
import { Search, FileText, CheckCircle, XCircle, AlertCircle, FileDown, Eye } from 'lucide-react';

export default function CaseManager() {
  // 1. Dummy Data
  const [cases, setCases] = useState([
    { 
      id: 'CAS-001', 
      studentName: 'Juan Dela Cruz', 
      studentId: '2023-102451', 
      course: 'BSIT',
      type: 'Medical Certificate', 
      status: 'Pending', 
      dateSubmitted: 'Oct 24, 2025', 
      description: 'Diagnosed with viral fever. Advised to rest for 3 days by the clinic.',
      fileName: 'med_cert_delacruz.pdf'
    },
    { 
      id: 'CAS-002', 
      studentName: 'Maria Santos', 
      studentId: '2023-0899', 
      course: 'BSIT',
      type: 'Excuse Letter', 
      status: 'Approved', 
      dateSubmitted: 'Oct 22, 2025', 
      description: 'Represented the university in a regional hackathon.',
      fileName: 'hackathon_endorsement.png'
    },
    { 
      id: 'CAS-003', 
      studentName: 'Mark Reyes', 
      studentId: '2022-1102', 
      course: 'BSCS',
      type: 'Medical Certificate', 
      status: 'Pending', 
      dateSubmitted: 'Oct 25, 2025', 
      description: 'Dental surgery and extraction. Cannot speak or attend class.',
      fileName: 'dental_clearance.pdf'
    },
  ]);

  const [selectedCase, setSelectedCase] = useState(cases[0]);
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Handle Case Actions (Approve/Reject)
  const handleAction = (id, newStatus) => {
    const updatedCases = cases.map(c => c.id === id ? { ...c, status: newStatus } : c);
    setCases(updatedCases);
    if (selectedCase && selectedCase.id === id) {
      setSelectedCase({ ...selectedCase, status: newStatus });
    }
  };

  // Helper for status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold"><AlertCircle className="w-3 h-3 mr-1"/> Pending</span>;
      case 'Approved':
        return <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle className="w-3 h-3 mr-1"/> Approved</span>;
      case 'Rejected':
        return <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold"><XCircle className="w-3 h-3 mr-1"/> Rejected</span>;
      default:
        return null;
    }
  };

  // Filter cases based on search
  const filteredCases = cases.filter(c => 
    c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.studentId.includes(searchTerm)
  );

  return (
    <div className="p-8 max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      
      {/* Header Structure */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Case Manager</h1>
        <p className="text-slate-500 mt-2">Review medical certificates and manage student interventions.</p>
      </div>

      {/* Main Interface Layout */}
      <div className="flex-1 flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        
        {/* Case Queue */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-white">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
              />
            </div>
          </div>

          {/* Case List */}
          <div className="flex-1 overflow-y-auto">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`p-4 border-b border-slate-50 cursor-pointer transition-colors ${
                  selectedCase?.id === c.id ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{c.studentName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{c.studentId} • {c.course}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{c.dateSubmitted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                    {c.type}
                  </span>
                  {getStatusBadge(c.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Case Details & Document Viewer */}
        <div className="w-2/3 flex flex-col bg-slate-50/30">
          {selectedCase ? (
            <>
              {/* Details Header */}
              <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-slate-800">{selectedCase.studentName}</h2>
                    {getStatusBadge(selectedCase.status)}
                  </div>
                  <p className="text-sm text-slate-500 font-medium">
                    ID: {selectedCase.studentId} | Course: {selectedCase.course} | Case: {selectedCase.id}
                  </p>
                </div>
              </div>

              {/* Document & Info Body */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider">Student Notes / Remarks</h3>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-600 text-sm leading-relaxed">{selectedCase.description}</p>
                  </div>
                </div>

                {/* Simulated Document Viewer */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Attached Document</h3>
                    <button className="text-blue-600 text-xs font-bold flex items-center hover:text-blue-800">
                      <FileDown className="w-3 h-3 mr-1" /> Download
                    </button>
                  </div>
                  
                  {/* The Document Preview Area */}
                  <div className="bg-slate-200/50 border-2 border-slate-300 border-dashed rounded-xl h-64 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer">
                    <FileText className="w-12 h-12 mb-3 text-slate-400" />
                    <p className="font-semibold text-sm">Preview: {selectedCase.fileName}</p>
                    <p className="text-xs mt-1">Click to expand document viewer</p>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
                {selectedCase.status === 'Pending' ? (
                  <>
                    <button 
                      onClick={() => handleAction(selectedCase.id, 'Rejected')}
                      className="px-4 py-2 border-2 border-red-100 bg-red-50 text-red-600 font-bold rounded-lg text-sm hover:bg-red-100 transition-colors flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject Case
                    </button>
                    <button 
                      onClick={() => handleAction(selectedCase.id, 'Approved')}
                      className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-lg text-sm hover:bg-emerald-600 transition-colors shadow-sm flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve Leave
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleAction(selectedCase.id, 'Pending')}
                    className="px-4 py-2 border border-slate-300 text-slate-600 font-semibold rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  >
                    Revert to Pending
                  </button>
                )}
              </div>
            </>
          ) : (
            // Empty State
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Eye className="w-12 h-12 mb-4 text-slate-300" />
              <p className="font-medium text-lg text-slate-500">Select a case to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}