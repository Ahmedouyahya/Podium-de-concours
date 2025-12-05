import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import {
  initializeDataStore,
  getStorageMode,
  getTeams,
  getTeamById,
  addTeam,
  updateTeam,
  deleteTeam,
  getUsers,
  getUserById,
  getUserByUsername,
  addUser,
  updateUser,
  getChallenges,
  getChallengeById,
  getScores,
  addScore,
  getActivityLog,
  addActivity,
  getSubmissions,
  addSubmission,
  calculateTeamScore,
  getLeaderboard,
  getRawData,
  saveData,
  StorageMode
} from './config/dataStore';

import { MockTeam, MockUser, MockScore, MockActivity, MockSubmission, UserRole } from './config/mockData';

// Configuration
dotenv.config();
const app: Application = express();
const httpServer = createServer(app);
const PORT: number = parseInt(process.env.PORT || '3001', 10);

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:9898',
  process.env.FRONTEND_URL,
].filter(Boolean);

// Socket.io avec CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.includes('devtunnels.ms') || origin.includes('localhost') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.includes('devtunnels.ms') || origin.includes('localhost') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== HELPER FUNCTIONS ====================

const sanitizeUser = (user: MockUser) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

const extractUser = (req: Request): MockUser | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  const token = authHeader.split(' ')[1];
  const match = token.match(/mock-token-(\d+)-\d+/);
  if (!match) return null;
  
  const userId = parseInt(match[1]);
  return getUserById(userId) || null;
};

const isUserAdmin = (user: MockUser | null): boolean => user?.role === 'admin';

const isUserLeaderOfTeam = (user: MockUser | null, teamId: number): boolean => {
  if (!user) return false;
  const team = getTeamById(teamId);
  return team?.leader_id === user.id;
};

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    res.status(400).json({ success: false, error: 'Username et password sont requis' });
    return;
  }
  
  const user = getUsers().find(u => 
    (u.username === username || u.email === username) && u.password === password
  );
  
  if (!user) {
    res.status(401).json({ success: false, error: 'Identifiants invalides' });
    return;
  }
  
  const team = user.team_id ? getTeamById(user.team_id) : null;
  
  res.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      team: team ? { ...team, total_score: calculateTeamScore(team.id) } : null,
      token: `mock-token-${user.id}-${Date.now()}`
    }
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, password, role = 'participant', team_id = null } = req.body;
  
  if (!username || !email || !password) {
    res.status(400).json({ success: false, error: 'Username, email et password sont requis' });
    return;
  }
  
  if (getUsers().find(u => u.username === username)) {
    res.status(400).json({ success: false, error: 'Ce nom d\'utilisateur existe déjà' });
    return;
  }
  
  if (getUsers().find(u => u.email === email)) {
    res.status(400).json({ success: false, error: 'Cet email est déjà utilisé' });
    return;
  }
  
  const newUser = addUser({
    username,
    email,
    password,
    role: role as UserRole,
    team_id,
    avatar: null
  });
  
  res.status(201).json({
    success: true,
    data: {
      user: sanitizeUser(newUser),
      token: `mock-token-${newUser.id}-${Date.now()}`
    }
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = extractUser(req);
  
  if (!user) {
    res.status(401).json({ success: false, error: 'Non authentifié' });
    return;
  }
  
  const team = user.team_id ? getTeamById(user.team_id) : null;
  
  res.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      team: team ? { ...team, total_score: calculateTeamScore(team.id) } : null
    }
  });
});

// ==================== USERS ROUTES ====================

app.get('/api/users', (req: Request, res: Response) => {
  const usersWithTeams = getUsers().map(user => {
    const team = user.team_id ? getTeamById(user.team_id) : null;
    return {
      ...sanitizeUser(user),
      team_name: team?.name,
      team_color: team?.color
    };
  });
  
  res.json({ success: true, data: usersWithTeams });
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const user = getUserById(id);
  
  if (!user) {
    res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    return;
  }
  
  const team = user.team_id ? getTeamById(user.team_id) : null;
  res.json({ success: true, data: { ...sanitizeUser(user), team } });
});

// ==================== TEAMS ROUTES ====================

