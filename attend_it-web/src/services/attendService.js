import API from './api';

export const attendService = {
  // Submit attendance records for a whole class session
  submitManual: async (sessionId, records) =>
    API.post('/attendance/manual', { sessionId, records }),

  // Fetch ledger entries (optionally filtered by session or student)
  getLedger: async (filters = {}) => API.get('/attendance/ledger', { params: filters }),

  // Update a single attendance entry's status
  correctEntry: async (id, status) => API.patch(`/attendance/${id}`, { status }),

  // Per-student risk levels based on attendance rate
  getRiskAnalysis: async () => API.get('/attendance/risk-analysis'),

  // Overall KPIs (total sessions, students, attendance rate)
  getSummary: async () => API.get('/attendance/summary'),
};
