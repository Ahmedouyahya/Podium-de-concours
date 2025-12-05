import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { Trophy, Crown, Medal, Star, TrendingUp, Users } from 'lucide-react';
import { Team } from '../../types';
import './Podium.css';

interface PodiumProps {
  teams: Team[];
  showConfetti?: boolean;
}

const Podium: React.FC<PodiumProps> = ({ teams, showConfetti = true }) => {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showCelebration, setShowCelebration] = useState(false);

  const topThree = teams.slice(0, 3);
  const [second, first, third] = topThree.length === 3 
    ? [topThree[1], topThree[0], topThree[2]] 
    : [null, topThree[0] || null, null];

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (showConfetti && first) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [first, showConfetti]);

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1: return { gradient: 'var(--color-gold-gradient)', color: '#ffd700', glow: 'rgba(255, 215, 0, 0.5)' };
      case 2: return { gradient: 'var(--color-silver-gradient)', color: '#c0c0c0', glow: 'rgba(192, 192, 192, 0.5)' };
      case 3: return { gradient: 'var(--color-bronze-gradient)', color: '#cd7f32', glow: 'rgba(205, 127, 50, 0.5)' };
      default: return { gradient: 'var(--color-primary)', color: '#6366f1', glow: 'rgba(99, 102, 241, 0.5)' };
    }
  };

  const getPodiumHeight = (position: number) => {
    switch (position) {
      case 1: return 280;
      case 2: return 220;
      case 3: return 160;
      default: return 100;
    }
  };

  const getPositionLabel = (position: number) => {
    switch (position) {
      case 1: return '1er';
      case 2: return '2ème';
      case 3: return '3ème';
      default: return `${position}ème`;
    }
  };

  const renderTeamCard = (team: Team | null, position: number, delay: number) => {
    if (!team) return null;
    
    const medalStyle = getMedalColor(position);
    const height = getPodiumHeight(position);

    return (
      <motion.div
        className={`podium-slot podium-position-${position}`}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: delay,
          type: 'spring',
          stiffness: 100 
        }}
      >
        {/* Team Card */}
        <motion.div 
          className="podium-card"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: 'spring', stiffness: 300 }}
          role="article"
          aria-label={`${getPositionLabel(position)} place: ${team.name} avec ${team.total_score} points`}
        >
          {/* Crown for 1st place */}
          {position === 1 && (
            <motion.div 
              className="crown-wrapper"
              animate={{ 
                y: [0, -5, 0],
                rotate: [-2, 2, -2]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
            >
              <Crown 
                className="crown-icon" 
                size={48} 
                aria-hidden="true"
                style={{ color: medalStyle.color }}
              />
            </motion.div>
          )}

          {/* Medal */}
          <div 
            className="medal"
            style={{ 
              background: medalStyle.gradient,
              boxShadow: `0 0 30px ${medalStyle.glow}`
            }}
          >
            {position === 1 ? (
              <Trophy size={28} color="#1a1a3a" aria-hidden="true" />
            ) : (
              <Medal size={24} color="#1a1a3a" aria-hidden="true" />
            )}
          </div>

          {/* Team Avatar */}
          <div 
            className="team-avatar"
            style={{ 
              background: `linear-gradient(135deg, ${team.color}40, ${team.color}80)`,
              borderColor: team.color
            }}
          >
            <span className="avatar-initial" aria-hidden="true">
              {team.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Team Info */}
          <div className="team-info">
            <h3 className="team-name">{team.name}</h3>
            <div className="team-stats">
              <span className="team-members">
                <Users size={14} aria-hidden="true" />
                <span>{team.members} membres</span>
              </span>
              {team.trend === 'up' && (
                <span className="team-trend trend-up">
                  <TrendingUp size={14} aria-hidden="true" />
                </span>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="score-section">
            <div className="score-label">Score Total</div>
            <motion.div 
              className="score-value"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.5, type: 'spring' }}
            >
              <Star className="score-star" size={20} aria-hidden="true" style={{ color: medalStyle.color }} />
              <span>{team.total_score.toLocaleString()}</span>
            </motion.div>
            <div className="score-breakdown">
              {team.base_points !== undefined && (
                <span>{team.base_points} base + {team.bonus_points || 0} bonus</span>
              )}
            </div>
          </div>

          {/* Position Badge */}
          <div 
            className="position-badge"
            style={{ background: medalStyle.gradient }}
          >
            {getPositionLabel(position)}
          </div>
        </motion.div>

        {/* Podium Stand */}
        <motion.div 
          className="podium-stand"
          initial={{ height: 0 }}
          animate={{ height }}
          transition={{ 
            duration: 1, 
            delay: delay + 0.3,
            type: 'spring',
            stiffness: 80 
          }}
          style={{
            background: `linear-gradient(180deg, ${team.color}60 0%, ${team.color}20 100%)`,
            borderTop: `4px solid ${team.color}`,
          }}
        >
          <span className="stand-position">{position}</span>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <section 
      className="podium-section"
      role="region"
      aria-label="Podium des trois premières équipes"
    >
      {/* Confetti Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={300}
            gravity={0.2}
            colors={['#ffd700', '#c0c0c0', '#cd7f32', '#6366f1', '#ec4899']}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div 
        className="podium-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="podium-title">
          <Trophy className="title-icon" aria-hidden="true" />
          <span>Podium des Champions</span>
        </h2>
        <p className="podium-subtitle">
          Les équipes les plus performantes de la compétition
        </p>
      </motion.div>

      {/* Podium Display */}
      <div className="podium-display" role="list">
        {renderTeamCard(second, 2, 0.2)}
        {renderTeamCard(first, 1, 0)}
        {renderTeamCard(third, 3, 0.4)}
      </div>

      {/* Spotlight Effects */}
      <div className="spotlight-effects" aria-hidden="true">
        <div className="spotlight spotlight-1"></div>
        <div className="spotlight spotlight-2"></div>
        <div className="spotlight spotlight-3"></div>
      </div>
    </section>
  );
};

export default Podium;
