// Reusable card for an at-risk student — name + risk score + AI
// recommendation + "Approve Intervention" button.

export default function AtRiskCard({ student, onApprove }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-slate-800">{student.name}</h3>
          <p className="text-xs text-slate-500 uppercase tracking-tight">{student.studentId} • {student.course}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${student.riskScore > 75 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
          Risk: {student.riskScore}%
        </div>
      </div>
      
      <div className="bg-brand-50 border border-brand-100 p-4 rounded-lg mb-4 text-sm italic text-brand-900">
        <strong>AI Action:</strong> "{student.recommendation}"
      </div>

      <button onClick={() => onApprove(student.id)} className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-2 rounded-lg transition">
        Approve Intervention
      </button>
    </div>
  );
}