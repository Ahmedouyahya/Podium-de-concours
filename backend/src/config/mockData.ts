// Mock Data - Données en mémoire (pas besoin de MySQL)

// ==================== USER TYPES ====================

export type UserRole = 'admin' | 'leader' | 'participant';

export interface MockUser {
  id: number;
  username: string;
  email: string;
  password: string; // In real app, this would be hashed
  role: UserRole;
  team_id: number | null;
  avatar: string | null;
  created_at: Date;
}

export interface MockTeam {
  id: number;
  name: string;
  color: string;
  avatar: string | null;
  members: number;
  leader_id: number | null;
  created_at: Date;
}

export interface MockChallenge {
  id: number;
  name: string;
  description: string;
  max_points: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: string;
  created_at: Date;
}

export interface MockScore {
  id: number;
  team_id: number;
  challenge_id: number | null;
  points: number;
  bonus_points: number;
  comment: string | null;
  awarded_at: Date;
}

export interface MockActivity {
  id: number;
  team_id: number | null;
  action_type: string;
  description: string;
  points_change: number;
  created_at: Date;
}

// NEW: Submissions - Users can submit solutions to challenges
export interface MockSubmission {
  id: number;
  user_id: number;
  team_id: number;
  challenge_id: number;
  title: string;
  description: string;
  code_url: string | null;  // GitHub link or similar
  demo_url: string | null;  // Demo link
  status: 'pending' | 'approved' | 'rejected';
  feedback: string | null;
  submitted_at: Date;
}

// Initial Teams - "Max" is the first team!
export const teams: MockTeam[] = [
  { id: 1, name: 'Max', color: '#6366f1', avatar: null, members: 4, leader_id: 2, created_at: new Date() },
  { id: 2, name: 'Byte Me', color: '#ec4899', avatar: null, members: 3, leader_id: 6, created_at: new Date() },
  { id: 3, name: 'Debug Dynasty', color: '#10b981', avatar: null, members: 5, leader_id: 9, created_at: new Date() },
  { id: 4, name: 'Syntax Errors', color: '#f59e0b', avatar: null, members: 4, leader_id: 12, created_at: new Date() },
  { id: 5, name: 'Infinite Loop', color: '#ef4444', avatar: null, members: 3, leader_id: 15, created_at: new Date() },
  { id: 6, name: 'Code Crusaders', color: '#8b5cf6', avatar: null, members: 4, leader_id: 18, created_at: new Date() },
  { id: 7, name: 'Binary Bandits', color: '#06b6d4', avatar: null, members: 5, leader_id: 21, created_at: new Date() },
  { id: 8, name: 'Pixel Pioneers', color: '#84cc16', avatar: null, members: 3, leader_id: 24, created_at: new Date() },
];

