import axios from 'axios';
import { Team, Score, Challenge, Activity, Stats, ApiResponse, TeamFormData, ScoreFormData, User, AuthResponse, LoginCredentials, RegisterData, TeamMember, Submission, SubmissionFormData } from '../types';

// Dynamic API URL - supports devtunnels and localhost
const getApiBaseUrl = (): string => {
  // If env variable is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // If running on devtunnels, construct backend URL
  const hostname = window.location.hostname;
  if (hostname.includes('devtunnels.ms')) {
    // Replace any port number with backend port 3001
    // Handles: xxx-5173.euw.devtunnels.ms, xxx-9898.euw.devtunnels.ms, etc.
    const backendHost = hostname.replace(/-\d+\./, '-3001.');
    console.log('🔗 DevTunnel detected, Backend URL:', `https://${backendHost}/api`);
    return `https://${backendHost}/api`;
  }
  
  // Default localhost
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout for slow connections
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.warn('Request timeout - server may be slow');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },

  getMe: async (): Promise<{ user: User; team: Team | null }> => {
    const response = await api.get<ApiResponse<{ user: User; team: Team | null }>>('/auth/me');
    return response.data.data;
  },
};

// Users API (Admin)
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  create: async (data: RegisterData): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<User & { password?: string }>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Teams API
export const teamsApi = {
  getAll: async (): Promise<Team[]> => {
    const response = await api.get<ApiResponse<Team[]>>('/teams');
    return response.data.data;
  },

  getById: async (id: number): Promise<Team> => {
    const response = await api.get<ApiResponse<Team>>(`/teams/${id}`);
    return response.data.data;
  },

  create: async (data: TeamFormData): Promise<Team> => {
    const response = await api.post<ApiResponse<Team>>('/teams', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<TeamFormData>): Promise<Team> => {
    const response = await api.put<ApiResponse<Team>>(`/teams/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },

  // Team Members (for leaders)
  getMembers: async (teamId: number): Promise<TeamMember[]> => {
    const response = await api.get<ApiResponse<TeamMember[]>>(`/teams/${teamId}/members`);
    return response.data.data;
  },

  addMember: async (teamId: number, data: { username: string; email: string; password: string }): Promise<User> => {
    const response = await api.post<ApiResponse<User>>(`/teams/${teamId}/members`, data);
    return response.data.data;
  },

  removeMember: async (teamId: number, userId: number): Promise<void> => {
    await api.delete(`/teams/${teamId}/members/${userId}`);
  },
};

// Scores API
export const scoresApi = {
  getLeaderboard: async (): Promise<Team[]> => {
    const response = await api.get<ApiResponse<Team[]>>('/scores/leaderboard');
    return response.data.data;
  },

  getAll: async (): Promise<Score[]> => {
    const response = await api.get<ApiResponse<Score[]>>('/scores');
    return response.data.data;
  },

  add: async (data: ScoreFormData): Promise<Score> => {
    const response = await api.post<ApiResponse<Score>>('/scores', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<ScoreFormData>): Promise<Score> => {
    const response = await api.put<ApiResponse<Score>>(`/scores/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/scores/${id}`);
  },
};

// Challenges API
export const challengesApi = {
  getAll: async (): Promise<Challenge[]> => {
    const response = await api.get<ApiResponse<Challenge[]>>('/challenges');
    return response.data.data;
  },

  getById: async (id: number): Promise<Challenge> => {
    const response = await api.get<ApiResponse<Challenge>>(`/challenges/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<Challenge>): Promise<Challenge> => {
    const response = await api.post<ApiResponse<Challenge>>('/challenges', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<Challenge>): Promise<Challenge> => {
    const response = await api.put<ApiResponse<Challenge>>(`/challenges/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/challenges/${id}`);
  },
};

// Submissions API - For challenge solutions
export const submissionsApi = {
  getAll: async (filters?: { team_id?: number; challenge_id?: number }): Promise<Submission[]> => {
    const params = new URLSearchParams();
    if (filters?.team_id) params.append('team_id', filters.team_id.toString());
    if (filters?.challenge_id) params.append('challenge_id', filters.challenge_id.toString());
    
    const response = await api.get<ApiResponse<Submission[]>>(`/submissions?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: number): Promise<Submission> => {
    const response = await api.get<ApiResponse<Submission>>(`/submissions/${id}`);
    return response.data.data;
  },

  create: async (data: SubmissionFormData): Promise<Submission> => {
    const response = await api.post<ApiResponse<Submission>>('/submissions', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<Submission>): Promise<Submission> => {
    const response = await api.put<ApiResponse<Submission>>(`/submissions/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/submissions/${id}`);
  },

  // Admin actions
  approve: async (id: number, feedback?: string): Promise<Submission> => {
    const response = await api.put<ApiResponse<Submission>>(`/submissions/${id}`, { 
      status: 'approved', 
      feedback 
    });
    return response.data.data;
  },

  reject: async (id: number, feedback?: string): Promise<Submission> => {
    const response = await api.put<ApiResponse<Submission>>(`/submissions/${id}`, { 
      status: 'rejected', 
      feedback 
    });
    return response.data.data;
  },
};

// Activity API
export const activityApi = {
  getRecent: async (limit: number = 20): Promise<Activity[]> => {
    const response = await api.get<ApiResponse<Activity[]>>(`/activity?limit=${limit}`);
    return response.data.data;
  },

  getStats: async (): Promise<Stats> => {
    const response = await api.get<ApiResponse<Stats>>('/activity/stats');
    return response.data.data;
  },
};

export default api;
