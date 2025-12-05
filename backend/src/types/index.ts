// Types pour le backend Podium de Concours
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ==================== Database Types ====================

export interface TeamRow extends RowDataPacket {
  id: number;
  name: string;
  color: string;
  avatar: string;
  members_count: number;
  created_at: Date;
  total_score?: number;
}

export interface ChallengeRow extends RowDataPacket {
  id: number;
  name: string;
  description: string;
  max_points: number;
  created_at: Date;
}

export interface ScoreRow extends RowDataPacket {
  id: number;
  team_id: number;
  challenge_id: number;
  points: number;
  awarded_at: Date;
  team_name?: string;
  team_color?: string;
  challenge_name?: string;
}

export interface ActivityRow extends RowDataPacket {
  id: number;
  team_id: number | null;
  action: string;
  details: string | null;
  created_at: Date;
  team_name?: string;
  team_color?: string;
}

export interface LeaderboardRow extends RowDataPacket {
  id: number;
  name: string;
  color: string;
  avatar: string;
  members_count: number;
  total_score: number;
  challenges_completed: number;
}

export interface StatsRow extends RowDataPacket {
  total_teams: number;
  total_challenges: number;
  total_points_awarded: number;
  active_today: number;
}

// ==================== API Request/Response Types ====================

export interface CreateTeamRequest {
  name: string;
  color?: string;
  avatar?: string;
  members_count?: number;
}

export interface UpdateTeamRequest {
  name?: string;
  color?: string;
  avatar?: string;
  members_count?: number;
}

export interface CreateChallengeRequest {
  name: string;
  description?: string;
  max_points?: number;
}

export interface UpdateChallengeRequest {
  name?: string;
  description?: string;
  max_points?: number;
}

export interface AddScoreRequest {
  team_id: number;
  challenge_id: number;
  points: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ==================== Socket.io Types ====================

export interface ServerToClientEvents {
  leaderboard_updated: () => void;
  team_scored: (data: { team_id: number; points: number; challenge_id: number }) => void;
  new_team: (data: { team_id: number; team_name: string }) => void;
}

export interface ClientToServerEvents {
  join_leaderboard: () => void;
  leave_leaderboard: () => void;
}

// ==================== Express Types ====================

export type QueryResult = ResultSetHeader;
