import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import {
  teams,
  challenges,
  scores,
  activityLog,
  users,
  submissions,
  getNextTeamId,
  getNextScoreId,
  getNextActivityId,
  getNextUserId,
  getNextSubmissionId,
  MockTeam,
  MockScore,
  MockActivity,
  MockUser,
  MockSubmission,
  UserRole
} from './config/mockData';

// Configuration
dotenv.config();
const app: Application = express();
const httpServer = createServer(app);
const PORT: number = parseInt(process.env.PORT || '3001', 10);

// Allowed origins for CORS (supports devtunnels, localhost, etc.)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

// Socket.io avec CORS - dynamic origin support
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow devtunnels and localhost
      if (origin.includes('devtunnels.ms') || origin.includes('localhost') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(null, true); // Allow all in development
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middlewares - dynamic CORS for development
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    // Allow devtunnels and localhost
    if (origin.includes('devtunnels.ms') || origin.includes('localhost') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(null, true); // Allow all in development
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== HELPER FUNCTIONS ====================

const calculateTeamScore = (teamId: number): number => {
  return scores
    .filter(s => s.team_id === teamId)
    .reduce((sum, s) => sum + s.points + s.bonus_points, 0);
};

const getLeaderboard = () => {
  return teams
    .map(team => ({
      ...team,
      total_score: calculateTeamScore(team.id),
      challenges_completed: scores.filter(s => s.team_id === team.id).length
    }))
    .sort((a, b) => b.total_score - a.total_score)
    .map((team, index) => ({ ...team, rank: index + 1 }));
};

// Sanitize user (remove password)
const sanitizeUser = (user: MockUser) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

// Simple auth middleware - extracts user from token
const extractUser = (req: Request): MockUser | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  // Token format: mock-token-{userId}-{timestamp}
  const match = token.match(/mock-token-(\d+)-\d+/);
  if (!match) return null;
  
  const userId = parseInt(match[1]);
  return users.find(u => u.id === userId) || null;
};

// Check if user is admin
const isUserAdmin = (user: MockUser | null): boolean => {
  return user?.role === 'admin';
};

// Check if user is leader of a specific team
const isUserLeaderOfTeam = (user: MockUser | null, teamId: number): boolean => {
  if (!user) return false;
  const team = teams.find(t => t.id === teamId);
  return team?.leader_id === user.id;
};

// ==================== AUTH ROUTES ====================

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    res.status(400).json({ success: false, error: 'Username et password sont requis' });
    return;
  }
  
  const user = users.find(u => 
    (u.username === username || u.email === username) && u.password === password
  );
  
  if (!user) {
    res.status(401).json({ success: false, error: 'Identifiants invalides' });
    return;
  }
  
  // Get user's team info if applicable
  const team = user.team_id ? teams.find(t => t.id === user.team_id) : null;
  
  res.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      team: team ? {
        ...team,
        total_score: calculateTeamScore(team.id)
      } : null,
      // In real app, this would be a JWT token
      token: `mock-token-${user.id}-${Date.now()}`
    }
  });
});

// POST /api/auth/register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, password, role = 'participant', team_id = null } = req.body;
  
  if (!username || !email || !password) {
    res.status(400).json({ success: false, error: 'Username, email et password sont requis' });
    return;
  }
  
  if (users.find(u => u.username === username)) {
    res.status(400).json({ success: false, error: 'Ce nom d\'utilisateur existe déjà' });
    return;
  }
  
  if (users.find(u => u.email === email)) {
    res.status(400).json({ success: false, error: 'Cet email est déjà utilisé' });
    return;
  }
  
  const newUser: MockUser = {
    id: getNextUserId(),
    username,
    email,
    password,
    role: role as UserRole,
    team_id,
    avatar: null,
    created_at: new Date()
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    data: {
      user: sanitizeUser(newUser),
      token: `mock-token-${newUser.id}-${Date.now()}`
    }
  });
});

