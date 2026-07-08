import { useState, useEffect, useCallback } from 'react';
import { getUserGamification } from '@/lib/memory/memoryService';

export interface GamificationData {
  level: number;
  points: number;
  achievements: string[];
  streak: {
    current: number;
    longest: number;
    lastActivity: string;
  };
  nextMilestone: string;
  totalInterviews: number;
}

export function useGamification(userId: string | null) {
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGamification = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const gamificationData = await getUserGamification(id);
      setData(gamificationData);
      
    } catch (err: any) {
      console.error('Failed to fetch gamification:', err);
      setError(err.message || 'Failed to load gamification data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setData(null);
      return;
    }

    fetchGamification(userId);

    // Optional: Refresh every 5 minutes if needed
    const intervalId = setInterval(() => {
      fetchGamification(userId);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [userId, fetchGamification]);

  const refresh = useCallback(() => {
    if (userId) {
      fetchGamification(userId);
    }
  }, [userId, fetchGamification]);

  return {
    data,
    loading,
    error,
    refresh,
    hasData: !!data,
    level: data?.level || 1,
    points: data?.points || 0,
    achievements: data?.achievements || [],
    streak: data?.streak || { current: 0, longest: 0, lastActivity: '' },
    nextMilestone: data?.nextMilestone || 'Start practicing!',
    totalInterviews: data?.totalInterviews || 0
  };
}
