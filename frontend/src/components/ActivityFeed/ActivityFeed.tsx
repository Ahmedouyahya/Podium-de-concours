import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity as ActivityIcon, 
  Trophy, 
  Users, 
  Send, 
  Star,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Activity } from '../../types';
import { activityApi } from '../../services/api';
import './ActivityFeed.css';

interface ActivityFeedProps {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  limit = 10,
  autoRefresh = true,
  refreshInterval = 60000 
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newActivityIds, setNewActivityIds] = useState<Set<number>>(new Set());
  const previousIdsRef = useRef<Set<number>>(new Set());

  const fetchActivities = async () => {
    try {
      const data = await activityApi.getRecent(limit);
      
      // Track new activities for animation
      const currentIds = new Set(data.map((a: Activity) => a.id));
      const newIds = new Set<number>();
      
      currentIds.forEach((id: number) => {
        if (!previousIdsRef.current.has(id)) {
          newIds.add(id);
        }
      });

      if (newIds.size > 0 && previousIdsRef.current.size > 0) {
        setNewActivityIds(newIds);
        setTimeout(() => setNewActivityIds(new Set()), 3000);
      }

      previousIdsRef.current = currentIds;
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    if (autoRefresh) {
      const interval = setInterval(fetchActivities, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [limit, autoRefresh, refreshInterval]);

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'team_created':
        return <Users size={16} />;
      case 'score_added':
        return <TrendingUp size={16} />;
      case 'submission':
        return <Send size={16} />;
      case 'challenge_completed':
        return <Trophy size={16} />;
      case 'bonus':
        return <Star size={16} />;
      default:
        return <Zap size={16} />;
    }
  };

  const getActivityColor = (actionType: string): string => {
    switch (actionType) {
      case 'team_created':
        return 'var(--color-primary)';
      case 'score_added':
        return 'var(--color-success)';
      case 'submission':
        return 'var(--color-secondary)';
      case 'challenge_completed':
        return 'var(--color-gold)';
      case 'bonus':
        return 'var(--color-warning)';
      default:
        return 'var(--color-text-muted)';
    }
  };

  const formatTimeAgo = (date: string | Date): string => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return activityDate.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="activity-feed loading">
        <div className="activity-header">
          <ActivityIcon size={20} />
          <span>Activité récente</span>
        </div>
        <div className="activity-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-item">
              <div className="skeleton-icon" />
              <div className="skeleton-content">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      <div className="activity-header">
        <ActivityIcon size={20} />
        <span>Activité récente</span>
        <div className="live-dot" />
      </div>

      <div className="activity-list">
        <AnimatePresence mode="popLayout">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              className={`activity-item ${newActivityIds.has(activity.id) ? 'new' : ''}`}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: newActivityIds.has(activity.id) ? 0 : index * 0.05 
              }}
              layout
            >
              <div 
                className="activity-icon"
                style={{ backgroundColor: `${getActivityColor(activity.action_type)}20`, color: getActivityColor(activity.action_type) }}
              >
                {getActivityIcon(activity.action_type)}
              </div>

              <div className="activity-content">
                <p className="activity-description">{activity.description}</p>
                <span className="activity-time">{formatTimeAgo(activity.created_at)}</span>
              </div>

              {activity.points_change > 0 && (
                <div className="activity-points">
                  <span>+{activity.points_change}</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {activities.length === 0 && (
          <div className="no-activity">
            <ActivityIcon size={32} />
            <p>Aucune activité récente</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