// GET /api/auth/me (get current user - in real app, would use JWT)
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer mock-token-')) {
    res.status(401).json({ success: false, error: 'Non authentifié' });
    return;
  }
  
  // Extract user ID from mock token
  const tokenParts = authHeader.replace('Bearer mock-token-', '').split('-');
  const userId = parseInt(tokenParts[0]);
  
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    res.status(401).json({ success: false, error: 'Utilisateur non trouvé' });
    return;
  }
  
  const team = user.team_id ? teams.find(t => t.id === user.team_id) : null;
  
  res.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      team: team ? {
        ...team,
        total_score: calculateTeamScore(team.id)
      } : null
    }
  });
});

// ==================== USERS ROUTES (Admin only) ====================

// GET /api/users
app.get('/api/users', (req: Request, res: Response) => {
  const usersWithTeams = users.map(user => {
    const team = user.team_id ? teams.find(t => t.id === user.team_id) : null;
    return {
      ...sanitizeUser(user),
      team_name: team?.name,
      team_color: team?.color
    };
  });
  
  res.json({ success: true, data: usersWithTeams });
});

// GET /api/users/:id
app.get('/api/users/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  
  if (!user) {
    res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    return;
  }
  
  const team = user.team_id ? teams.find(t => t.id === user.team_id) : null;
  
  res.json({
    success: true,
    data: {
      ...sanitizeUser(user),
      team: team
    }
  });
});

// POST /api/users (Admin create user)
app.post('/api/users', (req: Request, res: Response) => {
  const { username, email, password, role = 'participant', team_id = null } = req.body;
  
  if (!username || !email || !password) {
    res.status(400).json({ success: false, error: 'Username, email et password sont requis' });
    return;
  }
  
  if (users.find(u => u.username === username)) {
    res.status(400).json({ success: false, error: 'Ce nom d\'utilisateur existe déjà' });
    return;
  }
  
  const newUser: MockUser = {
    id: getNextUserId(),
    username,
    email,
    password,
    role: role as UserRole,
    team_id,
    avatar: null,
    created_at: new Date()
  };
  
  users.push(newUser);
  
  // If role is leader and team exists, update team's leader_id
  if (role === 'leader' && team_id) {
    const teamIndex = teams.findIndex(t => t.id === team_id);
    if (teamIndex !== -1) {
      teams[teamIndex].leader_id = newUser.id;
    }
  }
  
  // Update team member count
  if (team_id) {
    const teamIndex = teams.findIndex(t => t.id === team_id);
    if (teamIndex !== -1) {
      teams[teamIndex].members = users.filter(u => u.team_id === team_id).length;
    }
  }
  
  res.status(201).json({ success: true, data: sanitizeUser(newUser) });
});

// PUT /api/users/:id
app.put('/api/users/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    return;
  }
  
  const { username, email, password, role, team_id, avatar } = req.body;
  const oldTeamId = users[userIndex].team_id;
  
  if (username !== undefined) users[userIndex].username = username;
  if (email !== undefined) users[userIndex].email = email;
  if (password !== undefined) users[userIndex].password = password;
  if (role !== undefined) users[userIndex].role = role;
  if (team_id !== undefined) users[userIndex].team_id = team_id;
  if (avatar !== undefined) users[userIndex].avatar = avatar;
  
  // Update team member counts if team changed
  if (team_id !== undefined && team_id !== oldTeamId) {
    if (oldTeamId) {
      const oldTeamIndex = teams.findIndex(t => t.id === oldTeamId);
      if (oldTeamIndex !== -1) {
        teams[oldTeamIndex].members = users.filter(u => u.team_id === oldTeamId).length;
      }
    }
    if (team_id) {
      const newTeamIndex = teams.findIndex(t => t.id === team_id);
      if (newTeamIndex !== -1) {
        teams[newTeamIndex].members = users.filter(u => u.team_id === team_id).length;
      }
    }
  }
  
  res.json({ success: true, data: sanitizeUser(users[userIndex]) });
});

