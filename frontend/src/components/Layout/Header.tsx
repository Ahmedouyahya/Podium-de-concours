import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  LayoutDashboard, 
  Settings, 
  Menu, 
  X,
  Sparkles,
  LogIn,
  LogOut,
  User,
  Shield,
  Crown,
  Target,
  UserCog
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isAdmin, isLeader } = useAuth();

  // Build navigation items based on user role
  const getNavItems = () => {
    const items = [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/leaderboard', label: 'Classement', icon: Trophy },
      { path: '/teams', label: 'Équipes', icon: Users },
    ];

    // Add challenges page for authenticated users
    if (isAuthenticated) {
      items.push({ path: '/challenges', label: 'Défis', icon: Target });
    }

    // Add team management for leaders
    if (isLeader && !isAdmin) {
      items.push({ path: '/team-manage', label: 'Mon Équipe', icon: UserCog });
    }

    // Add admin link only for admin users
    if (isAdmin) {
      items.push({ path: '/admin/dashboard', label: 'Admin', icon: Settings });
      items.push({ path: '/team-manage', label: 'Équipes', icon: UserCog });
    }

    return items;
  };

  const navItems = getNavItems();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  // Close menus on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getRoleIcon = () => {
    if (isAdmin) return <Shield size={12} />;
    if (isLeader) return <Crown size={12} />;
    return <User size={12} />;
  };

  const getRoleName = () => {
    if (!user) return '';
    switch (user.role) {
      case 'admin': return 'Administrateur';
      case 'leader': return 'Chef d\'équipe';
      case 'participant': return 'Participant';
      default: return '';
    }
  };

  return (
    <header 
      className={`header ${isScrolled ? 'header-scrolled' : ''}`}
      role="banner"
    >
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="header-logo" aria-label="Podium de Concours - Accueil">
          <motion.div 
            className="logo-icon"
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Trophy className="icon" aria-hidden="true" />
            <Sparkles className="sparkle" aria-hidden="true" />
          </motion.div>
          <div className="logo-text">
            <span className="logo-title">Podium</span>
            <span className="logo-subtitle">Nuit de l'Info 2025</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="header-nav desktop-nav" role="navigation" aria-label="Navigation principale">
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="nav-icon" aria-hidden="true" size={18} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        className="nav-indicator"
                        layoutId="nav-indicator"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right Side - Live Indicator & User Menu */}
        <div className="header-right">
          {/* Live Indicator */}
          <div className="live-indicator" aria-live="polite">
            <span className="live-dot" aria-hidden="true"></span>
            <span className="live-text">En direct</span>
          </div>

          {/* User Menu or Login Button */}
          {isAuthenticated && user ? (
            <div className="user-menu-container">
              <button
                className="user-menu-trigger"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <div className="user-avatar-small">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="user-name">{user.username}</span>
                <span className={`user-role-badge ${user.role}`}>
                  {getRoleIcon()}
                </span>
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    className="user-dropdown"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="user-dropdown-header">
                      <div className="user-avatar-large">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" />
                        ) : (
                          user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="user-info">
                        <span className="user-name-large">{user.username}</span>
                        <span className="user-email">{user.email}</span>
                        <span className={`user-role-text ${user.role}`}>
                          {getRoleIcon()} {getRoleName()}
                        </span>
                      </div>
                    </div>
                    <div className="user-dropdown-divider" />
                    <button
                      className="user-dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Se déconnecter</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" className="login-button">
              <LogIn size={18} />
              <span>Connexion</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            id="mobile-navigation"
            className="mobile-nav"
            role="navigation"
            aria-label="Navigation mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="mobile-nav-list">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <motion.li
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.path}
                      className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="nav-icon" aria-hidden="true" size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </motion.li>
                );
              })}
              
              {/* Mobile User Section */}
              <motion.li
                className="mobile-user-section"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navItems.length * 0.1 }}
              >
                {isAuthenticated && user ? (
                  <>
                    <div className="mobile-user-info">
                      <div className="user-avatar-small">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" />
                        ) : (
                          user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="user-name">{user.username}</span>
                        <span className={`user-role-text ${user.role}`}>
                          {getRoleName()}
                        </span>
                      </div>
                    </div>
                    <button
                      className="mobile-logout-btn"
                      onClick={handleLogout}
                    >
                      <LogOut size={18} />
                      <span>Déconnexion</span>
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="mobile-login-btn">
                    <LogIn size={18} />
                    <span>Se connecter</span>
                  </Link>
                )}
              </motion.li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
