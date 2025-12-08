import { useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { expenseService } from '../../services/expenseService';
import { useToast } from '../ui/Toast';

const ExpenseItem = ({ expense, members, onEdit, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showSuccess, showError } = useToast();
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd.MM.yyyy HH:mm', { locale: pl });
    } catch (error) {
      return dateString;
    }
  };

  const getPayerName = () => {
    const payer = members.find(m => m.id === expense.payer_id);
    return payer?.name || `Użytkownik #${expense.payer_id}`;
  };

  const getSplitInfo = () => {
    if (!expense.splits || Object.keys(expense.splits).length === 0) {
      return 'Brak podziału';
    }

    const splitCount = Object.keys(expense.splits).length;
    const allEqual = Object.values(expense.splits).every(
      (val, i, arr) => Math.abs(val - arr[0]) < 0.01
    );

    if (allEqual) {
      return `Równy podział (${splitCount} osób)`;
    }

    return `Niestandardowy podział (${splitCount} osób)`;
  };

  const isEqualSplit = () => {
    if (!expense.splits || Object.keys(expense.splits).length === 0) {
      return false;
    }
    const values = Object.values(expense.splits);
    return values.every((val, i, arr) => Math.abs(val - arr[0]) < 0.01);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await expenseService.deleteExpense(expense.id);
      showSuccess('Wydatek został usunięty');
      setShowDeleteConfirm(false);
      if (onDelete) onDelete();
    } catch (error) {
      showError('Nie udało się usunąć wydatku');
      console.error('Error deleting expense:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-20">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-base font-semibold text-gray-900">{expense.description}</h4>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  isEqualSplit()
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                {isEqualSplit() ? 'Równy' : 'Custom'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Zapłacił: <span className="font-medium">{getPayerName()}</span>
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="text-right mr-2">
              <p className="text-lg font-bold text-indigo-600">{formatCurrency(expense.amount)}</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onEdit && onEdit(expense.id)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Edytuj wydatek"
                disabled={deleting}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Usuń wydatek"
                disabled={deleting}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <span>{getSplitInfo()}</span>
        <span>{formatDate(expense.created_at)}</span>
      </div>

      {expense.splits && Object.keys(expense.splits).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-700 mb-2">Podział:</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(expense.splits).map(([userId, amount]) => {
              const user = members.find(m => m.id === parseInt(userId));
              return (
                <div
                  key={userId}
                  className="flex justify-between text-xs bg-gray-50 rounded px-2 py-1"
                >
                  <span className="text-gray-700">{user?.name || `User #${userId}`}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Usuń wydatek</h3>
                <p className="text-sm text-gray-600">Czy na pewno chcesz usunąć ten wydatek?</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">{expense.description}</p>
              <p className="text-lg font-bold text-indigo-600 mt-1">{formatCurrency(expense.amount)}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                disabled={deleting}
              >
                Anuluj
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleting}
              >
                {deleting ? 'Usuwanie...' : 'Usuń'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpenseItem;
