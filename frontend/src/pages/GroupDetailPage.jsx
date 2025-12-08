import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupService } from '../services/groupService';
import { expenseService } from '../services/expenseService';
import { settlementService } from '../services/settlementService';
import { useToast } from '../components/ui/Toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AddMemberModal from '../components/groups/AddMemberModal';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import ExpenseList from '../components/expenses/ExpenseList';
import SettlementList from '../components/settlements/SettlementList';

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' or 'settlements'

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const [groupData, expensesData, settlementsData] = await Promise.all([
        groupService.getGroupDetails(groupId),
        expenseService.getGroupExpenses(groupId),
        settlementService.getGroupSettlements(groupId),
      ]);

      setGroup(groupData);
      setExpenses(expensesData);
      setSettlements(settlementsData);
    } catch (error) {
      showError('Nie udało się pobrać danych grupy');
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemberSuccess = () => {
    fetchGroupData();
  };

  const handleAddExpenseSuccess = () => {
    fetchGroupData();
  };

  const handleRefreshSettlements = () => {
    fetchGroupData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Ładowanie grupy..." />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Nie znaleziono grupy</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Wróć do Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-indigo-600">ExpenseHelper</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Group Header */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-sm border border-indigo-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h2>
              {group.description && (
                <p className="text-gray-600">{group.description}</p>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Członkowie grupy</h3>
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Dodaj członka
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.members.map((member) => (
                <div
                  key={member.id}
                  className="bg-white px-3 py-2 rounded-lg border border-indigo-100 flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Dodaj wydatek
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                  activeTab === 'expenses'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Wydatki
              </button>
              <button
                onClick={() => setActiveTab('settlements')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                  activeTab === 'settlements'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Rozliczenia
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'expenses' ? (
              <ExpenseList
                expenses={expenses}
                members={group.members}
                loading={false}
                onRefresh={fetchGroupData}
                groupId={groupId}
              />
            ) : (
              <SettlementList
                settlementsData={settlements}
                members={group.members}
                loading={false}
                onRefresh={handleRefreshSettlements}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSuccess={handleAddMemberSuccess}
        groupId={groupId}
        existingMembers={group.members}
      />

      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        onSuccess={handleAddExpenseSuccess}
        groupId={groupId}
        members={group.members}
      />
    </div>
  );
};

export default GroupDetailPage;
