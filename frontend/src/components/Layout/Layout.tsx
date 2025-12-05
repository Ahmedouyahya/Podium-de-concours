import React, { ReactNode } from 'react';
import Header from './Header';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      {/* Animated background particles */}
      <div className="background-effects" aria-hidden="true">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      <Header />
      
      <div className="layout-content">
        {children}
      </div>
      
      <footer className="layout-footer" role="contentinfo">
        <div className="container">
          <p>
            🌊 Nuit de l'Info 2025 — Créé avec ❤️ pour les océans
          </p>
          <p className="footer-credits">
            Podium de Concours • Accessible à tous (WCAG 2.1 AA)
          </p>
          <p className="footer-team">
            <span className="team-badge">Réalisé par</span>
            <span className="team-name">Max</span>
            <span className="team-emoji">🚀</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
