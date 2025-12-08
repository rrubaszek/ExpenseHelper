import api from './api';

export const reportService = {
  // Get user report with all data
  getUserReport: async () => {
    const response = await api.get('/reports/me');
    return response.data;
  },
};