// DELETE /api/users/:id
app.delete('/api/users/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    return;
  }
  
  // Don't allow deleting the main admin
  if (users[userIndex].role === 'admin' && users[userIndex].id === 1) {
    res.status(403).json({ success: false, error: 'Impossible de supprimer l\'administrateur principal' });
    return;
  }
  
  const deletedUser = users[userIndex];
  users.splice(userIndex, 1);
  
  // Update team member count
  if (deletedUser.team_id) {
    const teamIndex = teams.findIndex(t => t.id === deletedUser.team_id);
    if (teamIndex !== -1) {
      teams[teamIndex].members = users.filter(u => u.team_id === deletedUser.team_id).length;
    }
  }
  
  res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
});

// ==================== TEAM MEMBERS ROUTES (Leader can manage their team) ====================

// GET /api/teams/:id/members - Get all members of a team
app.get('/api/teams/:id/members', (req: Request, res: Response) => {
  const teamId = parseInt(req.params.id);
  const team = teams.find(t => t.id === teamId);
  
  if (!team) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  const teamMembers = users
    .filter(u => u.team_id === teamId)
    .map(u => ({
      ...sanitizeUser(u),
      is_leader: team.leader_id === u.id
    }));
  
  res.json({ success: true, data: teamMembers });
});

// POST /api/teams/:id/members - Leader adds a member to their team
app.post('/api/teams/:id/members', (req: Request, res: Response) => {
  const currentUser = extractUser(req);
  const teamId = parseInt(req.params.id);
  const team = teams.find(t => t.id === teamId);
  
  if (!team) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  // Only admin or team leader can add members
  if (!isUserAdmin(currentUser) && !isUserLeaderOfTeam(currentUser, teamId)) {
    res.status(403).json({ success: false, error: 'Seul le chef d\'équipe ou un admin peut ajouter des membres' });
    return;
  }
  
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    res.status(400).json({ success: false, error: 'Username, email et password sont requis' });
    return;
  }
  
  if (users.find(u => u.username === username)) {
    res.status(400).json({ success: false, error: 'Ce nom d\'utilisateur existe déjà' });
    return;
  }
  
  if (users.find(u => u.email === email)) {
    res.status(400).json({ success: false, error: 'Cet email est déjà utilisé' });
    return;
  }
  
  const newUser: MockUser = {
    id: getNextUserId(),
    username,
    email,
    password,
    role: 'participant',
    team_id: teamId,
    avatar: null,
    created_at: new Date()
  };
  
  users.push(newUser);
  
  // Update team member count
  const teamIndex = teams.findIndex(t => t.id === teamId);
  teams[teamIndex].members = users.filter(u => u.team_id === teamId).length;
  
  // Add activity
  activityLog.push({
    id: getNextActivityId(),
    team_id: teamId,
    action_type: 'member_joined',
    description: `${username} a rejoint l'équipe ${team.name}!`,
    points_change: 0,
    created_at: new Date()
  });
  
  res.status(201).json({ success: true, data: sanitizeUser(newUser) });
});

// DELETE /api/teams/:id/members/:userId - Leader removes a member from their team
app.delete('/api/teams/:id/members/:userId', (req: Request, res: Response) => {
  const currentUser = extractUser(req);
  const teamId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  
  const team = teams.find(t => t.id === teamId);
  if (!team) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  // Only admin or team leader can remove members
  if (!isUserAdmin(currentUser) && !isUserLeaderOfTeam(currentUser, teamId)) {
    res.status(403).json({ success: false, error: 'Seul le chef d\'équipe ou un admin peut retirer des membres' });
    return;
  }
  
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    return;
  }
  
  const user = users[userIndex];
  if (user.team_id !== teamId) {
    res.status(400).json({ success: false, error: 'Cet utilisateur n\'appartient pas à cette équipe' });
    return;
  }
  
  // Can't remove the leader
  if (team.leader_id === userId) {
    res.status(400).json({ success: false, error: 'Impossible de retirer le chef d\'équipe' });
    return;
  }
  
  // Remove user from team (don't delete, just remove from team)
  users[userIndex].team_id = null;
  
  // Update team member count
  const teamIndex = teams.findIndex(t => t.id === teamId);
  teams[teamIndex].members = users.filter(u => u.team_id === teamId).length;
  
  res.json({ success: true, message: 'Membre retiré de l\'équipe' });
});

