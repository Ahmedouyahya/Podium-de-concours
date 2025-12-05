import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  Sparkles,
  Clock,
  Zap
} from 'lucide-react';
import Podium from '../components/Podium/Podium';
import Leaderboard from '../components/Leaderboard/Leaderboard';
import StatsCards from '../components/Stats/StatsCards';
import Countdown from '../components/Countdown/Countdown';
import ActivityFeed from '../components/ActivityFeed/ActivityFeed';
import useLeaderboard from '../hooks/useLeaderboard';
import useStats from '../hooks/useStats';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { leaderboard, loading: leaderboardLoading, refresh } = useLeaderboard(30000);
  const { stats, loading: statsLoading } = useStats();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Competition end date - Nuit de l'Info 2025 (December 4th, 2025 at 8:00 AM)
  const competitionEndDate = useMemo(() => new Date('2025-12-04T08:00:00'), []);

  useEffect(() => {
    if (!leaderboardLoading) {
      setLastUpdate(new Date());
    }
  }, [leaderboard, leaderboardLoading]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="dashboard">
      <div className="container">
        {/* Header */}
        <motion.header 
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <div className="header-title-section">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="header-sparkle" size={32} aria-hidden="true" />
              </motion.div>
              <div>
                <h1 className="dashboard-title">Tableau de Bord</h1>
                <p className="dashboard-subtitle">
                  Suivez la compétition en temps réel
                </p>
              </div>
            </div>
            
            <div className="header-actions">
              <div className="last-update" aria-live="polite">
                <Clock size={14} aria-hidden="true" />
                <span>Mis à jour : {formatTime(lastUpdate)}</span>
              </div>
              <button 
                className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="Rafraîchir les données"
              >
                <RefreshCw size={18} aria-hidden="true" />
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Live Badge */}
          <div className="live-badge" aria-live="polite">
            <Zap className="live-icon" size={16} aria-hidden="true" />
            <span>Mise à jour automatique activée</span>
          </div>
        </motion.header>

        {/* Countdown Timer */}
        <motion.section
          className="countdown-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <Countdown 
            targetDate={competitionEndDate} 
            title="Fin de la Nuit de l'Info"
          />
        </motion.section>

        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          aria-labelledby="stats-title"
        >
          <h2 id="stats-title" className="sr-only">Statistiques de la compétition</h2>
          <StatsCards stats={stats} loading={statsLoading} />
        </motion.section>

        {/* Podium Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Podium teams={leaderboard} showConfetti={!leaderboardLoading} />
        </motion.section>

        {/* Full Leaderboard and Activity Feed */}
        <div className="dashboard-grid">
          <motion.section
            className="leaderboard-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            aria-labelledby="leaderboard-title"
          >
            <div className="section-header">
              <h2 id="leaderboard-title" className="section-title">
                Classement Complet
              </h2>
              <p className="section-subtitle">
                {leaderboard.length} équipes en compétition
              </p>
            </div>
            <Leaderboard teams={leaderboard} loading={leaderboardLoading} />
          </motion.section>

          <motion.aside
            className="activity-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            aria-labelledby="activity-title"
          >
            <h2 id="activity-title" className="sr-only">Activité récente</h2>
            <ActivityFeed limit={8} autoRefresh refreshInterval={15000} />
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
