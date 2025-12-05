import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Users, 
  Crown,
  UserPlus,
  Trash2,
  Mail,
  Shield,
  User,
  Trophy,
  Target,
  Clock,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TeamMember, Submission } from '../types';
import { teamsApi, submissionsApi } from '../services/api';
import './TeamManagePage.css';

const TeamManagePage: React.FC = () => {
  const { team, isLeader, isAdmin } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teamSubmissions, setTeamSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  // Form state
  const [newMember, setNewMember] = useState({
    username: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (team) {
      fetchData();
    }
  }, [team]);

  const fetchData = async () => {
    if (!team) return;
    
    try {
      setLoading(true);
      const [membersData, subsData] = await Promise.all([
        teamsApi.getMembers(team.id),
        submissionsApi.getAll({ team_id: team.id })
      ]);
      
      setMembers(membersData);
      setTeamSubmissions(subsData);
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    if (!newMember.username || !newMember.email || !newMember.password) {
      toast.error('Tous les champs sont requis');
      return;
    }

    setAddingMember(true);
    try {
      await teamsApi.addMember(team.id, newMember);
      toast.success(`${newMember.username} a été ajouté à l'équipe!`);
      setShowAddModal(false);
      setNewMember({ username: '', email: '', password: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajout');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    if (!team) return;
    
    if (!window.confirm(`Êtes-vous sûr de vouloir retirer ${memberName} de l'équipe?`)) {
      return;
    }

    try {
      await teamsApi.removeMember(team.id, memberId);
      toast.success(`${memberName} a été retiré de l'équipe`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du retrait');
    }
  };

  const getMemberSubmissions = (memberId: number) => {
    return teamSubmissions.filter(s => s.user_id === memberId);
  };

  // Access control
  if (!isLeader && !isAdmin) {
    return (
      <div className="team-manage-page access-denied">
        <Shield size={64} />
        <h2>Accès Refusé</h2>
        <p>Cette page est réservée aux chefs d'équipe.</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="team-manage-page no-team">
        <AlertCircle size={64} />
        <h2>Aucune Équipe</h2>
        <p>Vous n'appartenez à aucune équipe.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="team-manage-page loading-state">
        <div className="spinner-large" />
        <p>Chargement de l'équipe...</p>
      </div>
    );
  }

  return (
    <div className="team-manage-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-title-section">
          <div 
            className="header-icon-wrapper team-icon"
            style={{ background: `linear-gradient(135deg, ${team.color}, ${team.color}dd)` }}
          >
            <Users size={28} />
          </div>
          <div>
            <h1 className="page-title">Équipe {team.name}</h1>
            <p className="page-subtitle">Gérez les membres de votre équipe</p>
          </div>
        </div>
        
        <div className="team-stats-header">
          <div className="stat-item">
            <Trophy size={20} />
            <div>
              <span className="stat-value">{team.total_score}</span>
              <span className="stat-label">Points</span>
            </div>
          </div>
          <div className="stat-item">
            <Users size={20} />
            <div>
              <span className="stat-value">{members.length}</span>
              <span className="stat-label">Membres</span>
            </div>
          </div>
          <div className="stat-item">
            <Target size={20} />
            <div>
              <span className="stat-value">{teamSubmissions.length}</span>
              <span className="stat-label">Soumissions</span>
            </div>
          </div>
        </div>
      </header>

      <div className="team-content">
        {/* Members Section */}
        <section className="members-section">
          <div className="section-header">
            <h2><Users size={20} /> Membres de l'équipe</h2>
            <button className="add-btn" onClick={() => setShowAddModal(true)}>
              <UserPlus size={18} />
              Ajouter un membre
            </button>
          </div>

          <div className="members-grid">
            {members.map((member, index) => {
              const memberSubs = getMemberSubmissions(member.id);
              const approvedSubs = memberSubs.filter(s => s.status === 'approved');
              
              return (
                <motion.div
                  key={member.id}
                  className={`member-card ${member.is_leader ? 'is-leader' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="member-avatar">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.username} />
                    ) : (
                      member.username.charAt(0).toUpperCase()
                    )}
                    {member.is_leader && (
                      <span className="leader-badge">
                        <Crown size={12} />
                      </span>
                    )}
                  </div>

                  <div className="member-info">
                    <h3 className="member-name">
                      {member.username}
                      {member.is_leader && <span className="leader-tag">Chef d'équipe</span>}
                    </h3>
                    <p className="member-email">
                      <Mail size={14} />
                      {member.email}
                    </p>
                  </div>

                  <div className="member-stats">
                    <div className="mini-stat">
                      <Target size={14} />
                      <span>{memberSubs.length} soumissions</span>
                    </div>
                    <div className="mini-stat">
                      <Check size={14} />
                      <span>{approvedSubs.length} validées</span>
                    </div>
                  </div>

                  {!member.is_leader && (isLeader || isAdmin) && (
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveMember(member.id, member.username)}
                      title="Retirer de l'équipe"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Team Submissions Section */}
        <section className="submissions-section">
          <div className="section-header">
            <h2><Target size={20} /> Soumissions de l'équipe</h2>
          </div>

          {teamSubmissions.length === 0 ? (
            <div className="empty-state">
              <Target size={48} />
              <p>Aucune soumission pour le moment</p>
            </div>
          ) : (
            <div className="submissions-list">
              {teamSubmissions.map((sub, index) => (
                <motion.div
                  key={sub.id}
                  className={`submission-item ${sub.status}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="submission-icon">
                    {sub.status === 'approved' && <Check size={20} />}
                    {sub.status === 'pending' && <Clock size={20} />}
                    {sub.status === 'rejected' && <X size={20} />}
                  </div>

                  <div className="submission-content">
                    <h4>{sub.title}</h4>
                    <p className="submission-meta">
                      <span className="author">
                        <User size={12} /> {sub.user_name}
                      </span>
                      <span className="challenge">
                        <Target size={12} /> {sub.challenge_name}
                      </span>
                      <span className="time">
                        <Clock size={12} /> {new Date(sub.submitted_at).toLocaleDateString('fr-FR')}
                      </span>
                    </p>
                  </div>

                  <span className={`status-badge ${sub.status}`}>
                    {sub.status === 'approved' && 'Validée'}
                    {sub.status === 'pending' && 'En attente'}
                    {sub.status === 'rejected' && 'Refusée'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Ajouter un membre</h2>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <form onSubmit={handleAddMember} className="add-member-form">
                  <div className="form-group">
                    <label htmlFor="username">
                      <User size={14} /> Nom d'utilisateur
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={newMember.username}
                      onChange={e => setNewMember({...newMember, username: e.target.value})}
                      placeholder="ex: jean_dupont"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      <Mail size={14} /> Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={newMember.email}
                      onChange={e => setNewMember({...newMember, email: e.target.value})}
                      placeholder="jean@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">
                      <Shield size={14} /> Mot de passe
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={newMember.password}
                      onChange={e => setNewMember({...newMember, password: e.target.value})}
                      placeholder="••••••••"
                      required
                    />
                    <small>Le membre pourra se connecter avec ces identifiants</small>
                  </div>

                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => setShowAddModal(false)}
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={addingMember}
                    >
                      {addingMember ? (
                        <>
                          <span className="spinner" />
                          Ajout...
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          Ajouter
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
    </div>
  );
};

export default TeamManagePage;
