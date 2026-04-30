import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

export default function AnalyticsHub() {
  // Loading state for the AI Analysis button
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastTrained, setLastTrained] = useState('2 hours ago');

  // AI Prescriptive Insights
  const [insights, setInsights] = useState([
    {
      id: 1,
      type: 'alert',
      badge: 'ALERT',
      message: 'Grade 10 attendance dropped by 4% this week. Strong correlation with recent heavy rainfall in local districts.',
    },
    {
      id: 2,
      type: 'success',
      badge: 'SUCCESS',
      message: "Teacher interventions via the messaging module improved 'High Risk' student attendance by 18% over the last 30 days.",
    },
    {
      id: 3,
      type: 'warning',
      badge: 'WARNING',
      message: "Predictive model suggests 5 students will shift to 'Critical' risk next week based on recurring Friday absences.",
    }
  ]);

  // 3. Handlers
  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate an API call
    setTimeout(() => {
      setIsAnalyzing(false);
      setLastTrained('Just now');
    }, 2500);
  };

  const handleDismissInsight = (id) => {
    setInsights(insights.filter(insight => insight.id !== id));
  };

  // Helper for dynamic styling of the insight banners
  const getBannerStyles = (type) => {
    switch (type) {
      case 'alert':
        return { wrapper: 'bg-red-50 border-red-200 text-red-700', text: 'text-red-700' };
      case 'success':
        return { wrapper: 'bg-green-50 border-green-200 text-green-700', text: 'text-green-700' };
      case 'warning':
        return { wrapper: 'bg-orange-50 border-orange-200 text-orange-700', text: 'text-orange-700' };
      default:
        return { wrapper: 'bg-slate-50 border-slate-200 text-slate-700', text: 'text-slate-700' };
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      {/* Header Section */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics Hub</h1>
        </div>
        <button 
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className={`flex items-center px-6 py-3 rounded-xl font-bold text-white transition-all shadow-sm ${
            isAnalyzing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Analyzing...
            </>
          ) : (
            'Run AI Analysis'
          )}
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Stat 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Attendance</p>
          <h2 className="text-4xl font-black text-blue-600 mb-2">92.4%</h2>
          <p className="text-xs font-bold text-emerald-500 flex items-center">
            ↑ 1.2% from last month
          </p>
        </div>

        {/* Stat 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">High Risk</p>
          <h2 className="text-4xl font-black text-red-500 mb-2">47</h2>
          <p className="text-xs font-bold text-red-400">Requires immediate action</p>
        </div>

        {/* Stat 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Interventions</p>
          <h2 className="text-4xl font-black text-slate-800 mb-2">128</h2>
          <p className="text-xs font-medium text-slate-500">Active parent chats</p>
        </div>

        {/* Stat 4 (System Status) */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 text-white">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">TensorFlow</p>
          <h2 className="text-4xl font-black text-white mb-2">Active</h2>
          <p className="text-xs font-medium text-slate-400">Last trained: {lastTrained}</p>
        </div>
      </div>

      {/* Prescriptive Insights Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">AI Prescriptive Insights</h2>
        
        <div className="space-y-4">
          {insights.length > 0 ? (
            insights.map((insight) => {
              const styles = getBannerStyles(insight.type);
              return (
                <div 
                  key={insight.id} 
                  className={`flex items-center justify-between p-4 rounded-xl border ${styles.wrapper} transition-all`}
                >
                  <p className="text-sm font-medium pr-4">{insight.message}</p>
                  
                  <div className="flex items-center shrink-0">
                    <span className={`text-xs font-black tracking-wider uppercase mr-4 ${styles.text}`}>
                      {insight.badge}
                    </span>
                    <button 
                      onClick={() => handleDismissInsight(insight.id)}
                      className={`p-1 rounded-md hover:bg-black/5 transition-colors ${styles.text}`}
                      aria-label="Dismiss insight"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="font-medium">All insights reviewed.</p>
              <p className="text-sm">Run AI Analysis to generate fresh insights.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}