// ==================== SUBMISSIONS ROUTES ====================

// GET /api/submissions - Get all submissions (admin) or team submissions (user)
app.get('/api/submissions', (req: Request, res: Response) => {
  const teamId = req.query.team_id ? parseInt(req.query.team_id as string) : null;
  const challengeId = req.query.challenge_id ? parseInt(req.query.challenge_id as string) : null;
  
  let filteredSubmissions = [...submissions];
  
  if (teamId) {
    filteredSubmissions = filteredSubmissions.filter(s => s.team_id === teamId);
  }
  
  if (challengeId) {
    filteredSubmissions = filteredSubmissions.filter(s => s.challenge_id === challengeId);
  }
  
  const submissionsWithDetails = filteredSubmissions.map(sub => {
    const user = users.find(u => u.id === sub.user_id);
    const team = teams.find(t => t.id === sub.team_id);
    const challenge = challenges.find(c => c.id === sub.challenge_id);
    
    return {
      ...sub,
      user_name: user?.username,
      team_name: team?.name,
      team_color: team?.color,
      challenge_name: challenge?.name,
      challenge_difficulty: challenge?.difficulty,
      challenge_max_points: challenge?.max_points
    };
  }).sort((a, b) => b.submitted_at.getTime() - a.submitted_at.getTime());
  
  res.json({ success: true, data: submissionsWithDetails });
});

// GET /api/submissions/:id
app.get('/api/submissions/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const submission = submissions.find(s => s.id === id);
  
  if (!submission) {
    res.status(404).json({ success: false, error: 'Soumission non trouvée' });
    return;
  }
  
  const user = users.find(u => u.id === submission.user_id);
  const team = teams.find(t => t.id === submission.team_id);
  const challenge = challenges.find(c => c.id === submission.challenge_id);
  
  res.json({
    success: true,
    data: {
      ...submission,
      user_name: user?.username,
      team_name: team?.name,
      team_color: team?.color,
      challenge_name: challenge?.name,
      challenge_difficulty: challenge?.difficulty,
      challenge_max_points: challenge?.max_points
    }
  });
});

// POST /api/submissions - Submit a solution for a challenge
app.post('/api/submissions', (req: Request, res: Response) => {
  const { user_id, team_id, challenge_id, title, description, code_url, demo_url } = req.body;
  
  if (!user_id || !team_id || !challenge_id || !title) {
    res.status(400).json({ success: false, error: 'user_id, team_id, challenge_id et title sont requis' });
    return;
  }
  
  const user = users.find(u => u.id === user_id);
  if (!user) {
    res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    return;
  }
  
  const team = teams.find(t => t.id === team_id);
  if (!team) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  const challenge = challenges.find(c => c.id === challenge_id);
  if (!challenge) {
    res.status(404).json({ success: false, error: 'Défi non trouvé' });
    return;
  }
  
  // Check if user belongs to team
  if (user.team_id !== team_id) {
    res.status(403).json({ success: false, error: 'Vous ne pouvez soumettre que pour votre équipe' });
    return;
  }
  
  const newSubmission: MockSubmission = {
    id: getNextSubmissionId(),
    user_id,
    team_id,
    challenge_id,
    title,
    description: description || '',
    code_url: code_url || null,
    demo_url: demo_url || null,
    status: 'pending',
    feedback: null,
    submitted_at: new Date()
  };
  
  submissions.push(newSubmission);
  
  // Add activity
  activityLog.push({
    id: getNextActivityId(),
    team_id,
    action_type: 'submission',
    description: `${user.username} a soumis "${title}" pour ${challenge.name}`,
    points_change: 0,
    created_at: new Date()
  });
  
  io.to('leaderboard').emit('submission_added', newSubmission);
  
  res.status(201).json({
    success: true,
    data: {
      ...newSubmission,
      user_name: user.username,
      team_name: team.name,
      challenge_name: challenge.name
    }
  });
});

