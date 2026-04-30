import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Save, CheckSquare } from 'lucide-react';

export default function TakeAttendance() {
  // 1. Dummy Student List (Defaulting everyone to 'Present' to save teacher clicks)
  const [students, setStudents] = useState([
    { id: 1, name: 'Liam Santos', studentId: '2023-0142', status: 'Present' },
    { id: 2, name: 'Sophia Reyes', studentId: '2023-0899', status: 'Present' },
    { id: 3, name: 'Ethan Cruz', studentId: '2022-1102', status: 'Present' },
    { id: 4, name: 'Mia Garcia', studentId: '2023-0441', status: 'Present' },
    { id: 5, name: 'Lucas Bautista', studentId: '2021-0993', status: 'Present' },
  ]);

  // 2. Handle Individual Status Change
  const handleStatusChange = (id, newStatus) => {
    setStudents(students.map(student => 
      student.id === id ? { ...student, status: newStatus } : student
    ));
  };

  // 3. Handle 'Mark All' Feature
  const markAll = (status) => {
    setStudents(students.map(student => ({ ...student, status })));
  };

  // 4. Save/Submit Function
  const handleSave = () => {
    // In the future, this is where you will send the 'students' array to your Node/Express backend!
    console.log("Saving attendance:", students);
    alert("Attendance successfully saved for today!");
  };

  // Get current date for the header
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Take Attendance</h1>
          <p className="text-slate-500 mt-2">Manual attendance checklist for teachers.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Date</p>
          <p className="text-slate-800 font-semibold">{today}</p>
        </div>
      </div>

      {/* Main Checklist Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-800">BSIT - Section A</h2>
            <p className="text-xs text-slate-500">{students.length} Students Enrolled</p>
          </div>
          <button 
            onClick={() => markAll('Present')}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <CheckSquare className="w-4 h-4 mr-2" /> Mark All Present
          </button>
        </div>

        {/* Student List */}
        <div className="divide-y divide-slate-100">
          {students.map((student) => (
            <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              
              {/* Student Info */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                  {student.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{student.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{student.studentId}</p>
                </div>
              </div>

              {/* Attendance Toggles (Segmented Controls) */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => handleStatusChange(student.id, 'Present')}
                  className={`flex items-center px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                    student.status === 'Present' 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Present
                </button>
                
                <button
                  onClick={() => handleStatusChange(student.id, 'Late')}
                  className={`flex items-center px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                    student.status === 'Late' 
                      ? 'bg-amber-500 text-white shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4 mr-1.5" /> Late
                </button>

                <button
                  onClick={() => handleStatusChange(student.id, 'Absent')}
                  className={`flex items-center px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                    student.status === 'Absent' 
                      ? 'bg-red-500 text-white shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Absent
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Footer / Submit Area */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center transition-colors shadow-sm"
          >
            <Save className="w-5 h-5 mr-2" /> Save Attendance
          </button>
        </div>

      </div>
    </div>
  );
}