import api from './api';

export const settlementService = {
  // Get settlements for a specific group
  getGroupSettlements: async (groupId) => {
    const response = await api.get(`/settlements/group/${groupId}`);
    return response.data;
  },

  // Mark a payment as paid
  markPaid: async (fromUserId, toUserId, amount, groupId) => {
    const response = await api.post('/settlements/mark-paid', {
      from_user: fromUserId,
      to_user: toUserId,
      amount,
      group_id: groupId,
    });
    return response.data;
  },
};
