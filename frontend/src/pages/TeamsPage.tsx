import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit2,
  Star,
  Filter
} from 'lucide-react';
import TeamForm from '../components/TeamForm/TeamForm';
import { Team, TeamFormData } from '../types';
import { teamsApi } from '../services/api';
import './TeamsPage.css';

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'members'>('score');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const data = await teamsApi.getAll();
      setTeams(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des équipes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (data: TeamFormData) => {
    const newTeam = await teamsApi.create(data);
    setTeams([...teams, newTeam]);
    toast.success(`Équipe "${data.name}" créée avec succès!`);
  };

  const handleUpdateTeam = async (data: TeamFormData) => {
    if (!editingTeam) return;
    const updated = await teamsApi.update(editingTeam.id, data);
    setTeams(teams.map(t => t.id === editingTeam.id ? updated : t));
    setEditingTeam(null);
    toast.success('Équipe mise à jour!');
  };

  const handleDeleteTeam = async (team: Team) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}"?`)) {
      return;
    }
    try {
      await teamsApi.delete(team.id);
      setTeams(teams.filter(t => t.id !== team.id));
      toast.success('Équipe supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredTeams = teams
    .filter(team => 
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return b.members - a.members;
        case 'score':
        default:
          return b.total_score - a.total_score;
      }
    });

  return (
    <div className="teams-page">
      <div className="container">
        {/* Header */}
        <motion.header 
          className="page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-info">
            <div className="header-icon-wrapper teams-icon">
              <Users size={32} aria-hidden="true" />
            </div>
            <div>
              <h1 className="page-title">Gestion des Équipes</h1>
              <p className="page-subtitle">
                {teams.length} équipes inscrites à la compétition
              </p>
            </div>
          </div>
          <button 
            className="add-team-btn"
            onClick={() => setIsFormOpen(true)}
            aria-label="Ajouter une nouvelle équipe"
          >
            <Plus size={20} aria-hidden="true" />
            <span>Nouvelle Équipe</span>
          </button>
        </motion.header>

        {/* Filters */}
        <motion.div 
          className="filters-bar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="search-wrapper">
            <Search size={18} className="search-icon" aria-hidden="true" />
            <input
              type="search"
              className="search-input"
              placeholder="Rechercher une équipe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Rechercher une équipe"
            />
          </div>
          
          <div className="sort-wrapper">
            <Filter size={16} aria-hidden="true" />
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'score' | 'members')}
              aria-label="Trier par"
            >
              <option value="score">Trier par score</option>
              <option value="name">Trier par nom</option>
              <option value="members">Trier par membres</option>
            </select>
          </div>
        </motion.div>

        {/* Teams Grid */}
        <motion.div 
          className="teams-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          role="list"
          aria-label="Liste des équipes"
        >
          <AnimatePresence mode="popLayout">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="team-card skeleton-card">
                  <div className="skeleton skeleton-avatar-large"></div>
                  <div className="skeleton skeleton-name-large"></div>
                  <div className="skeleton skeleton-score-large"></div>
                </div>
              ))
            ) : filteredTeams.length === 0 ? (
              <motion.div 
                className="empty-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Users size={64} className="empty-icon" aria-hidden="true" />
                <h3>Aucune équipe trouvée</h3>
                <p>
                  {searchQuery 
                    ? 'Essayez une autre recherche' 
                    : 'Créez la première équipe pour commencer'}
                </p>
                {!searchQuery && (
                  <button 
                    className="add-team-btn"
                    onClick={() => setIsFormOpen(true)}
                  >
                    <Plus size={20} />
                    Créer une équipe
                  </button>
                )}
              </motion.div>
            ) : (
              filteredTeams.map((team, index) => (
                <motion.article
                  key={team.id}
                  className="team-card"
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  role="listitem"
                >
                  {/* Rank Badge */}
                  {team.rank && team.rank <= 3 && (
                    <div className={`rank-badge-card rank-${team.rank}`}>
                      #{team.rank}
                    </div>
                  )}

                  {/* Team Avatar */}
                  <div 
                    className="team-avatar-large"
                    style={{ 
                      background: `linear-gradient(135deg, ${team.color}40, ${team.color}80)`,
                      borderColor: team.color,
                      boxShadow: `0 0 30px ${team.color}30`
                    }}
                  >
                    <span>{team.name.charAt(0).toUpperCase()}</span>
                  </div>

                  {/* Team Name */}
                  <h3 className="team-card-name">{team.name}</h3>

                  {/* Team Stats */}
                  <div className="team-card-stats">
                    <div className="stat">
                      <Users size={14} aria-hidden="true" />
                      <span>{team.members} membres</span>
                    </div>
                    <div className="stat">
                      <Star size={14} style={{ color: team.color }} aria-hidden="true" />
                      <span>{team.total_score.toLocaleString()} pts</span>
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="score-bar-wrapper">
                    <div 
                      className="score-bar"
                      style={{ 
                        width: `${Math.min((team.total_score / (teams[0]?.total_score || 1)) * 100, 100)}%`,
                        background: `linear-gradient(90deg, ${team.color}, ${team.color}80)`
                      }}
                    ></div>
                  </div>

                  {/* Actions */}
                  <div className="team-card-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => {
                        setEditingTeam(team);
                        setIsFormOpen(true);
                      }}
                      aria-label={`Modifier ${team.name}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteTeam(team)}
                      aria-label={`Supprimer ${team.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Color indicator */}
                  <div 
                    className="color-stripe"
                    style={{ background: team.color }}
                    aria-hidden="true"
                  ></div>
                </motion.article>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* Team Form Modal */}
        <TeamForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTeam(null);
          }}
          onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam}
          initialData={editingTeam ? {
            name: editingTeam.name,
            color: editingTeam.color,
            members: editingTeam.members,
            avatar: editingTeam.avatar ?? undefined
          } : undefined}
          mode={editingTeam ? 'edit' : 'create'}
        />
      </div>
    </div>
  );
};

export default TeamsPage;