// Initial Users
export const users: MockUser[] = [
  // Admin - Full access to everything
  { id: 1, username: 'admin', email: 'admin@nuitinfo.fr', password: 'admin123', role: 'admin', team_id: null, avatar: null, created_at: new Date() },
  
  // Team 1 - Max (Your team!)
  { id: 2, username: 'max_leader', email: 'max@nuitinfo.fr', password: 'leader123', role: 'leader', team_id: 1, avatar: null, created_at: new Date() },
  { id: 3, username: 'ahmed', email: 'ahmed@max.fr', password: 'pass123', role: 'participant', team_id: 1, avatar: null, created_at: new Date() },
  { id: 4, username: 'sarah', email: 'sarah@max.fr', password: 'pass123', role: 'participant', team_id: 1, avatar: null, created_at: new Date() },
  { id: 5, username: 'youssef', email: 'youssef@max.fr', password: 'pass123', role: 'participant', team_id: 1, avatar: null, created_at: new Date() },
  
  // Team 2 - Byte Me
  { id: 6, username: 'david_leader', email: 'david@team2.fr', password: 'leader123', role: 'leader', team_id: 2, avatar: null, created_at: new Date() },
  { id: 7, username: 'emma', email: 'emma@team2.fr', password: 'pass123', role: 'participant', team_id: 2, avatar: null, created_at: new Date() },
  { id: 8, username: 'frank', email: 'frank@team2.fr', password: 'pass123', role: 'participant', team_id: 2, avatar: null, created_at: new Date() },
  
  // Team 3 - Debug Dynasty
  { id: 9, username: 'grace_leader', email: 'grace@team3.fr', password: 'leader123', role: 'leader', team_id: 3, avatar: null, created_at: new Date() },
  { id: 10, username: 'henry', email: 'henry@team3.fr', password: 'pass123', role: 'participant', team_id: 3, avatar: null, created_at: new Date() },
  { id: 11, username: 'iris', email: 'iris@team3.fr', password: 'pass123', role: 'participant', team_id: 3, avatar: null, created_at: new Date() },
  
  // Team 4 - Syntax Errors
  { id: 12, username: 'jack_leader', email: 'jack@team4.fr', password: 'leader123', role: 'leader', team_id: 4, avatar: null, created_at: new Date() },
  { id: 13, username: 'kate', email: 'kate@team4.fr', password: 'pass123', role: 'participant', team_id: 4, avatar: null, created_at: new Date() },
  { id: 14, username: 'leo', email: 'leo@team4.fr', password: 'pass123', role: 'participant', team_id: 4, avatar: null, created_at: new Date() },
  
  // Team 5 - Infinite Loop
  { id: 15, username: 'mia_leader', email: 'mia@team5.fr', password: 'leader123', role: 'leader', team_id: 5, avatar: null, created_at: new Date() },
  { id: 16, username: 'noah', email: 'noah@team5.fr', password: 'pass123', role: 'participant', team_id: 5, avatar: null, created_at: new Date() },
  { id: 17, username: 'olivia', email: 'olivia@team5.fr', password: 'pass123', role: 'participant', team_id: 5, avatar: null, created_at: new Date() },
  
  // Team 6 - Code Crusaders
  { id: 18, username: 'paul_leader', email: 'paul@team6.fr', password: 'leader123', role: 'leader', team_id: 6, avatar: null, created_at: new Date() },
  { id: 19, username: 'quinn', email: 'quinn@team6.fr', password: 'pass123', role: 'participant', team_id: 6, avatar: null, created_at: new Date() },
  { id: 20, username: 'rose', email: 'rose@team6.fr', password: 'pass123', role: 'participant', team_id: 6, avatar: null, created_at: new Date() },
  
  // Team 7 - Binary Bandits
  { id: 21, username: 'sam_leader', email: 'sam@team7.fr', password: 'leader123', role: 'leader', team_id: 7, avatar: null, created_at: new Date() },
  { id: 22, username: 'tina', email: 'tina@team7.fr', password: 'pass123', role: 'participant', team_id: 7, avatar: null, created_at: new Date() },
  { id: 23, username: 'uma', email: 'uma@team7.fr', password: 'pass123', role: 'participant', team_id: 7, avatar: null, created_at: new Date() },
  
  // Team 8 - Pixel Pioneers
  { id: 24, username: 'victor_leader', email: 'victor@team8.fr', password: 'leader123', role: 'leader', team_id: 8, avatar: null, created_at: new Date() },
  { id: 25, username: 'wendy', email: 'wendy@team8.fr', password: 'pass123', role: 'participant', team_id: 8, avatar: null, created_at: new Date() },
  { id: 26, username: 'xavier', email: 'xavier@team8.fr', password: 'pass123', role: 'participant', team_id: 8, avatar: null, created_at: new Date() },
];

// Initial Challenges
export const challenges: MockChallenge[] = [
  { id: 1, name: 'Défi Principal - Océans', description: 'Développement de la solution principale sur le thème des océans', max_points: 500, difficulty: 'expert', category: 'main', created_at: new Date() },
  { id: 2, name: 'Accessibilité WCAG', description: "Implémentation des normes d'accessibilité WCAG 2.1", max_points: 100, difficulty: 'medium', category: 'bonus', created_at: new Date() },
  { id: 3, name: 'UI/UX Design', description: "Qualité de l'interface utilisateur et expérience utilisateur", max_points: 150, difficulty: 'medium', category: 'design', created_at: new Date() },
  { id: 4, name: 'Performance', description: "Optimisation et rapidité de l'application", max_points: 100, difficulty: 'hard', category: 'technical', created_at: new Date() },
  { id: 5, name: 'Innovation', description: 'Créativité et originalité de la solution', max_points: 200, difficulty: 'hard', category: 'bonus', created_at: new Date() },
  { id: 6, name: 'Clean Code', description: 'Qualité du code et bonnes pratiques', max_points: 80, difficulty: 'medium', category: 'technical', created_at: new Date() },
  { id: 7, name: 'Documentation', description: 'Qualité de la documentation technique', max_points: 50, difficulty: 'easy', category: 'bonus', created_at: new Date() },
];

