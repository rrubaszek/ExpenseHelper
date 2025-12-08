import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const UserReportPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showError } = useToast();

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getUserReport();
      setReportData(data);
    } catch (error) {
      showError('Nie udało się pobrać raportu');
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Ładowanie raportu..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-indigo-600">ExpenseHelper</h1>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/report')}
                  className="text-sm font-medium text-indigo-600 border-b-2 border-indigo-600"
                >
                  Raport
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Twój raport finansowy
          </h2>
          <p className="text-gray-600">
            Podsumowanie wszystkich wydatków i rozliczeń
          </p>
        </div>

        {/* Total Balance */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 mb-2">Całkowity bilans</p>
              <p className="text-4xl font-bold">
                {reportData?.total_balance !== undefined
                  ? formatCurrency(reportData.total_balance)
                  : '0,00 PLN'}
              </p>
              <p className="text-indigo-100 mt-2 text-sm">
                {reportData?.total_balance > 0
                  ? 'Należy Ci się ogółem'
                  : reportData?.total_balance < 0
                  ? 'Jesteś winny ogółem'
                  : 'Wszystko rozliczone'}
              </p>
            </div>
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Groups Balance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Bilans w grupach</h3>
          {reportData?.groups && reportData.groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.groups.map((group) => {
                const isPositive = group.balance > 0;
                const isZero = Math.abs(group.balance) < 0.01;

                return (
                  <div
                    key={group.id}
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition ${
                      isZero
                        ? 'bg-gray-50 border-gray-200'
                        : isPositive
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{group.name}</h4>
                    <p className="text-xs text-gray-600 mb-3">
                      {group.members?.length || 0} członków
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        isZero
                          ? 'text-gray-600'
                          : isPositive
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {isZero
                        ? 'Rozliczone'
                        : isPositive
                        ? `+${formatCurrency(group.balance)}`
                        : formatCurrency(group.balance)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Brak grup</p>
          )}
        </div>

        {/* Expense History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Historia wydatków
          </h3>
          {reportData?.expense_history && reportData.expense_history.length > 0 ? (
            <div className="space-y-3">
              {reportData.expense_history
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10)
                .map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {expense.description}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {formatDate(expense.created_at)}
                        {expense.group_name && (
                          <span className="ml-2 text-indigo-600">
                            • {expense.group_name}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-base font-semibold text-indigo-600">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Brak wydatków</p>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Historia płatności
          </h3>
          {reportData?.payment_history && reportData.payment_history.length > 0 ? (
            <div className="space-y-3">
              {reportData.payment_history
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm font-medium text-gray-900">
                          Płatność wykonana
                        </p>
                      </div>
                      <p className="text-xs text-gray-600">
                        {formatDate(payment.created_at)}
                        {payment.group_name && (
                          <span className="ml-2 text-indigo-600">
                            • {payment.group_name}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-base font-semibold text-green-600">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Brak historii płatności
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserReportPage;
