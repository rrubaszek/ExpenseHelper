const SettlementCard = ({ settlement, members, onMarkPaid }) => {
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-red-700">
                {getUsername(settlement.from_user).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getUsername(settlement.from_user)}
              </p>
              <p className="text-xs text-gray-500">Dłużnik</p>
            </div>
          </div>

          <svg
            className="w-6 h-6 text-gray-400 flex-shrink-0 mx-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-green-700">
                {getUsername(settlement.to_user).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getUsername(settlement.to_user)}
              </p>
              <p className="text-xs text-gray-500">Wierzyciel</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4">
          <div className="text-right">
            <p className="text-lg font-bold text-indigo-600">
              {formatCurrency(settlement.amount)}
            </p>
          </div>

          <button
            onClick={() => onMarkPaid(settlement)}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
          >
            Oznacz jako zapłacone
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettlementCard;
