import { useGamification } from '@/lib/hooks/useGamification';

interface GamificationProfileCardProps {
  userId: string;
}

export default function GamificationProfileCard({ userId }: GamificationProfileCardProps) {
  const { gamification, loading, error } = useGamification(userId);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !gamification) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Tracking</h3>
        <p className="text-gray-600">Start practicing to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Progress</h3>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Level</span>
          <span className="text-xl font-bold text-blue-600">{gamification.level}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Points</span>
          <span className="font-medium">{gamification.points.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${(gamification.points % 500) / 5}%` }}
          ></div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Current Streak</span>
          <span className="font-medium">{gamification.streak.current} days</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Longest Streak</span>
          <span className="font-medium">{gamification.streak.longest} days</span>
        </div>
      </div>

      {gamification.achievements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Achievements</h4>
          <div className="flex flex-wrap gap-2">
            {gamification.achievements.slice(0, 3).map((achievement: string, index: number) => (
              <span 
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {achievement}
              </span>
            ))}
            {gamification.achievements.length > 3 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                +{gamification.achievements.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="pt-4 border-t">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Next: </span>
          {gamification.nextMilestone}
        </p>
      </div>
    </div>
  );
}
