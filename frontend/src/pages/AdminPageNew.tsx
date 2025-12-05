import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Settings, 
  Users,
  Award,
  Star,
  Save,
  Zap,
  UserPlus,
  Trash2,
  Edit2,
  Shield,
  UserCheck,
  User,
  Search,
  Filter,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Team, Challenge, User as UserType, UserRole, ScoreFormData } from '../types';
import { teamsApi, challengesApi, scoresApi, usersApi } from '../services/api';
import './AdminPage.css';

type TabType = 'scores' | 'users' | 'teams' | 'challenges';

const AdminPage: React.FC = () => {
  const { user: currentUser, isAdmin, isLeader } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('scores');
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Score form state
  const [selectedTeam, setSelectedTeam] = useState<number | ''>('');
  const [selectedChallenge, setSelectedChallenge] = useState<number | ''>('');
  const [points, setPoints] = useState<number>(0);
  const [bonusPoints, setBonusPoints] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // User modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'participant' as UserRole,
    team_id: null as number | null
  });
  
  // Filter state
  const [userFilter, setUserFilter] = useState<UserRole | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      
      // Only admins can fetch all users
      if (isAdmin) {
        const usersData = await usersApi.getAll();
        setUsers(usersData);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Score Management
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

  // User Management
  const handleOpenUserModal = (user?: UserType) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
        team_id: user.team_id
      });
    } else {
      setEditingUser(null);
      setUserForm({
        username: '',
        email: '',
        password: '',
        role: 'participant',
        team_id: null
      });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userForm.username || !userForm.email) {
      toast.error('Username et email sont requis');
      return;
    }
    
    if (!editingUser && !userForm.password) {
      toast.error('Le mot de passe est requis pour un nouvel utilisateur');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        const updateData: any = {
          username: userForm.username,
          email: userForm.email,
          role: userForm.role,
          team_id: userForm.team_id
        };
        if (userForm.password) {
          updateData.password = userForm.password;
        }
        await usersApi.update(editingUser.id, updateData);
        toast.success('Utilisateur mis à jour!');
      } else {
        await usersApi.create({
          username: userForm.username,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role,
          team_id: userForm.team_id
        });
        toast.success('Utilisateur créé!');
      }
      
      setShowUserModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      return;
    }
    
    try {
      await usersApi.delete(userId);
      toast.success('Utilisateur supprimé');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  // Filtered users
  const filteredUsers = users
    .filter(u => userFilter === 'all' || u.role === userFilter)
    .filter(u => 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield size={16} />;
      case 'leader': return <UserCheck size={16} />;
      default: return <User size={16} />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'leader': return 'Leader';
      default: return 'Participant';
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

  // Check permissions
  if (!isAdmin && !isLeader) {
    return (
      <div className="admin-page access-denied">
        <Shield size={64} />
        <h2>Accès refusé</h2>
        <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
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
                {isAdmin ? 'Gérer les utilisateurs, équipes, scores et défis' : 'Gérer les scores de votre équipe'}
              </p>
            </div>
          </div>
          
          {/* User info badge */}
          <div className="user-badge">
            {getRoleIcon(currentUser?.role || 'participant')}
            <span>{currentUser?.username}</span>
            <span className={`role-tag ${currentUser?.role}`}>
              {getRoleLabel(currentUser?.role || 'participant')}
            </span>
          </div>
        </motion.header>

        {/* Tabs - Only show all tabs for admin */}
        {isAdmin && (
          <div className="admin-tabs">
            <button 
              className={`tab-btn ${activeTab === 'scores' ? 'active' : ''}`}
              onClick={() => setActiveTab('scores')}
            >
              <Star size={18} />
              Scores
            </button>
            <button 
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={18} />
              Utilisateurs
            </button>
            <button 
              className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              <Award size={18} />
              Équipes
            </button>
            <button 
              className={`tab-btn ${activeTab === 'challenges' ? 'active' : ''}`}
              onClick={() => setActiveTab('challenges')}
            >
              <Zap size={18} />
              Défis
            </button>
          </div>
        )}

        {/* SCORES TAB */}
        {activeTab === 'scores' && (
          <div className="admin-grid">
            {/* Add Score Card */}
            <motion.section 
              className="admin-card score-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="card-header">
                <Star className="card-icon" size={24} />
                <h2>Attribuer des Points</h2>
              </div>

              <form onSubmit={handleAddScore} className="score-form">
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

                {selectedTeam && (
                  <div className="score-preview">
                    <span>Total à ajouter:</span>
                    <strong>{points + bonusPoints} points</strong>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submitting || !selectedTeam || points <= 0}
                >
                  {submitting ? (
                    <span className="spinner"></span>
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
            >
              <div className="card-header">
                <Zap className="card-icon" size={24} />
                <h2>Actions Rapides</h2>
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
                      >
                        +10
                      </button>
                      <button 
                        className="quick-action-btn"
                        onClick={() => quickAddPoints(team.id, 25)}
                      >
                        +25
                      </button>
                      <button 
                        className="quick-action-btn bonus"
                        onClick={() => quickAddPoints(team.id, 50)}
                      >
                        +50
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>
        )}

        {/* USERS TAB - Admin Only */}
        {activeTab === 'users' && isAdmin && (
          <motion.div 
            className="users-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Filters Bar */}
            <div className="filters-bar">
              <div className="search-wrapper">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="filter-wrapper">
                <Filter size={16} />
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as UserRole | 'all')}
                >
                  <option value="all">Tous les rôles</option>
                  <option value="admin">Administrateurs</option>
                  <option value="leader">Leaders</option>
                  <option value="participant">Participants</option>
                </select>
              </div>
              
              <button 
                className="add-btn"
                onClick={() => handleOpenUserModal()}
              >
                <UserPlus size={18} />
                Nouvel utilisateur
              </button>
            </div>

            {/* Users Table */}
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Équipe</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className={`user-avatar ${user.role}`}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.username}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {getRoleIcon(user.role)}
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        {user.team_name ? (
                          <span 
                            className="team-badge"
                            style={{ borderColor: user.team_color }}
                          >
                            {user.team_name}
                          </span>
                        ) : (
                          <span className="no-team">-</span>
                        )}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button 
                            className="action-btn edit"
                            onClick={() => handleOpenUserModal(user)}
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          {user.id !== 1 && (
                            <button 
                              className="action-btn delete"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stats */}
            <div className="users-stats">
              <div className="stat-item">
                <Shield size={20} />
                <span>{users.filter(u => u.role === 'admin').length} Admins</span>
              </div>
              <div className="stat-item">
                <UserCheck size={20} />
                <span>{users.filter(u => u.role === 'leader').length} Leaders</span>
              </div>
              <div className="stat-item">
                <User size={20} />
                <span>{users.filter(u => u.role === 'participant').length} Participants</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* TEAMS TAB */}
        {activeTab === 'teams' && isAdmin && (
          <motion.div 
            className="teams-admin-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="admin-card">
              <div className="card-header">
                <Award className="card-icon" size={24} />
                <h2>Gestion des Équipes</h2>
              </div>
              
              <div className="teams-grid-admin">
                {teams.map(team => (
                  <div key={team.id} className="team-admin-card">
                    <div 
                      className="team-color-bar"
                      style={{ background: team.color }}
                    ></div>
                    <div className="team-admin-content">
                      <div 
                        className="team-admin-avatar"
                        style={{ 
                          background: `linear-gradient(135deg, ${team.color}40, ${team.color}80)`,
                          borderColor: team.color 
                        }}
                      >
                        {team.name.charAt(0)}
                      </div>
                      <h3>{team.name}</h3>
                      <div className="team-admin-stats">
                        <span><Users size={14} /> {team.members} membres</span>
                        <span><Star size={14} /> {team.total_score} pts</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* CHALLENGES TAB */}
        {activeTab === 'challenges' && isAdmin && (
          <motion.div 
            className="challenges-admin-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="admin-card">
              <div className="card-header">
                <Zap className="card-icon" size={24} />
                <h2>Défis de la Compétition</h2>
              </div>
              
              <div className="challenges-list-admin">
                {challenges.map(challenge => (
                  <div key={challenge.id} className="challenge-admin-item">
                    <div className="challenge-admin-info">
                      <h4>{challenge.name}</h4>
                      <p>{challenge.description}</p>
                    </div>
                    <div className="challenge-admin-meta">
                      <span className={`difficulty-badge ${challenge.difficulty}`}>
                        {challenge.difficulty}
                      </span>
                      <span className="category-badge">{challenge.category}</span>
                      <span className="points-badge">{challenge.max_points} pts max</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* User Modal */}
        <AnimatePresence>
          {showUserModal && (
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserModal(false)}
            >
              <motion.div 
                className="modal-content"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>{editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h2>
                  <button 
                    className="close-btn"
                    onClick={() => setShowUserModal(false)}
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSaveUser} className="modal-form">
                  <div className="form-group">
                    <label>Nom d'utilisateur</label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mot de passe {editingUser && '(laisser vide pour conserver)'}</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder={editingUser ? '••••••••' : ''}
                      required={!editingUser}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Rôle</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                      >
                        <option value="participant">Participant</option>
                        <option value="leader">Leader</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Équipe</label>
                      <select
                        value={userForm.team_id || ''}
                        onChange={(e) => setUserForm({ 
                          ...userForm, 
                          team_id: e.target.value ? parseInt(e.target.value) : null 
                        })}
                      >
                        <option value="">Aucune équipe</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => setShowUserModal(false)}
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="save-btn"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span className="spinner"></span>
                      ) : (
                        <>
                          <Save size={18} />
                          {editingUser ? 'Mettre à jour' : 'Créer'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminPage;
