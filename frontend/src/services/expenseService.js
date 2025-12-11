import api from './api';

export const expenseService = {
  // Get all expenses for a specific group
  getGroupExpenses: async (groupId) => {
    const response = await api.get(`/expenses/group/${groupId}`);
    return response.data;
  },

  // Create expense with custom splits
  createExpense: async (expenseData) => {
    const response = await api.post('/expenses/', expenseData);
    return response.data;
  },

  // Create expense with equal split
  createEqualSplitExpense: async (groupId, payerId, amount, description) => {
    const response = await api.post('/expenses/equal-split', {
      group_id: groupId,
      payer_id: payerId,
      amount,
      description,
    });
    return response.data;
  },

  // Get single expense by ID
  getExpense: async (expenseId) => {
    const response = await api.get(`/expenses/${expenseId}`);
    return response.data;
  },

  // Update expense
  updateExpense: async (expenseId, expenseData) => {
    const response = await api.put(`/expenses/${expenseId}`, expenseData);
    return response.data;
  },

  // Delete expense
  deleteExpense: async (expenseId) => {
    const response = await api.delete(`/expenses/${expenseId}`);
    return response.data;
  },
};
