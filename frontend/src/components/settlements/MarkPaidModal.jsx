import { useState } from 'react';
import { settlementService } from '../../services/settlementService';
import { useToast } from '../ui/Toast';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useParams } from 'react-router-dom';

const MarkPaidModal = ({ isOpen, onClose, onSuccess, settlement, members }) => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const { groupId } = useParams();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const getUsername = (userId) => {
    const user = members.find((m) => m.id === userId);
    return user?.name || `Użytkownik #${userId}`;
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await settlementService.markPaid(
        settlement.from_user,
        settlement.to_user,
        settlement.amount,
        parseInt(groupId)
      );
      showSuccess('Płatność została oznaczona jako wykonana');
      if (onSuccess) onSuccess();
    } catch (error) {
      showError('Nie udało się oznaczyć płatności');
      console.error('Error marking payment as paid:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Potwierdź płatność</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-indigo-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-base font-semibold text-red-700">
                  {getUsername(settlement.from_user).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Dłużnik</p>
                <p className="font-semibold text-gray-900">
                  {getUsername(settlement.from_user)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center my-2">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-base font-semibold text-green-700">
                  {getUsername(settlement.to_user).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Wierzyciel</p>
                <p className="font-semibold text-gray-900">
                  {getUsername(settlement.to_user)}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-indigo-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Kwota:</span>
                <span className="text-xl font-bold text-indigo-600">
                  {formatCurrency(settlement.amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800 mb-1">Uwaga!</p>
                <p className="text-sm text-yellow-700">
                  Upewnij się, że płatność została rzeczywiście wykonana przed oznaczeniem jej jako zapłaconej.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              disabled={loading}
            >
              Anuluj
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Przetwarzanie...</span>
                </>
              ) : (
                'Potwierdź płatność'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkPaidModal;
