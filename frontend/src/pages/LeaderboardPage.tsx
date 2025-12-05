import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Timer, Target } from 'lucide-react';
import Leaderboard from '../components/Leaderboard/Leaderboard';
import useLeaderboard from '../hooks/useLeaderboard';
import './LeaderboardPage.css';

const LeaderboardPage: React.FC = () => {
  const { leaderboard, loading, refresh } = useLeaderboard(3000);

  return (
    <div className="leaderboard-page">
      <div className="container">
        {/* Header */}
        <motion.header 
          className="page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-icon-wrapper">
            <Trophy className="header-icon" size={48} aria-hidden="true" />
          </div>
          <h1 className="page-title">Classement Officiel</h1>
          <p className="page-subtitle">
            Classement en temps réel de toutes les équipes participantes
          </p>
        </motion.header>

        {/* Stats Bar */}
        <motion.div 
          className="stats-bar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="stat-item">
            <Award className="stat-icon" size={20} aria-hidden="true" />
            <span className="stat-value">{leaderboard.length}</span>
            <span className="stat-label">Équipes</span>
          </div>
          <div className="stat-item">
            <Timer className="stat-icon" size={20} aria-hidden="true" />
            <span className="stat-value">3s</span>
            <span className="stat-label">Actualisation</span>
          </div>
          <div className="stat-item">
            <Target className="stat-icon" size={20} aria-hidden="true" />
            <span className="stat-value">
              {leaderboard.length > 0 ? leaderboard[0]?.total_score?.toLocaleString() || 0 : 0}
            </span>
            <span className="stat-label">Meilleur Score</span>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="full-leaderboard"
        >
          <Leaderboard teams={leaderboard} loading={loading} />
        </motion.section>

        {/* Refresh Button */}
        <motion.div 
          className="refresh-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button 
            className="refresh-button"
            onClick={refresh}
            aria-label="Actualiser le classement"
          >
            Actualiser maintenant
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
