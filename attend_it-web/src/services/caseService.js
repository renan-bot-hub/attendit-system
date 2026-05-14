import API from './api';

export const caseService = {
  // List cases (students see their own; staff see all)
  getCases: async () => API.get('/cases'),

  // Submit a new excuse / medical case
  createCase: async (data) => API.post('/cases', data),

  // Staff: approve / reject / revert a case
  updateStatus: async (id, status, reviewNote = '') =>
    API.patch(`/cases/${id}/status`, { status, reviewNote }),
};
