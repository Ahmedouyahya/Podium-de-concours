import { useState, useEffect, useCallback } from 'react';
import { Stats, Activity } from '../types';
import { activityApi } from '../services/api';

export const useStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await activityApi.getStats();
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error('Stats fetch error:', err);
    }
  }, []);

  const fetchActivity = useCallback(async (limit: number = 10) => {
    try {
      const activityData = await activityApi.getRecent(limit);
      setActivity(activityData);
    } catch (err) {
      console.error('Activity fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchActivity();

    const interval = setInterval(() => {
      fetchStats();
      fetchActivity();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchActivity]);

  return {
    stats,
    activity,
    loading,
    error,
    refreshStats: fetchStats,
    refreshActivity: fetchActivity,
  };
};

export default useStats;
