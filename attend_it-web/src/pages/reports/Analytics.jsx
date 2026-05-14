import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { attendService } from '../../services/attendService';

export default function Analytics() {
  const [summary, setSummary] = useState({
    overallRate: 0, totalSessions: 0, totalStudents: 0, present: 0, late: 0, absent: 0,
  });
  const [risk, setRisk] = useState([]);
  const [insights, setInsights] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastTrained, setLastTrained] = useState('Never');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, riskRes] = await Promise.all([
        attendService.getSummary(),
        attendService.getRiskAnalysis(),
      ]);
      setSummary(sumRes.data);
      setRisk(riskRes.data);
      buildInsights(sumRes.data, riskRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  const buildInsights = (sum, riskData) => {
    const generated = [];
    const critical = riskData.filter((r) => r.riskLevel === 'Critical').length;
    const high = riskData.filter((r) => r.riskLevel === 'High Risk').length;

    if (critical > 0) {
      generated.push({
        id: 1, type: 'alert', badge: 'ALERT',
        message: `${critical} student${critical > 1 ? 's are' : ' is'} currently in Critical risk (<75% attendance). Immediate intervention recommended.`,
      });
    }
    if (high > 0) {
      generated.push({
        id: 2, type: 'warning', badge: 'WARNING',
        message: `${high} student${high > 1 ? 's are' : ' is'} in High Risk band (75–85%). Schedule parent outreach.`,
      });
    }
    if (sum.overallRate >= 90) {
      generated.push({
        id: 3, type: 'success', badge: 'SUCCESS',
        message: `Overall attendance is strong at ${sum.overallRate}%. Keep the momentum going.`,
      });
    } else if (sum.overallRate > 0 && sum.overallRate < 80) {
      generated.push({
        id: 4, type: 'alert', badge: 'ALERT',
        message: `Overall attendance has dropped to ${sum.overallRate}%. Review section-level trends.`,
      });
    }
    if (sum.totalSessions === 0) {
      generated.push({
        id: 5, type: 'warning', badge: 'INFO',
        message: 'No sessions logged yet. Create a session and record attendance to generate insights.',
      });
    }
    setInsights(generated);
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    await loadData();
    setLastTrained(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setIsAnalyzing(false);
  };

  const handleDismissInsight = (id) => {
    setInsights(insights.filter((i) => i.id !== id));
  };

  const getBannerStyles = (type) => {
    switch (type) {
      case 'alert':   return { wrapper: 'bg-red-50 border-red-200 text-red-700', text: 'text-red-700' };
      case 'success': return { wrapper: 'bg-green-50 border-green-200 text-green-700', text: 'text-green-700' };
      case 'warning': return { wrapper: 'bg-orange-50 border-orange-200 text-orange-700', text: 'text-orange-700' };
      default:        return { wrapper: 'bg-slate-50 border-slate-200 text-slate-700', text: 'text-slate-700' };
    }
  };

  const criticalCount = risk.filter((r) => r.riskLevel === 'Critical').length;
  const highCount = risk.filter((r) => r.riskLevel === 'High Risk').length;
  const totalAtRisk = criticalCount + highCount;

  return (
    <div className="p-8 max-w-6xl mx-auto">

      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics Hub</h1>
          <p className="text-slate-500 mt-2">Live attendance metrics powered by your data.</p>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className={`flex items-center px-6 py-3 rounded-xl font-bold text-white transition-all shadow-sm ${
            isAnalyzing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isAnalyzing ? (
            <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Refreshing...</>
          ) : (
            'Refresh Analysis'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Attendance</p>
          <h2 className="text-4xl font-black text-blue-600 mb-2">{loading ? '—' : `${summary.overallRate}%`}</h2>
          <p className="text-xs font-medium text-slate-500">
            {summary.present + summary.late} of {summary.present + summary.late + summary.absent} marked present/late
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">At Risk</p>
          <h2 className="text-4xl font-black text-red-500 mb-2">{loading ? '—' : totalAtRisk}</h2>
          <p className="text-xs font-bold text-red-400">{criticalCount} Critical • {highCount} High</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Sessions</p>
          <h2 className="text-4xl font-black text-slate-800 mb-2">{loading ? '—' : summary.totalSessions}</h2>
          <p className="text-xs font-medium text-slate-500">Across all teachers</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 text-white">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Students</p>
          <h2 className="text-4xl font-black text-white mb-2">{loading ? '—' : summary.totalStudents}</h2>
          <p className="text-xs font-medium text-slate-400">Last refreshed: {lastTrained}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">Prescriptive Insights</h2>

        <div className="space-y-4">
          {loading && <p className="text-center text-slate-400">Loading insights...</p>}
          {!loading && insights.length > 0 ? (
            insights.map((insight) => {
              const styles = getBannerStyles(insight.type);
              return (
                <div key={insight.id} className={`flex items-center justify-between p-4 rounded-xl border ${styles.wrapper} transition-all`}>
                  <p className="text-sm font-medium pr-4">{insight.message}</p>
                  <div className="flex items-center shrink-0">
                    <span className={`text-xs font-black tracking-wider uppercase mr-4 ${styles.text}`}>
                      {insight.badge}
                    </span>
                    <button onClick={() => handleDismissInsight(insight.id)}
                      className={`p-1 rounded-md hover:bg-black/5 transition-colors ${styles.text}`}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            !loading && (
              <div className="text-center py-12 text-slate-400">
                <RefreshCw className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                <p className="font-medium">No insights generated yet.</p>
                <p className="text-sm">Record some attendance and refresh to generate insights.</p>
              </div>
            )
          )}
        </div>

        {risk.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Risk Breakdown</h3>
            <div className="space-y-2">
              {risk.slice(0, 10).map((r) => (
                <div key={r.studentId} className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.section || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-slate-900">{r.attendanceRate}%</p>
                    <p className={`text-[10px] font-black uppercase ${
                      r.riskLevel === 'Critical' ? 'text-red-600' :
                      r.riskLevel === 'High Risk' ? 'text-orange-600' :
                      r.riskLevel === 'Moderate' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>{r.riskLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
