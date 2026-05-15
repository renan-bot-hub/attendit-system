import API from './api';

export const attendService = {
  submitManual: (sessionId, records) =>
    API.post('/attendance/manual', { sessionId, records }),

  // filters: { sessionId?, studentId?, status?, section?, markedBy?, from?, to? }
  getLedger: (filters = {}) => API.get('/attendance/ledger', { params: filters }),

  correctEntry: (id, status) => API.patch(`/attendance/${id}`, { status }),

  getRiskAnalysis: () => API.get('/attendance/risk-analysis'),
  getSummary:      () => API.get('/attendance/summary'),
  getTrend:        (days = 14) => API.get('/attendance/trend', { params: { days } }),
};
