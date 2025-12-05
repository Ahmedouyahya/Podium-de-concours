import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Target, 
  Trophy,
  Clock,
  Star,
  Send,
  Eye,
  Check,
  X,
  ExternalLink,
  Github,
  Users,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Challenge, Submission, SubmissionFormData } from '../types';
import { challengesApi, submissionsApi } from '../services/api';
import './ChallengesPage.css';

const ChallengesPage: React.FC = () => {
  const { user, team, isAuthenticated } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teamSubmissions, setTeamSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code_url: '',
    demo_url: ''
  });

  useEffect(() => {
    fetchData();
  }, [user, team]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [challengesData, allSubmissions] = await Promise.all([
        challengesApi.getAll(),
        isAuthenticated ? submissionsApi.getAll() : Promise.resolve([])
      ]);
      
      setChallenges(challengesData);
      setSubmissions(allSubmissions);
      
      // Filter team submissions
      if (team) {
        setTeamSubmissions(allSubmissions.filter(s => s.team_id === team.id));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      case 'expert': return '#8b5cf6';
      default: return '#6366f1';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      case 'expert': return 'Expert';
      default: return difficulty;
    }
  };

  const getTeamSubmissionForChallenge = (challengeId: number) => {
    return teamSubmissions.find(s => s.challenge_id === challengeId);
  };

  const handleOpenSubmit = (challenge: Challenge) => {
    if (!isAuthenticated) {
      toast.error('Vous devez être connecté pour soumettre');
      return;
    }
    if (!team) {
      toast.error('Vous devez appartenir à une équipe');
      return;
    }
    setSelectedChallenge(challenge);
    setFormData({ title: '', description: '', code_url: '', demo_url: '' });
    setShowSubmitModal(true);
  };

  const handleViewSubmissions = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowViewModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallenge || !user || !team) return;

    if (!formData.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    setSubmitting(true);
    try {
      const submissionData: SubmissionFormData = {
        user_id: user.id,
        team_id: team.id,
        challenge_id: selectedChallenge.id,
        title: formData.title,
        description: formData.description,
        code_url: formData.code_url || undefined,
        demo_url: formData.demo_url || undefined
      };

      await submissionsApi.create(submissionData);
      toast.success('Soumission envoyée avec succès!');
      setShowSubmitModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const getChallengeSubmissions = (challengeId: number) => {
    return submissions.filter(s => s.challenge_id === challengeId);
  };

  if (loading) {
    return (
      <div className="challenges-page loading-state">
        <div className="spinner-large" />
        <p>Chargement des défis...</p>
      </div>
    );
  }

  return (
    <div className="challenges-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-title-section">
          <div className="header-icon-wrapper challenges-icon">
            <Target size={28} />
          </div>
          <div>
            <h1 className="page-title">Défis</h1>
            <p className="page-subtitle">
              {isAuthenticated && team 
                ? `Équipe ${team.name} - Soumettez vos solutions`
                : 'Connectez-vous pour participer'}
            </p>
          </div>
        </div>
        
        {team && (
          <div className="team-stats-mini">
            <div className="stat">
              <Trophy size={16} />
              <span>{team.total_score} pts</span>
            </div>
            <div className="stat">
              <Check size={16} />
              <span>{teamSubmissions.filter(s => s.status === 'approved').length} validées</span>
            </div>
          </div>
        )}
      </header>

      {/* Info Banner for non-authenticated users */}
      {!isAuthenticated && (
        <div className="info-banner">
          <AlertCircle size={20} />
          <p>Connectez-vous pour soumettre des solutions et voir les soumissions de votre équipe</p>
        </div>
      )}

      {/* Challenges Grid */}
      <div className="challenges-grid">
        {challenges.map((challenge, index) => {
          const teamSub = getTeamSubmissionForChallenge(challenge.id);
          const allSubs = getChallengeSubmissions(challenge.id);
          
          return (
            <motion.div
              key={challenge.id}
              className={`challenge-card ${teamSub ? 'has-submission' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="challenge-header">
                <span 
                  className="difficulty-badge"
                  style={{ backgroundColor: `${getDifficultyColor(challenge.difficulty)}20`, color: getDifficultyColor(challenge.difficulty) }}
                >
                  {getDifficultyLabel(challenge.difficulty)}
                </span>
                <span className="category-badge">{challenge.category}</span>
              </div>

              <h3 className="challenge-name">{challenge.name}</h3>
              <p className="challenge-description">{challenge.description}</p>

              <div className="challenge-meta">
                <div className="meta-item">
                  <Star size={16} />
                  <span>{challenge.max_points} pts max</span>
                </div>
                <div className="meta-item">
                  <Users size={16} />
                  <span>{allSubs.length} soumissions</span>
                </div>
              </div>

              {/* Team submission status */}
              {teamSub && (
                <div className={`submission-status ${teamSub.status}`}>
                  {teamSub.status === 'approved' && <Check size={16} />}
                  {teamSub.status === 'pending' && <Clock size={16} />}
                  {teamSub.status === 'rejected' && <X size={16} />}
                  <span>
                    {teamSub.status === 'approved' && 'Validée'}
                    {teamSub.status === 'pending' && 'En attente'}
                    {teamSub.status === 'rejected' && 'Refusée'}
                  </span>
                </div>
              )}

              <div className="challenge-actions">
                {isAuthenticated && team && !teamSub && (
                  <button 
                    className="btn-submit"
                    onClick={() => handleOpenSubmit(challenge)}
                  >
                    <Send size={16} />
                    Soumettre
                  </button>
                )}
                
                {teamSub && (
                  <button 
                    className="btn-view"
                    onClick={() => handleViewSubmissions(challenge)}
                  >
                    <Eye size={16} />
                    Voir soumissions
                  </button>
                )}

                {!isAuthenticated && (
                  <button className="btn-view" disabled>
                    <Zap size={16} />
                    Connectez-vous
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && selectedChallenge && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Soumettre une solution</h2>
                <button className="modal-close" onClick={() => setShowSubmitModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="challenge-info-mini">
                  <Target size={20} />
                  <div>
                    <h4>{selectedChallenge.name}</h4>
                    <p>{selectedChallenge.max_points} points max</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="submit-form">
                  <div className="form-group">
                    <label htmlFor="title">Titre de la soumission *</label>
                    <input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="Ex: Dashboard interactif océans"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Décrivez votre solution..."
                      rows={4}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="code_url">
                        <Github size={14} /> Lien GitHub
                      </label>
                      <input
                        id="code_url"
                        type="url"
                        value={formData.code_url}
                        onChange={e => setFormData({...formData, code_url: e.target.value})}
                        placeholder="https://github.com/..."
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="demo_url">
                        <ExternalLink size={14} /> Lien Démo
                      </label>
                      <input
                        id="demo_url"
                        type="url"
                        value={formData.demo_url}
                        onChange={e => setFormData({...formData, demo_url: e.target.value})}
                        placeholder="https://demo.example.com"
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => setShowSubmitModal(false)}
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Soumettre
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Submissions Modal */}
      <AnimatePresence>
        {showViewModal && selectedChallenge && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              className="modal-content modal-large"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Soumissions - {selectedChallenge.name}</h2>
                <button className="modal-close" onClick={() => setShowViewModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {/* Team's submission */}
                {team && (
                  <>
                    <h3 className="section-title">Soumission de votre équipe</h3>
                    {teamSubmissions.filter(s => s.challenge_id === selectedChallenge.id).map(sub => (
                      <div key={sub.id} className={`submission-card own ${sub.status}`}>
                        <div className="submission-header">
                          <h4>{sub.title}</h4>
                          <span className={`status-badge ${sub.status}`}>
                            {sub.status === 'approved' && 'Validée'}
                            {sub.status === 'pending' && 'En attente'}
                            {sub.status === 'rejected' && 'Refusée'}
                          </span>
                        </div>
                        <p className="submission-author">par {sub.user_name}</p>
                        {sub.description && <p className="submission-desc">{sub.description}</p>}
                        <div className="submission-links">
                          {sub.code_url && (
                            <a href={sub.code_url} target="_blank" rel="noopener noreferrer">
                              <Github size={14} /> Code
                            </a>
                          )}
                          {sub.demo_url && (
                            <a href={sub.demo_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={14} /> Démo
                            </a>
                          )}
                        </div>
                        {sub.feedback && (
                          <div className="submission-feedback">
                            <strong>Feedback:</strong> {sub.feedback}
                          </div>
                        )}
                      </div>
                    ))}
                    {teamSubmissions.filter(s => s.challenge_id === selectedChallenge.id).length === 0 && (
                      <p className="no-submissions">Aucune soumission de votre équipe</p>
                    )}
                  </>
                )}

                {/* Other teams' submissions (only approved ones) */}
                <h3 className="section-title">Autres équipes</h3>
                <div className="other-submissions">
                  {submissions
                    .filter(s => 
                      s.challenge_id === selectedChallenge.id && 
                      s.status === 'approved' &&
                      (!team || s.team_id !== team.id)
                    )
                    .map(sub => (
                      <div key={sub.id} className="submission-card other">
                        <div className="submission-header">
                          <h4>{sub.title}</h4>
                          <span className="team-badge" style={{ borderColor: sub.team_color }}>
                            {sub.team_name}
                          </span>
                        </div>
                        <p className="submission-author">par {sub.user_name}</p>
                        <div className="submission-links">
                          {sub.code_url && (
                            <a href={sub.code_url} target="_blank" rel="noopener noreferrer">
                              <Github size={14} /> Code
                            </a>
                          )}
                          {sub.demo_url && (
                            <a href={sub.demo_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={14} /> Démo
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  }
                  {submissions.filter(s => 
                    s.challenge_id === selectedChallenge.id && 
                    s.status === 'approved' &&
                    (!team || s.team_id !== team.id)
                  ).length === 0 && (
                    <p className="no-submissions">Aucune autre soumission validée</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChallengesPage;
