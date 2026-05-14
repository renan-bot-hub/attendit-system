import API from './api';

export const caseService = {
  getCases: async () => {
    return await API.get('/cases');
  },

  createCase: async (data) => {
    return await API.post('/cases', data);
  },

  updateStatus: async (id, status, reviewNote = '') => {
    return await API.patch(`/cases/${id}/status`, { status, reviewNote });
  },
};