// PUT /api/submissions/:id - Update submission (user) or approve/reject (admin)
app.put('/api/submissions/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const subIndex = submissions.findIndex(s => s.id === id);
  
  if (subIndex === -1) {
    res.status(404).json({ success: false, error: 'Soumission non trouvée' });
    return;
  }
  
  const { title, description, code_url, demo_url, status, feedback } = req.body;
  
  if (title !== undefined) submissions[subIndex].title = title;
  if (description !== undefined) submissions[subIndex].description = description;
  if (code_url !== undefined) submissions[subIndex].code_url = code_url;
  if (demo_url !== undefined) submissions[subIndex].demo_url = demo_url;
  if (status !== undefined) submissions[subIndex].status = status;
  if (feedback !== undefined) submissions[subIndex].feedback = feedback;
  
  // If approved, add activity
  if (status === 'approved') {
    const submission = submissions[subIndex];
    const user = users.find(u => u.id === submission.user_id);
    const team = teams.find(t => t.id === submission.team_id);
    
    activityLog.push({
      id: getNextActivityId(),
      team_id: submission.team_id,
      action_type: 'submission_approved',
      description: `La soumission "${submission.title}" de ${user?.username} a été approuvée!`,
      points_change: 0,
      created_at: new Date()
    });
    
    io.to('leaderboard').emit('submission_approved', submissions[subIndex]);
  }
  
  res.json({ success: true, data: submissions[subIndex] });
});

// DELETE /api/submissions/:id
app.delete('/api/submissions/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const subIndex = submissions.findIndex(s => s.id === id);
  
  if (subIndex === -1) {
    res.status(404).json({ success: false, error: 'Soumission non trouvée' });
    return;
  }
  
  submissions.splice(subIndex, 1);
  
  res.json({ success: true, message: 'Soumission supprimée' });
});

// ==================== TEAMS ROUTES ====================

// GET /api/teams
app.get('/api/teams', (req: Request, res: Response) => {
  const teamsWithScores = teams.map(team => ({
    ...team,
    total_score: calculateTeamScore(team.id),
    challenges_completed: scores.filter(s => s.team_id === team.id).length
  })).sort((a, b) => b.total_score - a.total_score);
  
  res.json({ success: true, data: teamsWithScores });
});

// GET /api/teams/:id
app.get('/api/teams/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const team = teams.find(t => t.id === id);
  
  if (!team) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  res.json({
    success: true,
    data: {
      ...team,
      total_score: calculateTeamScore(team.id),
      challenges_completed: scores.filter(s => s.team_id === team.id).length
    }
  });
});

// POST /api/teams - Create a team (requires login, creator becomes leader)
app.post('/api/teams', (req: Request, res: Response) => {
  const currentUser = extractUser(req);
  
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Vous devez être connecté pour créer une équipe' });
    return;
  }
  
  // Check if user already has a team
  if (currentUser.team_id) {
    res.status(400).json({ success: false, error: 'Vous appartenez déjà à une équipe' });
    return;
  }
  
  // Check if user is already a leader of another team
  const existingLeaderTeam = teams.find(t => t.leader_id === currentUser.id);
  if (existingLeaderTeam) {
    res.status(400).json({ success: false, error: 'Vous êtes déjà chef d\'une équipe' });
    return;
  }
  
  const { name, color = '#6366f1', avatar = null } = req.body;
  
  if (!name) {
    res.status(400).json({ success: false, error: 'Le nom est requis' });
    return;
  }
  
  if (teams.find(t => t.name.toLowerCase() === name.toLowerCase())) {
    res.status(400).json({ success: false, error: 'Ce nom d\'équipe existe déjà' });
    return;
  }
  
  const newTeam: MockTeam = {
    id: getNextTeamId(),
    name,
    color,
    avatar,
    members: 1,
    leader_id: currentUser.id, // Creator becomes leader
    created_at: new Date()
  };
  
  teams.push(newTeam);
  
  // Update the creator's team_id and role to leader
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  if (userIndex !== -1) {
    users[userIndex].team_id = newTeam.id;
    users[userIndex].role = 'leader';
  }
  
  // Add activity
  activityLog.push({
    id: getNextActivityId(),
    team_id: newTeam.id,
    action_type: 'team_created',
    description: `L'équipe "${name}" créée par ${currentUser.username} a rejoint la compétition!`,
    points_change: 0,
    created_at: new Date()
  });
  
  io.to('leaderboard').emit('leaderboard_updated');
  
  res.status(201).json({ 
    success: true, 
    data: { 
      ...newTeam, 
      total_score: 0, 
      challenges_completed: 0 
    },
    // Return updated user info
    user: sanitizeUser(users[userIndex])
  });
});