app.get('/api/teams', (req: Request, res: Response) => {
  const teamsWithScores = getTeams()
    .map(team => ({
      ...team,
      total_score: calculateTeamScore(team.id),
      challenges_completed: getScores().filter(s => s.team_id === team.id).length
    }))
    .sort((a, b) => b.total_score - a.total_score);
  
  res.json({ success: true, data: teamsWithScores });
});

app.get('/api/teams/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const team = getTeamById(id);
  
  if (!team) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  res.json({
    success: true,
    data: {
      ...team,
      total_score: calculateTeamScore(team.id),
      challenges_completed: getScores().filter(s => s.team_id === team.id).length
    }
  });
});

app.post('/api/teams', (req: Request, res: Response) => {
  const currentUser = extractUser(req);
  
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Vous devez être connecté pour créer une équipe' });
    return;
  }
  
  if (currentUser.team_id) {
    res.status(400).json({ success: false, error: 'Vous appartenez déjà à une équipe' });
    return;
  }
  
  const { name, color = '#6366f1', avatar = null } = req.body;
  
  if (!name) {
    res.status(400).json({ success: false, error: 'Le nom est requis' });
    return;
  }
  
  if (getTeams().find(t => t.name.toLowerCase() === name.toLowerCase())) {
    res.status(400).json({ success: false, error: 'Ce nom d\'équipe existe déjà' });
    return;
  }
  
  const newTeam = addTeam({
    name,
    color,
    avatar,
    members: 1,
    leader_id: currentUser.id
  });
  
  // Update user
  updateUser(currentUser.id, { team_id: newTeam.id, role: 'leader' });
  
  // Add activity
  addActivity({
    team_id: newTeam.id,
    action_type: 'team_created',
    description: `L'équipe "${name}" créée par ${currentUser.username} a rejoint la compétition!`,
    points_change: 0
  });
  
  io.to('leaderboard').emit('leaderboard_updated');
  
  res.status(201).json({ 
    success: true, 
    data: { ...newTeam, total_score: 0, challenges_completed: 0 }
  });
});

app.put('/api/teams/:id', (req: Request, res: Response) => {
  const currentUser = extractUser(req);
  const id = parseInt(req.params.id);
  const team = getTeamById(id);
  
  if (!team) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  if (!isUserAdmin(currentUser) && !isUserLeaderOfTeam(currentUser, id)) {
    res.status(403).json({ success: false, error: 'Seul l\'admin ou le chef d\'équipe peut modifier cette équipe' });
    return;
  }
  
  const { name, color, avatar } = req.body;
  
  if (name && getTeams().find(t => t.name.toLowerCase() === name.toLowerCase() && t.id !== id)) {
    res.status(400).json({ success: false, error: 'Ce nom d\'équipe existe déjà' });
    return;
  }
  
  const updated = updateTeam(id, { name, color, avatar });
  res.json({ success: true, data: updated });
});

app.delete('/api/teams/:id', (req: Request, res: Response) => {
  const currentUser = extractUser(req);
  const id = parseInt(req.params.id);
  
  if (!getTeamById(id)) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  if (!isUserAdmin(currentUser)) {
    res.status(403).json({ success: false, error: 'Seul l\'admin peut supprimer une équipe' });
    return;
  }
  
  // Remove users from team
  getUsers().forEach(u => {
    if (u.team_id === id) {
      updateUser(u.id, { team_id: null, role: u.role === 'leader' ? 'participant' : u.role });
    }
  });
  
  deleteTeam(id);
  io.to('leaderboard').emit('leaderboard_updated');
  
  res.json({ success: true, message: 'Équipe supprimée avec succès' });
});

// Team members
app.get('/api/teams/:id/members', (req: Request, res: Response) => {
  const teamId = parseInt(req.params.id);
  const team = getTeamById(teamId);
  
  if (!team) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  const teamMembers = getUsers()
    .filter(u => u.team_id === teamId)
    .map(u => ({ ...sanitizeUser(u), is_leader: team.leader_id === u.id }));
  
  res.json({ success: true, data: teamMembers });
});

