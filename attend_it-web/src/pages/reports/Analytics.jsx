import React, { useState } from 'react';

const initialInsights = [
  { id: 1, text: "Grade 10 attendance dropped by 4% this week. Strong correlation with recent heavy rainfall in local districts.", type: "Alert", color: "text-red-600 bg-red-50 border-red-200" },
  { id: 2, text: "Teacher interventions via the messaging module improved 'High Risk' student attendance by 18% over the last 30 days.", type: "Success", color: "text-green-600 bg-green-50 border-green-200" },
  { id: 3, text: "Predictive model suggests 5 students will shift to 'Critical' risk next week based on recurring Friday absences.", type: "Warning", color: "text-orange-600 bg-orange-50 border-orange-200" }
];

export default function Analytics() {
  const [insights, setInsights] = useState(initialInsights);
  const [isTraining, setIsTraining] = useState(false);
  const [lastTrained, setLastTrained] = useState("2 hours ago");

  // 🛑 MOCK FUNCTION: Simulate Retraining AI
  const handleRetrain = () => {
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
      setLastTrained("Just now");
      alert("AI Model retraining complete. Data is up to date.");
    }, 2000); // Fakes a 2-second load time
  };

  // 🛑 MOCK FUNCTION: Dismiss an insight
  const dismissInsight = (id) => {
    setInsights(insights.filter(insight => insight.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics Hub</h1>
          <p className="text-slate-500 mt-1">AI-driven attendance patterns and prescriptive insights.</p>
        </div>
        <button 
          onClick={handleRetrain} 
          disabled={isTraining}
          className={`${isTraining ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2`}
        >
          {isTraining ? '⚙️ Processing...' : '🔄 Run AI Analysis'}
        </button>
      </header>

      {/* AI Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Attendance</p>
          <p className="text-3xl font-black text-blue-600 mt-1">92.4%</p>
          <p className="text-xs text-green-500 font-bold mt-2">↑ 1.2% from last month</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">High Risk</p>
          <p className="text-3xl font-black text-red-500 mt-1">47</p>
          <p className="text-xs text-red-400 font-bold mt-2">Requires immediate action</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interventions</p>
          <p className="text-3xl font-black text-slate-800 mt-1">128</p>
          <p className="text-xs text-slate-500 font-medium mt-2">Active parent chats</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">TensorFlow</p>
          <p className="text-2xl font-black mt-1">Active</p>
          <p className="text-xs text-indigo-200 mt-2">Last trained: {lastTrained}</p>
        </div>
      </div>

      {/* Prescriptive Insights Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
          <span>🧠</span> AI Prescriptive Insights
        </h2>
        <div className="space-y-4">
          {insights.length === 0 && <p className="text-slate-500 text-sm">No active insights at the moment.</p>}
          {insights.map((insight) => (
            <div key={insight.id} className={`p-4 rounded-xl border ${insight.color} flex justify-between items-start`}>
              <p className="font-medium pr-4">{insight.text}</p>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-black uppercase tracking-wider bg-white px-2 py-1 rounded opacity-80 shadow-sm">
                  {insight.type}
                </span>
                <button onClick={() => dismissInsight(insight.id)} className="font-bold hover:opacity-50 transition-opacity">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}