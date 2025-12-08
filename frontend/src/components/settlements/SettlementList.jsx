import { useState } from 'react';
import SettlementCard from './SettlementCard';
import MarkPaidModal from './MarkPaidModal';
import LoadingSpinner from '../ui/LoadingSpinner';

const SettlementList = ({ settlementsData, members, loading, onRefresh }) => {
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);

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

  const handleMarkPaid = (settlement) => {
    setSelectedSettlement(settlement);
    setIsMarkPaidModalOpen(true);
  };

  const handleMarkPaidSuccess = () => {
    setIsMarkPaidModalOpen(false);
    setSelectedSettlement(null);
    if (onRefresh) onRefresh();
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" text="Ładowanie rozliczeń..." />
      </div>
    );
  }

  if (!settlementsData) {
    return (
      <div className="text-center py-12 text-gray-500">
        Brak danych o rozliczeniach
      </div>
    );
  }

  const { balances, settlements } = settlementsData;

  return (
    <div className="space-y-6">
      {/* Balances Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bilans uczestników</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {balances && Object.entries(balances).length > 0 ? (
            Object.entries(balances).map(([userId, balance]) => {
              const isPositive = balance > 0;
              const isZero = Math.abs(balance) < 0.01;

              return (
                <div
                  key={userId}
                  className={`p-4 rounded-lg border ${
                    isZero
                      ? 'bg-gray-50 border-gray-200'
                      : isPositive
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {getUsername(parseInt(userId))}
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
                      ? `+${formatCurrency(balance)}`
                      : formatCurrency(balance)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {isZero
                      ? 'Brak należności'
                      : isPositive
                      ? 'Należy się'
                      : 'Jest winny'}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              Brak danych o bilansie
            </div>
          )}
        </div>
      </div>

      {/* Settlements Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sugerowane rozliczenia
        </h3>
        {settlements && settlements.length > 0 ? (
          <div className="space-y-3">
            {settlements.map((settlement, index) => (
              <SettlementCard
                key={index}
                settlement={settlement}
                members={members}
                onMarkPaid={handleMarkPaid}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-green-600"
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
            </div>
            <p className="text-gray-600 mb-1">Wszystko rozliczone!</p>
            <p className="text-sm text-gray-500">
              Brak oczekujących rozliczeń w tej grupie
            </p>
          </div>
        )}
      </div>

      {selectedSettlement && (
        <MarkPaidModal
          isOpen={isMarkPaidModalOpen}
          onClose={() => setIsMarkPaidModalOpen(false)}
          onSuccess={handleMarkPaidSuccess}
          settlement={selectedSettlement}
          members={members}
        />
      )}
    </div>
  );
};

export default SettlementList;