app.post('/api/teams/:id/members', (req: Request, res: Response) => {
  const currentUser = extractUser(req);
  const teamId = parseInt(req.params.id);
  const team = getTeamById(teamId);
  
  if (!team) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  if (!isUserAdmin(currentUser) && !isUserLeaderOfTeam(currentUser, teamId)) {
    res.status(403).json({ success: false, error: 'Seul le chef d\'équipe ou un admin peut ajouter des membres' });
    return;
  }
  
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    res.status(400).json({ success: false, error: 'Username, email et password sont requis' });
    return;
  }
  
  if (getUsers().find(u => u.username === username)) {
    res.status(400).json({ success: false, error: 'Ce nom d\'utilisateur existe déjà' });
    return;
  }
  
  const newUser = addUser({
    username,
    email,
    password,
    role: 'participant',
    team_id: teamId,
    avatar: null
  });
  
  // Update team member count
  updateTeam(teamId, { members: getUsers().filter(u => u.team_id === teamId).length });
  
  addActivity({
    team_id: teamId,
    action_type: 'member_joined',
    description: `${username} a rejoint l'équipe ${team.name}!`,
    points_change: 0
  });
  
  res.status(201).json({ success: true, data: sanitizeUser(newUser) });
});

// ==================== SCORES ROUTES ====================

app.get('/api/scores', (req: Request, res: Response) => {
  const scoresWithDetails = getScores().map(score => {
    const team = getTeamById(score.team_id);
    const challenge = score.challenge_id ? getChallengeById(score.challenge_id) : null;
    return {
      ...score,
      team_name: team?.name,
      team_color: team?.color,
      challenge_name: challenge?.name
    };
  }).sort((a, b) => b.awarded_at.getTime() - a.awarded_at.getTime());
  
  res.json({ success: true, data: scoresWithDetails });
});

app.get('/api/scores/leaderboard', (req: Request, res: Response) => {
  res.json({ success: true, data: getLeaderboard() });
});

app.post('/api/scores', (req: Request, res: Response) => {
  const currentUser = extractUser(req);
  
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Authentification requise pour ajouter des scores' });
    return;
  }
  
  if (currentUser.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Seuls les administrateurs peuvent attribuer des scores' });
    return;
  }
  
  const { team_id, challenge_id = null, points, bonus_points = 0, comment = null } = req.body;
  
  if (!team_id || points === undefined) {
    res.status(400).json({ success: false, error: 'team_id et points sont requis' });
    return;
  }
  
  const team = getTeamById(team_id);
  if (!team) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  const newScore = addScore({ team_id, challenge_id, points, bonus_points, comment });
  
  const totalPoints = points + bonus_points;
  addActivity({
    team_id,
    action_type: 'score_added',
    description: `${team.name} a gagné ${totalPoints} points!`,
    points_change: totalPoints
  });
  
  io.to('leaderboard').emit('leaderboard_updated');
  
  res.status(201).json({ success: true, data: newScore });
});

// ==================== CHALLENGES ROUTES ====================

app.get('/api/challenges', (req: Request, res: Response) => {
  res.json({ success: true, data: getChallenges() });
});

app.get('/api/challenges/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const challenge = getChallengeById(id);
  
  if (!challenge) {
    res.status(404).json({ success: false, error: 'Défi non trouvé' });
    return;
  }
  
  res.json({ success: true, data: challenge });
});

// ==================== ACTIVITY ROUTES ====================

app.get('/api/activity', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  
  const activitiesWithDetails = getActivityLog()
    .map(activity => {
      const team = activity.team_id ? getTeamById(activity.team_id) : null;
      return {
        ...activity,
        team_name: team?.name,
        team_color: team?.color
      };
    })
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, limit);
  
  res.json({ success: true, data: activitiesWithDetails });
});

app.get('/api/activity/stats', (req: Request, res: Response) => {
  const scores = getScores();
  const teams = getTeams();
  const totalPoints = scores.reduce((sum, s) => sum + s.points + s.bonus_points, 0);
  const avgScore = teams.length > 0 ? totalPoints / teams.length : 0;
  
  const leaderboard = getLeaderboard();
  const topTeam = leaderboard[0] || null;
  
  res.json({
    success: true,
    data: {
      total_teams: teams.length,
      total_challenges: getChallenges().length,
      total_points_awarded: totalPoints,
      average_team_score: Math.round(avgScore),
      top_team: topTeam ? {
        name: topTeam.name,
        color: topTeam.color,
        total_score: topTeam.total_score
      } : null
    }
  });
});

// ==================== SUBMISSIONS ROUTES ====================

