import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Users, 
  Palette, 
  UserPlus,
  Check,
  AlertCircle
} from 'lucide-react';
import { TeamFormData } from '../../types';
import './TeamForm.css';

interface TeamFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeamFormData) => Promise<void>;
  initialData?: Partial<TeamFormData>;
  mode?: 'create' | 'edit';
}

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
  '#84cc16', '#f97316', '#14b8a6', '#a855f7'
];

const TeamForm: React.FC<TeamFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<TeamFormData>({
    name: initialData?.name || '',
    color: initialData?.color || '#6366f1',
    members: initialData?.members || 3,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Le nom de l\'équipe est requis');
      return;
    }

    if (formData.members < 1 || formData.members > 10) {
      setError('Le nombre de membres doit être entre 1 et 10');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData({ name: '', color: '#6366f1', members: 3 });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title-section">
                <div className="modal-icon" style={{ background: formData.color }}>
                  <UserPlus size={24} color="white" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="modal-title" className="modal-title">
                    {mode === 'create' ? 'Nouvelle Équipe' : 'Modifier l\'Équipe'}
                  </h2>
                  <p className="modal-subtitle">
                    {mode === 'create' 
                      ? 'Créez une nouvelle équipe pour la compétition' 
                      : 'Modifiez les informations de l\'équipe'}
                  </p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={onClose}
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="modal-form">
              {/* Error Message */}
              {error && (
                <motion.div 
                  className="form-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                >
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Team Name */}
              <div className="form-group">
                <label htmlFor="team-name" className="form-label">
                  <Users size={16} aria-hidden="true" />
                  Nom de l'équipe
                </label>
                <input
                  id="team-name"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Les Codeurs Fous"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={50}
                  required
                  autoFocus
                  aria-describedby="name-hint"
                />
                <span id="name-hint" className="form-hint">
                  {formData.name.length}/50 caractères
                </span>
              </div>

              {/* Team Color */}
              <div className="form-group">
                <label className="form-label">
                  <Palette size={16} aria-hidden="true" />
                  Couleur de l'équipe
                </label>
                <div className="color-picker" role="radiogroup" aria-label="Sélectionner une couleur">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                      role="radio"
                      aria-checked={formData.color === color}
                      aria-label={`Couleur ${color}`}
                    >
                      {formData.color === color && (
                        <Check size={16} color="white" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="custom-color">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="color-input"
                    aria-label="Couleur personnalisée"
                  />
                  <span className="color-value">{formData.color}</span>
                </div>
              </div>

              {/* Team Members */}
              <div className="form-group">
                <label htmlFor="team-members" className="form-label">
                  <Users size={16} aria-hidden="true" />
                  Nombre de membres
                </label>
                <div className="members-input-wrapper">
                  <button
                    type="button"
                    className="members-btn"
                    onClick={() => setFormData({ ...formData, members: Math.max(1, formData.members - 1) })}
                    disabled={formData.members <= 1}
                    aria-label="Réduire le nombre de membres"
                  >
                    -
                  </button>
                  <input
                    id="team-members"
                    type="number"
                    className="form-input members-input"
                    value={formData.members}
                    onChange={(e) => setFormData({ ...formData, members: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)) })}
                    min={1}
                    max={10}
                    required
                  />
                  <button
                    type="button"
                    className="members-btn"
                    onClick={() => setFormData({ ...formData, members: Math.min(10, formData.members + 1) })}
                    disabled={formData.members >= 10}
                    aria-label="Augmenter le nombre de membres"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="form-preview">
                <div className="preview-label">Aperçu</div>
                <div className="preview-card">
                  <div 
                    className="preview-avatar"
                    style={{ 
                      background: `linear-gradient(135deg, ${formData.color}40, ${formData.color}80)`,
                      borderColor: formData.color 
                    }}
                  >
                    {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="preview-info">
                    <span className="preview-name">{formData.name || 'Nom de l\'équipe'}</span>
                    <span className="preview-members">{formData.members} membre{formData.members > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !formData.name.trim()}
                >
                  {loading ? (
                    <span className="btn-loading">
                      <span className="spinner" aria-hidden="true"></span>
                      Création...
                    </span>
                  ) : (
                    <>
                      <Check size={18} aria-hidden="true" />
                      {mode === 'create' ? 'Créer l\'équipe' : 'Enregistrer'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TeamForm;
