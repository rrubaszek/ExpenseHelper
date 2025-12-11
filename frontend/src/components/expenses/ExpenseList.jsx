import { useState } from 'react';
import ExpenseItem from './ExpenseItem';
import EditExpenseModal from './EditExpenseModal';
import LoadingSpinner from '../ui/LoadingSpinner';

const ExpenseList = ({ expenses, members, loading, onRefresh, groupId }) => {
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" text="Ładowanie wydatków..." />
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
            />
          </svg>
        </div>
        <p className="text-gray-600 mb-1">Brak wydatków w tej grupie</p>
        <p className="text-sm text-gray-500">Kliknij "Dodaj wydatek" aby zacząć</p>
      </div>
    );
  }

  // Sort expenses by date (newest first)
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const handleEdit = (expenseId) => {
    setEditingExpenseId(expenseId);
  };

  const handleEditSuccess = () => {
    setEditingExpenseId(null);
    if (onRefresh) onRefresh();
  };

  const handleDelete = () => {
    if (onRefresh) onRefresh();
  };

  return (
    <>
      <div className="space-y-3">
        {sortedExpenses.map((expense) => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
            members={members}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {editingExpenseId && (
        <EditExpenseModal
          isOpen={!!editingExpenseId}
          onClose={() => setEditingExpenseId(null)}
          expenseId={editingExpenseId}
          groupId={groupId}
          members={members}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default ExpenseList;
