import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Settings, 
  Award,
  Star,
  Save,
  Zap
} from 'lucide-react';
import { Team, Challenge, ScoreFormData } from '../types';
import { teamsApi, challengesApi, scoresApi } from '../services/api';
import './AdminPage.css';

const AdminPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Score form state
  const [selectedTeam, setSelectedTeam] = useState<number | ''>('');
  const [selectedChallenge, setSelectedChallenge] = useState<number | ''>('');
  const [points, setPoints] = useState<number>(0);
  const [bonusPoints, setBonusPoints] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsData, challengesData] = await Promise.all([
        teamsApi.getAll(),
        challengesApi.getAll()
      ]);
      setTeams(teamsData);
      setChallenges(challengesData);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeam || points <= 0) {
      toast.error('Veuillez sélectionner une équipe et entrer des points');
      return;
    }

    setSubmitting(true);
    try {
      const scoreData: ScoreFormData = {
        team_id: selectedTeam as number,
        challenge_id: selectedChallenge as number || undefined,
        points,
        bonus_points: bonusPoints,
        comment: comment || undefined
      };

      await scoresApi.add(scoreData);
      
      const team = teams.find(t => t.id === selectedTeam);
      toast.success(`${points + bonusPoints} points ajoutés à ${team?.name}!`);
      
      // Reset form
      setSelectedTeam('');
      setSelectedChallenge('');
      setPoints(0);
      setBonusPoints(0);
      setComment('');
      
      // Refresh teams
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout des points');
    } finally {
      setSubmitting(false);
    }
  };

  const quickAddPoints = async (teamId: number, pts: number) => {
    try {
      await scoresApi.add({
        team_id: teamId,
        points: pts,
        bonus_points: 0
      });
      
      const team = teams.find(t => t.id === teamId);
      toast.success(`+${pts} points pour ${team?.name}!`);
      fetchData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  if (loading) {
    return (
      <div className="admin-page loading-state">
        <div className="spinner-large"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        {/* Header */}
        <motion.header 
          className="page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-info">
            <div className="header-icon-wrapper admin-icon">
              <Settings size={32} aria-hidden="true" />
            </div>
            <div>
              <h1 className="page-title">Administration</h1>
              <p className="page-subtitle">
                Gérer les scores et les défis de la compétition
              </p>
            </div>
          </div>
        </motion.header>

        <div className="admin-grid">
          {/* Add Score Card */}
          <motion.section 
            className="admin-card score-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            aria-labelledby="add-score-title"
          >
            <div className="card-header">
              <Star className="card-icon" size={24} aria-hidden="true" />
              <h2 id="add-score-title">Attribuer des Points</h2>
            </div>

            <form onSubmit={handleAddScore} className="score-form">
              {/* Team Select */}
              <div className="form-group">
                <label htmlFor="team-select">Équipe</label>
                <select
                  id="team-select"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value ? parseInt(e.target.value) : '')}
                  required
                >
                  <option value="">Sélectionner une équipe</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.total_score} pts)
                    </option>
                  ))}
                </select>
              </div>

              {/* Challenge Select */}
              <div className="form-group">
                <label htmlFor="challenge-select">Défi (optionnel)</label>
                <select
                  id="challenge-select"
                  value={selectedChallenge}
                  onChange={(e) => setSelectedChallenge(e.target.value ? parseInt(e.target.value) : '')}
                >
                  <option value="">Points généraux</option>
                  {challenges.map(challenge => (
                    <option key={challenge.id} value={challenge.id}>
                      {challenge.name} (max: {challenge.max_points})
                    </option>
                  ))}
                </select>
              </div>

              {/* Points */}
              <div className="points-grid">
                <div className="form-group">
                  <label htmlFor="points">Points</label>
                  <input
                    id="points"
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                    min={0}
                    max={1000}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bonus">Bonus</label>
                  <input
                    id="bonus"
                    type="number"
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(parseInt(e.target.value) || 0)}
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              {/* Quick Points */}
              <div className="quick-points">
                <span>Points rapides:</span>
                <div className="quick-btns">
                  {[10, 25, 50, 100].map(pts => (
                    <button
                      key={pts}
                      type="button"
                      className="quick-btn"
                      onClick={() => setPoints(pts)}
                    >
                      +{pts}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="form-group">
                <label htmlFor="comment">Commentaire (optionnel)</label>
                <input
                  id="comment"
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ex: Excellent travail sur l'UI"
                />
              </div>

              {/* Preview */}
              {selectedTeam && (
                <div className="score-preview">
                  <span>Total à ajouter:</span>
                  <strong>{points + bonusPoints} points</strong>
                </div>
              )}

              {/* Submit */}
              <button 
                type="submit" 
                className="submit-btn"
                disabled={submitting || !selectedTeam || points <= 0}
              >
                {submitting ? (
                  <>
                    <span className="spinner"></span>
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Attribuer les points
                  </>
                )}
              </button>
            </form>
          </motion.section>

          {/* Quick Actions Card */}
          <motion.section 
            className="admin-card quick-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            aria-labelledby="quick-actions-title"
          >
            <div className="card-header">
              <Zap className="card-icon" size={24} aria-hidden="true" />
              <h2 id="quick-actions-title">Actions Rapides</h2>
            </div>

            <div className="quick-teams-list">
              {teams.slice(0, 8).map(team => (
                <div key={team.id} className="quick-team-row">
                  <div className="quick-team-info">
                    <div 
                      className="quick-avatar"
                      style={{ 
                        background: `linear-gradient(135deg, ${team.color}40, ${team.color}80)`,
                        borderColor: team.color 
                      }}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div className="quick-details">
                      <span className="quick-name">{team.name}</span>
                      <span className="quick-score">{team.total_score} pts</span>
                    </div>
                  </div>
                  <div className="quick-actions">
                    <button 
                      className="quick-action-btn"
                      onClick={() => quickAddPoints(team.id, 10)}
                      aria-label={`Ajouter 10 points à ${team.name}`}
                    >
                      +10
                    </button>
                    <button 
                      className="quick-action-btn"
                      onClick={() => quickAddPoints(team.id, 25)}
                      aria-label={`Ajouter 25 points à ${team.name}`}
                    >
                      +25
                    </button>
                    <button 
                      className="quick-action-btn bonus"
                      onClick={() => quickAddPoints(team.id, 50)}
                      aria-label={`Ajouter 50 points à ${team.name}`}
                    >
                      +50
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Challenges Card */}
          <motion.section 
            className="admin-card challenges-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            aria-labelledby="challenges-title"
          >
            <div className="card-header">
              <Award className="card-icon" size={24} aria-hidden="true" />
              <h2 id="challenges-title">Défis Actifs</h2>
            </div>

            <div className="challenges-list">
              {challenges.map(challenge => (
                <div key={challenge.id} className="challenge-item">
                  <div className="challenge-info">
                    <h4>{challenge.name}</h4>
                    <p>{challenge.description}</p>
                  </div>
                  <div className="challenge-meta">
                    <span className={`difficulty ${challenge.difficulty}`}>
                      {challenge.difficulty}
                    </span>
                    <span className="max-points">{challenge.max_points} pts max</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
