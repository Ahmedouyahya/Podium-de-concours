import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  Star,
  Award,
  Zap
} from 'lucide-react';
import { Team } from '../../types';
import './Leaderboard.css';

interface LeaderboardProps {
  teams: Team[];
  loading?: boolean;
  showRankChange?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  teams, 
  loading = false,
  showRankChange = true 
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="rank-trophy gold" size={20} aria-hidden="true" />;
      case 2:
        return <Trophy className="rank-trophy silver" size={18} aria-hidden="true" />;
      case 3:
        return <Trophy className="rank-trophy bronze" size={18} aria-hidden="true" />;
      default:
        return <span className="rank-number">{rank}</span>;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="trend-icon trend-up" size={16} aria-label="En progression" />;
      case 'down':
        return <TrendingDown className="trend-icon trend-down" size={16} aria-label="En baisse" />;
      default:
        return <Minus className="trend-icon trend-stable" size={16} aria-label="Stable" />;
    }
  };

  const getRowClassName = (rank: number) => {
    if (rank === 1) return 'leaderboard-row rank-gold';
    if (rank === 2) return 'leaderboard-row rank-silver';
    if (rank === 3) return 'leaderboard-row rank-bronze';
    return 'leaderboard-row';
  };

  if (loading) {
    return (
      <div className="leaderboard-loading" role="status" aria-label="Chargement du classement">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton skeleton-rank"></div>
            <div className="skeleton skeleton-avatar"></div>
            <div className="skeleton skeleton-name"></div>
            <div className="skeleton skeleton-score"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="leaderboard" role="table" aria-label="Classement des équipes">
      {/* Header */}
      <div className="leaderboard-header" role="row">
        <div className="header-cell rank-col" role="columnheader">Rang</div>
        <div className="header-cell team-col" role="columnheader">Équipe</div>
        <div className="header-cell members-col" role="columnheader">
          <Users size={14} aria-hidden="true" />
          <span className="sr-only">Membres</span>
        </div>
        <div className="header-cell challenges-col" role="columnheader">
          <Award size={14} aria-hidden="true" />
          <span className="sr-only">Défis</span>
        </div>
        <div className="header-cell score-col" role="columnheader">Score</div>
        {showRankChange && (
          <div className="header-cell trend-col" role="columnheader">
            <Zap size={14} aria-hidden="true" />
            <span className="sr-only">Tendance</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="leaderboard-body" role="rowgroup">
        <AnimatePresence mode="popLayout">
          {teams.map((team, index) => {
            const rank = team.rank || index + 1;
            
            return (
              <motion.div
                key={team.id}
                className={getRowClassName(rank)}
                role="row"
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  layout: { type: 'spring', stiffness: 300, damping: 30 }
                }}
                whileHover={{ scale: 1.01, x: 5 }}
              >
                {/* Rank */}
                <div className="cell rank-col" role="cell">
                  <div className={`rank-badge rank-${rank}`}>
                    {getRankIcon(rank)}
                  </div>
                </div>

                {/* Team */}
                <div className="cell team-col" role="cell">
                  <div 
                    className="team-avatar-small"
                    style={{ 
                      background: `linear-gradient(135deg, ${team.color}40, ${team.color}80)`,
                      borderColor: team.color 
                    }}
                  >
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="team-details">
                    <span className="team-name-text">{team.name}</span>
                    <span className="team-color-dot" style={{ backgroundColor: team.color }} aria-hidden="true"></span>
                  </div>
                </div>

                {/* Members */}
                <div className="cell members-col" role="cell">
                  <span className="members-count">{team.members}</span>
                </div>

                {/* Challenges */}
                <div className="cell challenges-col" role="cell">
                  <span className="challenges-count">{team.challenges_completed || 0}</span>
                </div>

                {/* Score */}
                <div className="cell score-col" role="cell">
                  <div className="score-display">
                    <Star className="score-icon" size={14} aria-hidden="true" style={{ color: team.color }} />
                    <motion.span 
                      className="score-number"
                      key={team.total_score}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      {team.total_score.toLocaleString()}
                    </motion.span>
                    <span className="score-label">pts</span>
                  </div>
                </div>

                {/* Trend */}
                {showRankChange && (
                  <div className="cell trend-col" role="cell">
                    {getTrendIcon(team.trend)}
                  </div>
                )}

                {/* Glow effect for top 3 */}
                {rank <= 3 && (
                  <div 
                    className="row-glow" 
                    style={{ background: `linear-gradient(90deg, ${team.color}20, transparent)` }}
                    aria-hidden="true"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {teams.length === 0 && !loading && (
        <div className="leaderboard-empty" role="status">
          <Trophy size={48} className="empty-icon" aria-hidden="true" />
          <p>Aucune équipe pour le moment</p>
          <span>Les équipes apparaîtront ici une fois inscrites</span>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
