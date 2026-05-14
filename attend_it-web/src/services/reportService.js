import API from './api';

export const reportService = {
  // Get risk analysis for reports
  getRiskAnalysis: async () => {
    return await API.get('/attendance/risk-analysis');
  },

  // Get full attendance ledger for export
  getLedger: async (filters = {}) => {
    return await API.get('/attendance/ledger', { params: filters });
  },
};
