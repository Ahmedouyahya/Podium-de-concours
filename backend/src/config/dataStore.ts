/**
 * Data Store - Priority System:
 * 1. MySQL Database (if DB_HOST is configured and connection works)
 * 2. JSON File (fallback - persists data to disk)
 * 3. In-Memory (last resort - data lost on restart)
 * 
 * Réalisé par l'Équipe MAX - Nuit de l'Info 2025
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  MockTeam,
  MockUser,
  MockChallenge,
  MockScore,
  MockActivity,
  MockSubmission,
  UserRole
} from './mockData';

// ==================== STORAGE MODE ====================

export type StorageMode = 'database' | 'json' | 'memory';

let currentMode: StorageMode = 'memory';

// ==================== JSON FILE PATHS ====================

const DATA_DIR = path.join(__dirname, '../../data');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CHALLENGES_FILE = path.join(DATA_DIR, 'challenges.json');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

// ==================== DATA CONTAINERS ====================

interface DataStore {
  teams: MockTeam[];
  users: MockUser[];
  challenges: MockChallenge[];
  scores: MockScore[];
  activityLog: MockActivity[];
  submissions: MockSubmission[];
  counters: {
    teamId: number;
    userId: number;
    challengeId: number;
    scoreId: number;
    activityId: number;
    submissionId: number;
  };
}

// Default initial data
const getDefaultData = (): DataStore => ({
  teams: [
    { id: 1, name: 'Max', color: '#6366f1', avatar: null, members: 4, leader_id: 2, created_at: new Date() },
    { id: 2, name: 'Byte Me', color: '#ec4899', avatar: null, members: 3, leader_id: 6, created_at: new Date() },
    { id: 3, name: 'Debug Dynasty', color: '#10b981', avatar: null, members: 5, leader_id: 9, created_at: new Date() },
    { id: 4, name: 'Syntax Errors', color: '#f59e0b', avatar: null, members: 4, leader_id: 12, created_at: new Date() },
    { id: 5, name: 'Infinite Loop', color: '#ef4444', avatar: null, members: 3, leader_id: 15, created_at: new Date() },
  ],
  users: [
    { id: 1, username: 'admin', email: 'admin@nuitinfo.fr', password: 'admin123', role: 'admin' as UserRole, team_id: null, avatar: null, created_at: new Date() },
    { id: 2, username: 'max_leader', email: 'max@nuitinfo.fr', password: 'leader123', role: 'leader' as UserRole, team_id: 1, avatar: null, created_at: new Date() },
    { id: 3, username: 'ahmed', email: 'ahmed@max.fr', password: 'pass123', role: 'participant' as UserRole, team_id: 1, avatar: null, created_at: new Date() },
    { id: 4, username: 'sarah', email: 'sarah@max.fr', password: 'pass123', role: 'participant' as UserRole, team_id: 1, avatar: null, created_at: new Date() },
    { id: 5, username: 'youssef', email: 'youssef@max.fr', password: 'pass123', role: 'participant' as UserRole, team_id: 1, avatar: null, created_at: new Date() },
    { id: 6, username: 'david_leader', email: 'david@team2.fr', password: 'leader123', role: 'leader' as UserRole, team_id: 2, avatar: null, created_at: new Date() },
  ],
  challenges: [
    { id: 1, name: 'Premier Commit', description: 'Faire le premier commit du projet', max_points: 100, difficulty: 'easy' as const, category: 'Git', created_at: new Date() },
    { id: 2, name: 'API REST', description: 'Créer une API REST fonctionnelle', max_points: 200, difficulty: 'medium' as const, category: 'Backend', created_at: new Date() },
    { id: 3, name: 'Interface Responsive', description: 'Créer une interface responsive', max_points: 150, difficulty: 'medium' as const, category: 'Frontend', created_at: new Date() },
    { id: 4, name: 'Accessibilité WCAG', description: 'Respecter les normes WCAG 2.1', max_points: 250, difficulty: 'hard' as const, category: 'Accessibilité', created_at: new Date() },
    { id: 5, name: 'Temps Réel', description: 'Implémenter des fonctionnalités temps réel', max_points: 300, difficulty: 'expert' as const, category: 'WebSocket', created_at: new Date() },
  ],
  scores: [
    { id: 1, team_id: 1, challenge_id: 1, points: 100, bonus_points: 20, comment: 'Excellent travail!', awarded_at: new Date() },
    { id: 2, team_id: 1, challenge_id: 2, points: 180, bonus_points: 10, comment: 'API bien structurée', awarded_at: new Date() },
    { id: 3, team_id: 2, challenge_id: 1, points: 90, bonus_points: 0, comment: 'Bon début', awarded_at: new Date() },
    { id: 4, team_id: 3, challenge_id: 1, points: 100, bonus_points: 15, comment: 'Très bien!', awarded_at: new Date() },
  ],
  activityLog: [
    { id: 1, team_id: 1, action_type: 'score_added', description: 'Max a gagné 120 points!', points_change: 120, created_at: new Date() },
    { id: 2, team_id: 1, action_type: 'score_added', description: 'Max a gagné 190 points!', points_change: 190, created_at: new Date() },
    { id: 3, team_id: 2, action_type: 'score_added', description: 'Byte Me a gagné 90 points!', points_change: 90, created_at: new Date() },
  ],
  submissions: [],
  counters: {
    teamId: 6,
    userId: 7,
    challengeId: 6,
    scoreId: 5,
    activityId: 4,
    submissionId: 1,
  }
});

// Current data store
let data: DataStore = getDefaultData();

// ==================== JSON FILE OPERATIONS ====================

const ensureDataDir = (): void => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Dossier data/ créé');
  }
};

const dateReviver = (key: string, value: any): any => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value);
  }
  return value;
};

const loadJsonFile = <T>(filePath: string, defaultValue: T): T => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content, dateReviver);
    }
  } catch (error) {
    console.warn(`⚠️ Erreur lecture ${path.basename(filePath)}:`, error);
  }
  return defaultValue;
};

const saveJsonFile = <T>(filePath: string, data: T): void => {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`❌ Erreur sauvegarde ${path.basename(filePath)}:`, error);
  }
};

// ==================== INITIALIZATION ====================

export const initializeDataStore = async (): Promise<StorageMode> => {
  // Try MySQL first
  if (process.env.DB_HOST && process.env.DB_HOST !== '') {
    try {
      // Dynamic import to avoid errors if mysql2 not installed
      const mysql = await import('mysql2/promise');
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'podium_concours',
        port: parseInt(process.env.DB_PORT || '3306'),
      });
      await connection.ping();
      await connection.end();
      currentMode = 'database';
      console.log('✅ Mode: MySQL Database');
      return currentMode;
    } catch (error) {
      console.log('⚠️ MySQL non disponible, tentative JSON...');
    }
  }

  // Try JSON files
  try {
    ensureDataDir();
    
    // Check if JSON files exist
    const hasJsonData = fs.existsSync(TEAMS_FILE) || fs.existsSync(USERS_FILE);
    
    if (hasJsonData) {
      // Load existing data from JSON
      data = {
        teams: loadJsonFile(TEAMS_FILE, getDefaultData().teams),
        users: loadJsonFile(USERS_FILE, getDefaultData().users),
        challenges: loadJsonFile(CHALLENGES_FILE, getDefaultData().challenges),
        scores: loadJsonFile(SCORES_FILE, getDefaultData().scores),
        activityLog: loadJsonFile(ACTIVITY_FILE, getDefaultData().activityLog),
        submissions: loadJsonFile(SUBMISSIONS_FILE, getDefaultData().submissions),
        counters: loadJsonFile(path.join(DATA_DIR, 'counters.json'), getDefaultData().counters),
      };
      console.log('✅ Mode: JSON Files (données chargées)');
    } else {
      // Initialize with default data and save
      data = getDefaultData();
      saveAllToJson();
      console.log('✅ Mode: JSON Files (nouvelles données créées)');
    }
    
    currentMode = 'json';
    return currentMode;
  } catch (error) {
    console.log('⚠️ JSON non disponible, utilisation mémoire...');
  }

  // Fallback to memory
  data = getDefaultData();
  currentMode = 'memory';
  console.log('✅ Mode: In-Memory (données temporaires)');
  return currentMode;
};

// Save all data to JSON files
const saveAllToJson = (): void => {
  if (currentMode !== 'json') return;
  
  saveJsonFile(TEAMS_FILE, data.teams);
  saveJsonFile(USERS_FILE, data.users);
  saveJsonFile(CHALLENGES_FILE, data.challenges);
  saveJsonFile(SCORES_FILE, data.scores);
  saveJsonFile(ACTIVITY_FILE, data.activityLog);
  saveJsonFile(SUBMISSIONS_FILE, data.submissions);
  saveJsonFile(path.join(DATA_DIR, 'counters.json'), data.counters);
};

// ==================== DATA ACCESS FUNCTIONS ====================

export const getStorageMode = (): StorageMode => currentMode;

// Teams
export const getTeams = (): MockTeam[] => data.teams;
export const getTeamById = (id: number): MockTeam | undefined => data.teams.find(t => t.id === id);
export const addTeam = (team: Omit<MockTeam, 'id' | 'created_at'>): MockTeam => {
  const newTeam: MockTeam = {
    ...team,
    id: data.counters.teamId++,
    created_at: new Date()
  };
  data.teams.push(newTeam);
  if (currentMode === 'json') {
    saveJsonFile(TEAMS_FILE, data.teams);
    saveJsonFile(path.join(DATA_DIR, 'counters.json'), data.counters);
  }
  return newTeam;
};
export const updateTeam = (id: number, updates: Partial<MockTeam>): MockTeam | null => {
  const index = data.teams.findIndex(t => t.id === id);
  if (index === -1) return null;
  data.teams[index] = { ...data.teams[index], ...updates };
  if (currentMode === 'json') saveJsonFile(TEAMS_FILE, data.teams);
  return data.teams[index];
};
export const deleteTeam = (id: number): boolean => {
  const index = data.teams.findIndex(t => t.id === id);
  if (index === -1) return false;
  data.teams.splice(index, 1);
  if (currentMode === 'json') saveJsonFile(TEAMS_FILE, data.teams);
  return true;
};

// Users
export const getUsers = (): MockUser[] => data.users;
export const getUserById = (id: number): MockUser | undefined => data.users.find(u => u.id === id);
export const getUserByUsername = (username: string): MockUser | undefined => 
  data.users.find(u => u.username === username || u.email === username);
export const addUser = (user: Omit<MockUser, 'id' | 'created_at'>): MockUser => {
  const newUser: MockUser = {
    ...user,
    id: data.counters.userId++,
    created_at: new Date()
  };
  data.users.push(newUser);
  if (currentMode === 'json') {
    saveJsonFile(USERS_FILE, data.users);
    saveJsonFile(path.join(DATA_DIR, 'counters.json'), data.counters);
  }
  return newUser;
};
export const updateUser = (id: number, updates: Partial<MockUser>): MockUser | null => {
  const index = data.users.findIndex(u => u.id === id);
  if (index === -1) return null;
  data.users[index] = { ...data.users[index], ...updates };
  if (currentMode === 'json') saveJsonFile(USERS_FILE, data.users);
  return data.users[index];
};

// Challenges
export const getChallenges = (): MockChallenge[] => data.challenges;
export const getChallengeById = (id: number): MockChallenge | undefined => data.challenges.find(c => c.id === id);

// Scores
export const getScores = (): MockScore[] => data.scores;
export const addScore = (score: Omit<MockScore, 'id' | 'awarded_at'>): MockScore => {
  const newScore: MockScore = {
    ...score,
    id: data.counters.scoreId++,
    awarded_at: new Date()
  };
  data.scores.push(newScore);
  if (currentMode === 'json') {
    saveJsonFile(SCORES_FILE, data.scores);
    saveJsonFile(path.join(DATA_DIR, 'counters.json'), data.counters);
  }
  return newScore;
};

// Activity
export const getActivityLog = (): MockActivity[] => data.activityLog;
export const addActivity = (activity: Omit<MockActivity, 'id' | 'created_at'>): MockActivity => {
  const newActivity: MockActivity = {
    ...activity,
    id: data.counters.activityId++,
    created_at: new Date()
  };
  data.activityLog.push(newActivity);
  if (currentMode === 'json') {
    saveJsonFile(ACTIVITY_FILE, data.activityLog);
    saveJsonFile(path.join(DATA_DIR, 'counters.json'), data.counters);
  }
  return newActivity;
};

// Submissions
export const getSubmissions = (): MockSubmission[] => data.submissions;
export const addSubmission = (submission: Omit<MockSubmission, 'id' | 'submitted_at'>): MockSubmission => {
  const newSubmission: MockSubmission = {
    ...submission,
    id: data.counters.submissionId++,
    submitted_at: new Date()
  };
  data.submissions.push(newSubmission);
  if (currentMode === 'json') {
    saveJsonFile(SUBMISSIONS_FILE, data.submissions);
    saveJsonFile(path.join(DATA_DIR, 'counters.json'), data.counters);
  }
  return newSubmission;
};

// Utility: Calculate team score
export const calculateTeamScore = (teamId: number): number => {
  return data.scores
    .filter(s => s.team_id === teamId)
    .reduce((sum, s) => sum + s.points + s.bonus_points, 0);
};

// Get leaderboard
export const getLeaderboard = () => {
  return data.teams
    .map(team => ({
      ...team,
      total_score: calculateTeamScore(team.id),
      challenges_completed: data.scores.filter(s => s.team_id === team.id).length
    }))
    .sort((a, b) => b.total_score - a.total_score)
    .map((team, index) => ({ ...team, rank: index + 1 }));
};

// Export raw data access for advanced operations
export const getRawData = (): DataStore => data;
export const saveData = (): void => {
  if (currentMode === 'json') saveAllToJson();
};
