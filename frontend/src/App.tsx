import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import TeamsPage from './pages/TeamsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';
import AdminPageNew from './pages/AdminPageNew';
import LoginPage from './pages/LoginPage';
import ChallengesPage from './pages/ChallengesPage';
import TeamManagePage from './pages/TeamManagePage';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          {/* Skip link for accessibility */}
          <a href="#main-content" className="skip-link">
            Aller au contenu principal
          </a>
          
          <Routes>
            {/* Login page - accessible only to guests */}
            <Route path="/login" element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            } />
            
            {/* Protected routes with Layout */}
            <Route element={<Layout><main id="main-content" role="main"><Routes /></main></Layout>}>
            </Route>
            
            {/* Main app routes */}
            <Route path="/" element={
              <Layout>
                <main id="main-content" role="main">
                  <Dashboard />
                </main>
              </Layout>
            } />
            
            <Route path="/leaderboard" element={
              <Layout>
                <main id="main-content" role="main">
                  <LeaderboardPage />
                </main>
              </Layout>
            } />
            
            <Route path="/teams" element={
              <Layout>
                <main id="main-content" role="main">
                  <TeamsPage />
                </main>
              </Layout>
            } />
            
            {/* Admin routes - protected, admin only */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Layout>
                  <main id="main-content" role="main">
                    <AdminPage />
                  </main>
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Layout>
                  <main id="main-content" role="main">
                    <AdminPageNew />
                  </main>
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Leader routes - accessible to admin and leader */}
            <Route path="/leader" element={
              <ProtectedRoute requiredRoles={['admin', 'leader']}>
                <Layout>
                  <main id="main-content" role="main">
                    <AdminPage />
                  </main>
                </Layout>
              </ProtectedRoute>
            } />

            {/* Challenges page - accessible to all logged in users */}
            <Route path="/challenges" element={
              <ProtectedRoute>
                <Layout>
                  <main id="main-content" role="main">
                    <ChallengesPage />
                  </main>
                </Layout>
              </ProtectedRoute>
            } />

            {/* Team management - accessible to admin and leader */}
            <Route path="/team-manage" element={
              <ProtectedRoute requiredRoles={['admin', 'leader']}>
                <Layout>
                  <main id="main-content" role="main">
                    <TeamManagePage />
                  </main>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
          
          {/* Toast notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a3a',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