// Initial Scores
export const scores: MockScore[] = [
  { id: 1, team_id: 1, challenge_id: 1, points: 450, bonus_points: 25, comment: 'Excellente implémentation', awarded_at: new Date() },
  { id: 2, team_id: 1, challenge_id: 2, points: 85, bonus_points: 10, comment: 'Bonne accessibilité', awarded_at: new Date() },
  { id: 3, team_id: 2, challenge_id: 1, points: 420, bonus_points: 30, comment: 'Solution créative', awarded_at: new Date() },
  { id: 4, team_id: 2, challenge_id: 3, points: 130, bonus_points: 15, comment: 'Design moderne', awarded_at: new Date() },
  { id: 5, team_id: 3, challenge_id: 1, points: 480, bonus_points: 20, comment: 'Très bon travail', awarded_at: new Date() },
  { id: 6, team_id: 3, challenge_id: 4, points: 90, bonus_points: 5, comment: 'Performance optimisée', awarded_at: new Date() },
  { id: 7, team_id: 4, challenge_id: 1, points: 380, bonus_points: 15, comment: 'Bon effort', awarded_at: new Date() },
  { id: 8, team_id: 5, challenge_id: 1, points: 350, bonus_points: 20, comment: 'Solution fonctionnelle', awarded_at: new Date() },
  { id: 9, team_id: 6, challenge_id: 1, points: 400, bonus_points: 10, comment: 'Travail solide', awarded_at: new Date() },
  { id: 10, team_id: 6, challenge_id: 5, points: 180, bonus_points: 20, comment: 'Très innovant', awarded_at: new Date() },
  { id: 11, team_id: 7, challenge_id: 1, points: 320, bonus_points: 25, comment: 'Bonne base', awarded_at: new Date() },
  { id: 12, team_id: 8, challenge_id: 1, points: 280, bonus_points: 15, comment: 'Première participation', awarded_at: new Date() },
];

// Initial Activity
export const activityLog: MockActivity[] = [
  { id: 1, team_id: 1, action_type: 'team_created', description: 'L\'équipe "Max" a rejoint la compétition!', points_change: 0, created_at: new Date(Date.now() - 3600000) },
  { id: 2, team_id: 2, action_type: 'team_created', description: 'L\'équipe "Byte Me" a rejoint la compétition!', points_change: 0, created_at: new Date(Date.now() - 3000000) },
  { id: 3, team_id: 3, action_type: 'team_created', description: 'L\'équipe "Debug Dynasty" a rejoint la compétition!', points_change: 0, created_at: new Date(Date.now() - 2400000) },
  { id: 4, team_id: 1, action_type: 'score_added', description: 'Max a gagné 475 points!', points_change: 475, created_at: new Date(Date.now() - 1800000) },
  { id: 5, team_id: 2, action_type: 'score_added', description: 'Byte Me a gagné 595 points!', points_change: 595, created_at: new Date(Date.now() - 1200000) },
  { id: 6, team_id: 3, action_type: 'score_added', description: 'Debug Dynasty a gagné 595 points!', points_change: 595, created_at: new Date(Date.now() - 600000) },
  { id: 7, team_id: 1, action_type: 'submission', description: 'ahmed a soumis une solution pour "Défi Principal"', points_change: 0, created_at: new Date(Date.now() - 300000) },
];

// Initial Submissions - Team members can submit solutions
export const submissions: MockSubmission[] = [
  { id: 1, user_id: 3, team_id: 1, challenge_id: 1, title: 'Solution Océan - Visualisation', description: 'Dashboard interactif pour la pollution des océans', code_url: 'https://github.com/max-team/ocean-viz', demo_url: 'https://max-ocean.vercel.app', status: 'approved', feedback: 'Excellent travail!', submitted_at: new Date(Date.now() - 7200000) },
  { id: 2, user_id: 4, team_id: 1, challenge_id: 2, title: 'Accessibilité WCAG', description: 'Implémentation des normes WCAG 2.1 AA', code_url: 'https://github.com/max-team/wcag', demo_url: null, status: 'approved', feedback: 'Bonne accessibilité', submitted_at: new Date(Date.now() - 5400000) },
  { id: 3, user_id: 5, team_id: 1, challenge_id: 3, title: 'Design UI/UX', description: 'Interface moderne et intuitive', code_url: null, demo_url: 'https://figma.com/max-design', status: 'pending', feedback: null, submitted_at: new Date(Date.now() - 3600000) },
  { id: 4, user_id: 7, team_id: 2, challenge_id: 1, title: 'Ocean Tracker', description: 'Suivi en temps réel des déchets océaniques', code_url: 'https://github.com/byte-me/ocean-tracker', demo_url: null, status: 'approved', feedback: 'Solution créative', submitted_at: new Date(Date.now() - 4800000) },
  { id: 5, user_id: 10, team_id: 3, challenge_id: 1, title: 'Sea Life Monitor', description: 'Surveillance de la vie marine', code_url: 'https://github.com/debug/sea-life', demo_url: 'https://sea-life.demo.com', status: 'approved', feedback: 'Très bon travail', submitted_at: new Date(Date.now() - 3000000) },
];

// Auto-increment IDs
let nextTeamId = 9;
let nextChallengeId = 8;
let nextScoreId = 13;
let nextActivityId = 8;
let nextUserId = 27;
let nextSubmissionId = 6;

export const getNextTeamId = () => nextTeamId++;
export const getNextChallengeId = () => nextChallengeId++;
export const getNextScoreId = () => nextScoreId++;
export const getNextActivityId = () => nextActivityId++;
export const getNextUserId = () => nextUserId++;
export const getNextSubmissionId = () => nextSubmissionId++;
