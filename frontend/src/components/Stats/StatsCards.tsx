import React from 'react';
import { motion } from 'framer-motion';
import { Users, Award, Star, TrendingUp, Trophy } from 'lucide-react';
import { Stats as StatsType } from '../../types';
import './StatsCards.css';

interface StatsCardsProps {
  stats: StatsType | null;
  loading?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading = false }) => {
  const cards = [
    {
      id: 'teams',
      label: 'Équipes',
      value: stats?.total_teams || 0,
      icon: Users,
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    },
    {
      id: 'challenges',
      label: 'Défis',
      value: stats?.total_challenges || 0,
      icon: Award,
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    },
    {
      id: 'points',
      label: 'Points Totaux',
      value: stats?.total_points_awarded || 0,
      icon: Star,
      color: '#fbbf24',
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 100%)',
    },
    {
      id: 'average',
      label: 'Moyenne',
      value: stats?.average_team_score || 0,
      icon: TrendingUp,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    },
  ];

  if (loading) {
    return (
      <div className="stats-grid" role="status" aria-label="Chargement des statistiques">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card skeleton-card">
            <div className="skeleton skeleton-icon"></div>
            <div className="skeleton skeleton-value"></div>
            <div className="skeleton skeleton-label"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid" role="region" aria-label="Statistiques de la compétition">
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <motion.article
            key={card.id}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            role="group"
            aria-label={`${card.label}: ${card.value.toLocaleString()}`}
          >
            {/* Icon */}
            <div 
              className="stat-icon"
              style={{ background: card.gradient }}
              aria-hidden="true"
            >
              <Icon size={24} color="white" />
            </div>

            {/* Value */}
            <motion.div 
              className="stat-value"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
            >
              {card.value.toLocaleString()}
            </motion.div>

            {/* Label */}
            <div className="stat-label">{card.label}</div>

            {/* Decorative glow */}
            <div 
              className="stat-glow"
              style={{ background: `radial-gradient(circle at 50% 0%, ${card.color}20, transparent 70%)` }}
              aria-hidden="true"
            />
          </motion.article>
        );
      })}

      {/* Top Team Card */}
      {stats?.top_team && (
        <motion.article
          className="stat-card top-team-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          whileHover={{ y: -5, scale: 1.02 }}
          role="group"
          aria-label={`Leader: ${stats.top_team.name} avec ${stats.top_team.total_score} points`}
        >
          <div 
            className="stat-icon"
            style={{ background: 'var(--color-gold-gradient)' }}
            aria-hidden="true"
          >
            <Trophy size={24} color="#1a1a3a" />
          </div>
          
          <div className="stat-value leader-name">
            {stats.top_team.name}
          </div>
          
          <div className="stat-label">
            <span className="leader-score">{stats.top_team.total_score.toLocaleString()} pts</span>
            <span>• Leader</span>
          </div>

          <div 
            className="stat-glow"
            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255, 215, 0, 0.2), transparent 70%)' }}
            aria-hidden="true"
          />
        </motion.article>
      )}
    </div>
  );
};

export default StatsCards;
