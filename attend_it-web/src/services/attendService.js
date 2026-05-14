import API from './api';

export const attendService = {
  // Teacher manually submits attendance list for a session
  submitManual: async (sessionId, records) => {
    return await API.post('/attendance/manual', { sessionId, records });
  },

  // Fetch attendance ledger (filterable by sessionId or studentId)
  getLedger: async (filters = {}) => {
    return await API.get('/attendance/ledger', { params: filters });
  },

  // Correct a single attendance entry
  correctEntry: async (id, status) => {
    return await API.patch(`/attendance/${id}`, { status });
  },

  // Get at-risk student data
  getRiskAnalysis: async () => {
    return await API.get('/attendance/risk-analysis');
  },

  // Get overall KPIs for analytics
  getSummary: async () => {
    return await API.get('/attendance/summary');
  },
};
