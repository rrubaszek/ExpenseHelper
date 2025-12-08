import GroupCard from './GroupCard';
import LoadingSpinner from '../ui/LoadingSpinner';

const GroupList = ({ groups, loading }) => {
  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" text="Ładowanie grup..." />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <p className="text-gray-600 mb-1">Nie masz jeszcze żadnych grup</p>
        <p className="text-sm text-gray-500">
          Kliknij przycisk "Utwórz grupę" aby zacząć
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
};

export default GroupList;
