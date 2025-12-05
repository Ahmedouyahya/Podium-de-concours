import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  LogIn, 
  User, 
  Lock, 
  Trophy,
  Shield,
  Users,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ username, password });
      toast.success('Connexion réussie!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickLogin = async (user: string, pass: string, role: string) => {
    setUsername(user);
    setPassword(pass);
    setIsSubmitting(true);
    try {
      await login({ username: user, password: pass });
      toast.success(`Connecté en tant que ${role}!`);
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <motion.div 
        className="login-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <Trophy size={48} className="trophy-icon" />
          </div>
          <h1>Podium de Concours</h1>
          <p>Nuit de l'Info 2025</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              <User size={18} />
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="spinner"></span>
            ) : (
              <>
                <LogIn size={20} />
                Se connecter
              </>
            )}
          </button>
        </form>

        {/* Quick Login Demo */}
        <div className="demo-section">
          <h3>Connexion rapide (Démo)</h3>
          <div className="demo-buttons">
            <button 
              className="demo-btn admin"
              onClick={() => quickLogin('admin', 'admin123', 'Administrateur')}
              disabled={isSubmitting}
            >
              <Shield size={18} />
              <span>Admin</span>
            </button>
            <button 
              className="demo-btn leader"
              onClick={() => quickLogin('max_leader', 'leader123', 'Leader Max')}
              disabled={isSubmitting}
            >
              <UserCheck size={18} />
              <span>Leader Max</span>
            </button>
            <button 
              className="demo-btn participant"
              onClick={() => quickLogin('ahmed', 'pass123', 'Participant')}
              disabled={isSubmitting}
            >
              <Users size={18} />
              <span>Participant</span>
            </button>
          </div>
        </div>

        {/* Credentials Info */}
        <div className="credentials-info">
          <h4>Comptes de test :</h4>
          <ul>
            <li><strong>Admin:</strong> admin / admin123</li>
            <li><strong>Leader Max:</strong> max_leader / leader123</li>
            <li><strong>Participant:</strong> ahmed / pass123</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
