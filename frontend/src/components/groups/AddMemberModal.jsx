import { useState, useEffect } from 'react';
import { groupService } from '../../services/groupService';
import { useToast } from '../ui/Toast';
import LoadingSpinner from '../ui/LoadingSpinner';

const AddMemberModal = ({ isOpen, onClose, onSuccess, groupId, existingMembers }) => {
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const users = await groupService.getAvailableUsers();

      // Filter out users who are already members
      const existingMemberIds = existingMembers.map(m => m.id);
      const filtered = users.filter(user => !existingMemberIds.includes(user.id));

      setAvailableUsers(filtered);
    } catch (error) {
      showError('Nie udało się pobrać listy użytkowników');
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUserId) {
      showError('Wybierz użytkownika');
      return;
    }

    try {
      setLoading(true);
      await groupService.addMember(groupId, parseInt(selectedUserId));
      showSuccess('Członek został dodany do grupy');
      handleClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      showError('Nie udało się dodać członka do grupy');
      console.error('Error adding member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Dodaj członka</h2>
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
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-2">
                Wybierz użytkownika
              </label>
              {loadingUsers ? (
                <div className="py-8">
                  <LoadingSpinner size="md" text="Ładowanie użytkowników..." />
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                  Wszyscy użytkownicy są już członkami tej grupy
                </div>
              ) : (
                <select
                  id="user"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Wybierz użytkownika</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
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
              disabled={loading || availableUsers.length === 0}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Dodawanie...</span>
                </>
              ) : (
                'Dodaj'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
