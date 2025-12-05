// User Types
export type UserRole = 'admin' | 'leader' | 'participant';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  team_id: number | null;
  avatar: string | null;
  created_at: string;
  team_name?: string;
  team_color?: string;
  is_leader?: boolean;
}

export interface AuthResponse {
  user: User;
  team: Team | null;
  token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  team_id?: number | null;
}

// Team Types
export interface Team {
  id: number;
  name: string;
  avatar: string | null;
  color: string;
  members: number;
  leader_id: number | null;
  total_score: number;
  challenges_completed: number;
  created_at: string;
  updated_at?: string;
  rank?: number;
  trend?: 'up' | 'down' | 'stable';
  base_points?: number;
  bonus_points?: number;
  last_score_update?: string;
}

export interface TeamFormData {
  name: string;
  color: string;
  members: number;
  avatar?: string;
}

export interface TeamMember {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  is_leader: boolean;
  created_at: string;
}

// Score Types
export interface Score {
  id: number;
  team_id: number;
  challenge_id: number | null;
  points: number;
  bonus_points: number;
  comment: string | null;
  awarded_at: string;
  team_name?: string;
  team_color?: string;
  challenge_name?: string;
  category?: string;
  difficulty?: string;
}

export interface ScoreFormData {
  team_id: number;
  challenge_id?: number;
  points: number;
  bonus_points?: number;
  comment?: string;
}

// Challenge Types
export interface Challenge {
  id: number;
  name: string;
  description: string;
  max_points: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: string;
  created_at: string;
  teams_completed?: number;
}

// Submission Types - Users submit solutions for challenges
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Submission {
  id: number;
  user_id: number;
  team_id: number;
  challenge_id: number;
  title: string;
  description: string;
  code_url: string | null;
  demo_url: string | null;
  status: SubmissionStatus;
  feedback: string | null;
  submitted_at: string;
  // Populated fields
  user_name?: string;
  team_name?: string;
  team_color?: string;
  challenge_name?: string;
  challenge_difficulty?: string;
  challenge_max_points?: number;
}

export interface SubmissionFormData {
  user_id: number;
  team_id: number;
  challenge_id: number;
  title: string;
  description?: string;
  code_url?: string;
  demo_url?: string;
}

// Activity Types
export interface Activity {
  id: number;
  team_id: number;
  action_type: 'score_added' | 'team_created' | 'challenge_completed' | 'bonus_awarded' | 'submission' | 'submission_approved' | 'member_joined';
  description: string;
  points_change: number;
  created_at: string;
  team_name?: string;
  team_color?: string;
}

// Stats Types
export interface Stats {
  total_teams: number;
  total_challenges: number;
  total_points_awarded: number;
  average_team_score: number;
  top_team: {
    name: string;
    color: string;
    total_score: number;
  } | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  timestamp?: string;
}