// PUT /api/teams/:id - Update team (leader or admin only)
app.put('/api/teams/:id', (req: Request, res: Response) => {
  const currentUser = extractUser(req);
  const id = parseInt(req.params.id);
  const teamIndex = teams.findIndex(t => t.id === id);
  
  if (teamIndex === -1) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  // Only admin or team leader can update the team
  if (!isUserAdmin(currentUser) && !isUserLeaderOfTeam(currentUser, id)) {
    res.status(403).json({ success: false, error: 'Seul l\'admin ou le chef d\'équipe peut modifier cette équipe' });
    return;
  }
  
  const { name, color, avatar } = req.body;
  
  // Check if new name already exists (for another team)
  if (name && teams.find(t => t.name.toLowerCase() === name.toLowerCase() && t.id !== id)) {
    res.status(400).json({ success: false, error: 'Ce nom d\'équipe existe déjà' });
    return;
  }
  
  if (name !== undefined) teams[teamIndex].name = name;
  if (color !== undefined) teams[teamIndex].color = color;
  if (avatar !== undefined) teams[teamIndex].avatar = avatar;
  
  res.json({ success: true, data: teams[teamIndex] });
});

// DELETE /api/teams/:id - Delete team (admin only)
app.delete('/api/teams/:id', (req: Request, res: Response) => {
  const currentUser = extractUser(req);
  const id = parseInt(req.params.id);
  const teamIndex = teams.findIndex(t => t.id === id);
  
  if (teamIndex === -1) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  // Only admin can delete teams
  if (!isUserAdmin(currentUser)) {
    res.status(403).json({ success: false, error: 'Seul l\'admin peut supprimer une équipe' });
    return;
  }
  
  // Remove all team members from the team
  users.forEach((u, i) => {
    if (u.team_id === id) {
      users[i].team_id = null;
      if (u.role === 'leader') {
        users[i].role = 'participant';
      }
    }
  });
  
  teams.splice(teamIndex, 1);
  
  // Remove related scores
  const scoreIndexes = scores.map((s, i) => s.team_id === id ? i : -1).filter(i => i !== -1).reverse();
  scoreIndexes.forEach(i => scores.splice(i, 1));
  
  io.to('leaderboard').emit('leaderboard_updated');
  
  res.json({ success: true, message: 'Équipe supprimée avec succès' });
});

// ==================== SCORES ROUTES ====================

// GET /api/scores
app.get('/api/scores', (req: Request, res: Response) => {
  const scoresWithDetails = scores.map(score => {
    const team = teams.find(t => t.id === score.team_id);
    const challenge = challenges.find(c => c.id === score.challenge_id);
    return {
      ...score,
      team_name: team?.name,
      team_color: team?.color,
      challenge_name: challenge?.name
    };
  }).sort((a, b) => b.awarded_at.getTime() - a.awarded_at.getTime());
  
  res.json({ success: true, data: scoresWithDetails });
});

// GET /api/scores/leaderboard
app.get('/api/scores/leaderboard', (req: Request, res: Response) => {
  res.json({ success: true, data: getLeaderboard() });
});

