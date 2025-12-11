import api from './api';

export const groupService = {
  // Get all groups from user report
  getAllGroups: async () => {
    const response = await api.get('/reports/me');
    return response.data.groups || [];
  },

  // Get detailed information about a specific group
  getGroupDetails: async (groupId) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  // Create a new group
  createGroup: async (name, description, memberIds) => {
    const response = await api.post('/groups/', {
      name,
      description,
      member_ids: memberIds,
    });
    return response.data;
  },

  // Add a member to a group
  addMember: async (groupId, userId) => {
    const response = await api.post(`/groups/${groupId}/members/${userId}`);
    return response.data;
  },

  // Get all available users
  getAvailableUsers: async () => {
    const response = await api.get('/users/get-users');
    return response.data;
  },
};
