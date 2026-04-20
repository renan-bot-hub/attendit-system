import API from './api';

export const attendService = {
  // "Systems receives attendance data" in the diagram
  submitAttendance: async (attendanceData) => {
    return await API.post('/attendance/scan', attendanceData);
  },

  // "System runs AI-based attendance risk analysis"
  getAiRiskAnalysis: async () => {
    return await API.get('/attendance/risk-analysis');
  },

  // "System triggers alert notifications"
  approveIntervention: async (studentId, decisionData) => {
    return await API.post(`/attendance/intervene/${studentId}`, decisionData);
  },

  // "System generates reports for school management"
  getManagementReport: async () => {
    return await API.get('/attendance/reports/management');
  }
};