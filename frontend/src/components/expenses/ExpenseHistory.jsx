import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const ExpenseHistory = ({ expenses, limit = 5 }) => {
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

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Brak ostatnich wydatków
      </div>
    );
  }

  // Sort by date and take only the specified limit
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);

  return (
    <div className="space-y-2">
      {recentExpenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {expense.description}
            </p>
            <p className="text-xs text-gray-500">{formatDate(expense.created_at)}</p>
          </div>
          <div className="ml-4 text-right">
            <p className="text-sm font-semibold text-indigo-600">
              {formatCurrency(expense.amount)}
            </p>
            {expense.group_name && (
              <p className="text-xs text-gray-500">{expense.group_name}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseHistory;