app.get('/api/submissions', (req: Request, res: Response) => {
  const teamId = req.query.team_id ? parseInt(req.query.team_id as string) : null;
  
  let submissions = getSubmissions();
  if (teamId) {
    submissions = submissions.filter(s => s.team_id === teamId);
  }
  
  const submissionsWithDetails = submissions.map(sub => {
    const user = getUserById(sub.user_id);
    const team = getTeamById(sub.team_id);
    const challenge = getChallengeById(sub.challenge_id);
    return {
      ...sub,
      user_name: user?.username,
      team_name: team?.name,
      challenge_name: challenge?.name
    };
  });
  
  res.json({ success: true, data: submissionsWithDetails });
});

app.post('/api/submissions', (req: Request, res: Response) => {
  const { user_id, team_id, challenge_id, title, description, code_url, demo_url } = req.body;
  
  if (!user_id || !team_id || !challenge_id || !title) {
    res.status(400).json({ success: false, error: 'user_id, team_id, challenge_id et title sont requis' });
    return;
  }
  
  const newSubmission = addSubmission({
    user_id,
    team_id,
    challenge_id,
    title,
    description: description || '',
    code_url: code_url || null,
    demo_url: demo_url || null,
    status: 'pending',
    feedback: null
  });
  
  const user = getUserById(user_id);
  const challenge = getChallengeById(challenge_id);
  
  addActivity({
    team_id,
    action_type: 'submission',
    description: `${user?.username} a soumis "${title}" pour ${challenge?.name}`,
    points_change: 0
  });
  
  io.to('leaderboard').emit('submission_added', newSubmission);
  
  res.status(201).json({ success: true, data: newSubmission });
});

// ==================== UTILITY ROUTES ====================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: `API Podium de Concours - Mode: ${getStorageMode().toUpperCase()}`,
    mode: getStorageMode(),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Podium de Concours API',
    version: '2.0.0',
    mode: `🎭 ${getStorageMode().toUpperCase()} MODE`,
    description: 'API Backend pour la Nuit de l\'Info 2025',
    team: '💪 Réalisé par l\'Équipe MAX',
    storage_priority: '1. MySQL → 2. JSON Files → 3. In-Memory',
    endpoints: {
      auth: '/api/auth/login, /api/auth/register, /api/auth/me',
      teams: '/api/teams',
      scores: '/api/scores',
      challenges: '/api/challenges',
      activity: '/api/activity',
      leaderboard: '/api/scores/leaderboard',
      health: '/api/health'
    }
  });
});

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route non trouvée' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
});

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
  console.log(`🔌 Client connecté: ${socket.id}`);

  socket.on('join_leaderboard', () => {
    socket.join('leaderboard');
  });

  socket.on('join-leaderboard', () => {
    socket.join('leaderboard');
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client déconnecté: ${socket.id}`);
  });
});

// ==================== START SERVER ====================

const startServer = async () => {
  // Initialize data store (priority: MySQL → JSON → Memory)
  const mode = await initializeDataStore();
  
  httpServer.listen(PORT, () => {
    const modeEmoji = mode === 'database' ? '🗄️' : mode === 'json' ? '📁' : '🎭';
    const modeText = mode === 'database' ? 'MySQL Database' : mode === 'json' ? 'JSON Files' : 'In-Memory';
    
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🏆 PODIUM DE CONCOURS - NUIT DE L'INFO 2025 🏆           ║
║                                                            ║
║   ${modeEmoji} MODE: ${modeText.padEnd(42)}║
║                                                            ║
║   📡 API:      http://localhost:${PORT}                      ║
║   🔌 Socket:   http://localhost:${PORT}                      ║
║                                                            ║
║   📊 Priorité de stockage:                                 ║
║   ─────────────────────────────────────────────────────    ║
║   1️⃣  MySQL Database (si DB_HOST configuré)                ║
║   2️⃣  JSON Files (persistance locale)                      ║
║   3️⃣  In-Memory (données temporaires)                      ║
║                                                            ║
║   🔐 Comptes de test:                                      ║
║   ─────────────────────────────────────────────────────    ║
║   👑 Admin:      admin / admin123                          ║
║   🎯 Leader Max: max_leader / leader123                    ║
║   👤 Participant: ahmed / pass123                          ║
║                                                            ║
║   💪 Réalisé à 100% par l'Équipe MAX                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
};

startServer();

export { io };
