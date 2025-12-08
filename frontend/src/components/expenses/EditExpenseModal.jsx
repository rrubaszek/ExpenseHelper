import { useState, useEffect } from 'react';
import { expenseService } from '../../services/expenseService';
import { useToast } from '../ui/Toast';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const EditExpenseModal = ({ isOpen, onClose, onSuccess, expenseId, groupId, members }) => {
  const [expense, setExpense] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [customSplits, setCustomSplits] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingExpense, setFetchingExpense] = useState(false);
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && expenseId) {
      fetchExpense();
    }
  }, [isOpen, expenseId]);

  const fetchExpense = async () => {
    try {
      setFetchingExpense(true);
      const data = await expenseService.getExpense(expenseId);
      setExpense(data);
      setAmount(data.amount.toString());
      setDescription(data.description || '');
      setPayerId(data.payer_id.toString());

      // Determine split type
      const splits = data.splits || {};
      const splitValues = Object.values(splits);
      const isEqual = splitValues.length > 0 &&
        splitValues.every((val, i, arr) => Math.abs(val - arr[0]) < 0.01);

      setSplitType(isEqual ? 'equal' : 'custom');

      // Set custom splits
      const formattedSplits = {};
      Object.entries(splits).forEach(([userId, amount]) => {
        formattedSplits[userId] = amount.toString();
      });
      setCustomSplits(formattedSplits);
    } catch (error) {
      showError('Nie udało się pobrać danych wydatku');
      console.error('Error fetching expense:', error);
      onClose();
    } finally {
      setFetchingExpense(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showError('Podaj prawidłową kwotę');
      return;
    }

    if (!payerId) {
      showError('Wybierz osobę, która zapłaciła');
      return;
    }

    if (!description.trim()) {
      showError('Dodaj opis wydatku');
      return;
    }

    try {
      setLoading(true);

      let splitsFormatted = {};

      if (splitType === 'equal') {
        // Calculate equal splits
        const splitAmount = (amountNum / members.length).toFixed(2);
        members.forEach((member, index) => {
          if (index === members.length - 1) {
            // Last member gets remainder to handle rounding
            const currentSum = Object.values(splitsFormatted).reduce(
              (sum, val) => sum + parseFloat(val),
              0
            );
            splitsFormatted[member.id] = (amountNum - currentSum).toFixed(2);
          } else {
            splitsFormatted[member.id] = parseFloat(splitAmount);
          }
        });
      } else {
        // Validate custom splits
        const splitsSum = Object.values(customSplits).reduce(
          (sum, val) => sum + (parseFloat(val) || 0),
          0
        );

        if (Math.abs(splitsSum - amountNum) > 0.01) {
          showError(
            `Suma podziału (${splitsSum.toFixed(2)} PLN) musi być równa kwocie wydatku (${amountNum.toFixed(2)} PLN)`
          );
          setLoading(false);
          return;
        }

        // Convert splits to proper format
        Object.entries(customSplits).forEach(([userId, amount]) => {
          const splitAmount = parseFloat(amount);
          if (!isNaN(splitAmount) && splitAmount > 0) {
            splitsFormatted[parseInt(userId)] = splitAmount;
          }
        });

        if (Object.keys(splitsFormatted).length === 0) {
          showError('Dodaj przynajmniej jeden podział');
          setLoading(false);
          return;
        }
      }

      await expenseService.updateExpense(expenseId, {
        group_id: groupId,
        payer_id: parseInt(payerId),
        amount: amountNum,
        description,
        splits: splitsFormatted,
      });

      showSuccess('Wydatek został zaktualizowany');
      handleClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      showError('Nie udało się zaktualizować wydatku');
      console.error('Error updating expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setExpense(null);
    setAmount('');
    setDescription('');
    setPayerId('');
    setSplitType('equal');
    setCustomSplits({});
    onClose();
  };

  const handleCustomSplitChange = (userId, value) => {
    setCustomSplits((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  const calculateRemainingAmount = () => {
    const total = parseFloat(amount) || 0;
    const splitSum = Object.values(customSplits).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
    return total - splitSum;
  };

  const autoFillRemaining = () => {
    const remaining = calculateRemainingAmount();
    if (remaining <= 0) return;

    const unfilledMembers = members.filter(
      (m) => !customSplits[m.id] || parseFloat(customSplits[m.id]) === 0
    );

    if (unfilledMembers.length === 0) return;

    const amountPerPerson = (remaining / unfilledMembers.length).toFixed(2);
    const newSplits = { ...customSplits };

    unfilledMembers.forEach((member, index) => {
      if (index === unfilledMembers.length - 1) {
        // Last person gets the remainder to handle rounding
        const currentSum = Object.values(newSplits).reduce(
          (sum, val) => sum + (parseFloat(val) || 0),
          0
        );
        newSplits[member.id] = (parseFloat(amount) - currentSum).toFixed(2);
      } else {
        newSplits[member.id] = amountPerPerson;
      }
    });

    setCustomSplits(newSplits);
  };

  if (!isOpen) return null;

  if (fetchingExpense) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <LoadingSpinner size="lg" text="Ładowanie danych wydatku..." />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Edytuj wydatek</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition"
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

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Kwota (PLN)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Opis
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="np. Obiad w restauracji"
                required
              />
            </div>

            <div>
              <label htmlFor="payer" className="block text-sm font-medium text-gray-700 mb-1">
                Kto zapłacił?
              </label>
              <select
                id="payer"
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">Wybierz osobę</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} {member.id === user?.id ? '(Ty)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Typ podziału</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="splitType"
                    value="equal"
                    checked={splitType === 'equal'}
                    onChange={(e) => setSplitType(e.target.value)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Podział równy</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="splitType"
                    value="custom"
                    checked={splitType === 'custom'}
                    onChange={(e) => setSplitType(e.target.value)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Podział niestandardowy</span>
                </label>
              </div>
            </div>

            {splitType === 'custom' && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Kwoty dla poszczególnych osób
                  </label>
                  <button
                    type="button"
                    onClick={autoFillRemaining}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Uzupełnij resztę równo
                  </button>
                </div>

                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <label className="flex-1 text-sm text-gray-700">{member.name}</label>
                    <input
                      type="number"
                      value={customSplits[member.id] || ''}
                      onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      placeholder="0.00"
                    />
                    <span className="text-sm text-gray-500">PLN</span>
                  </div>
                ))}

                {amount && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Suma podziału:</span>
                      <span className="font-medium text-gray-900">
                        {Object.values(customSplits)
                          .reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
                          .toFixed(2)}{' '}
                        PLN
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-700">Pozostało:</span>
                      <span
                        className={`font-medium ${
                          Math.abs(calculateRemainingAmount()) < 0.01
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {calculateRemainingAmount().toFixed(2)} PLN
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              disabled={loading}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Aktualizowanie...</span>
                </>
              ) : (
                'Zapisz zmiany'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