// POST /api/scores - Admin only
app.post('/api/scores', (req: Request, res: Response) => {
  // Check authentication - only admin can add scores
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
  
  const team = teams.find(t => t.id === team_id);
  if (!team) {
    res.status(404).json({ success: false, error: 'Équipe non trouvée' });
    return;
  }
  
  const newScore: MockScore = {
    id: getNextScoreId(),
    team_id,
    challenge_id,
    points,
    bonus_points,
    comment,
    awarded_at: new Date()
  };
  
  scores.push(newScore);
  
  // Add activity
  const totalPoints = points + bonus_points;
  activityLog.push({
    id: getNextActivityId(),
    team_id,
    action_type: 'score_added',
    description: `${team.name} a gagné ${totalPoints} points!`,
    points_change: totalPoints,
    created_at: new Date()
  });
  
  io.to('leaderboard').emit('leaderboard_updated');
  
  res.status(201).json({ success: true, data: newScore });
});

// ==================== CHALLENGES ROUTES ====================

// GET /api/challenges
app.get('/api/challenges', (req: Request, res: Response) => {
  res.json({ success: true, data: challenges });
});

// GET /api/challenges/:id
app.get('/api/challenges/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const challenge = challenges.find(c => c.id === id);
  
  if (!challenge) {
    res.status(404).json({ success: false, error: 'Défi non trouvé' });
    return;
  }
  
  res.json({ success: true, data: challenge });
});

// ==================== ACTIVITY ROUTES ====================

// GET /api/activity
app.get('/api/activity', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  
  const activitiesWithDetails = activityLog
    .map(activity => {
      const team = activity.team_id ? teams.find(t => t.id === activity.team_id) : null;
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

// GET /api/activity/stats
app.get('/api/activity/stats', (req: Request, res: Response) => {
  const totalPoints = scores.reduce((sum, s) => sum + s.points + s.bonus_points, 0);
  const avgScore = teams.length > 0 ? totalPoints / teams.length : 0;
  
  const leaderboard = getLeaderboard();
  const topTeam = leaderboard[0] || null;
  
  res.json({
    success: true,
    data: {
      total_teams: teams.length,
      total_challenges: challenges.length,
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

// ==================== UTILITY ROUTES ====================

// Route de santé
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API Podium de Concours - Mode Mock (sans base de données)',
    timestamp: new Date().toISOString()
  });
});

// Route racine
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Podium de Concours API',
    version: '1.0.0',
    mode: '🎭 MOCK MODE (No Database Required)',
    description: 'API Backend pour la Nuit de l\'Info 2025',
    endpoints: {
      teams: '/api/teams',
      scores: '/api/scores',
      challenges: '/api/challenges',
      activity: '/api/activity',
      leaderboard: '/api/scores/leaderboard',
      stats: '/api/activity/stats',
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
    console.log(`📊 ${socket.id} a rejoint le leaderboard`);
  });

  socket.on('join-leaderboard', () => {
    socket.join('leaderboard');
    console.log(`📊 ${socket.id} a rejoint le leaderboard`);
  });

  socket.on('leave_leaderboard', () => {
    socket.leave('leaderboard');
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client déconnecté: ${socket.id}`);
  });
});

// ==================== START SERVER ====================

httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🏆 PODIUM DE CONCOURS - NUIT DE L'INFO 2025 🏆           ║
║                                                            ║
║   🎭 MODE MOCK - Pas de base de données requise!           ║
║                                                            ║
║   📡 API:      http://localhost:${PORT}                      ║
║   🔌 Socket:   http://localhost:${PORT}                      ║
║                                                            ║
║   Données en mémoire:                                      ║
║   • ${teams.length} équipes (dont "Max")                           ║
║   • ${challenges.length} défis                                         ║
║   • ${scores.length} scores                                        ║
║   • ${users.length} utilisateurs                                   ║
║   • ${submissions.length} soumissions                                    ║
║                                                            ║
║   🔐 Comptes de test:                                      ║
║   ─────────────────────────────────────────────────────    ║
║   👑 Admin:     admin@nuitinfo.fr / admin123               ║
║   🎯 Leader Max: max@nuitinfo.fr / leader123               ║
║   👤 Participant: ahmed@max.fr / pass123                   ║
║                                                            ║
║   📋 Rôles:                                                ║
║   • Admin: Tout gérer                                      ║
║   • Leader: Gérer son équipe + soumettre                   ║
║   • Participant: Voir défis + soumettre solutions          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export { io };
