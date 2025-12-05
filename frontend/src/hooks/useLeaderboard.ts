import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Team } from '../types';
import { scoresApi } from '../services/api';

// Dynamic Socket URL - supports devtunnels and localhost
const getSocketUrl = (): string => {
  // If env variable is set, use it
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // If running on devtunnels, construct backend URL
  const hostname = window.location.hostname;
  if (hostname.includes('devtunnels.ms')) {
    // Replace frontend port with backend port in devtunnels URL
    const backendHost = hostname.replace(/-\d+\./, '-3001.');
    return `https://${backendHost}`;
  }
  
  // Default localhost
  return 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

export const useLeaderboard = (refreshInterval: number = 30000) => {
  const [leaderboard, setLeaderboard] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await scoresApi.getLeaderboard();
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch leaderboard');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchLeaderboard();

    const interval = setInterval(fetchLeaderboard, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchLeaderboard, refreshInterval]);

  // Socket connection for real-time updates
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to WebSocket');
      newSocket.emit('join-leaderboard');
    });

    newSocket.on('leaderboard-update', () => {
      console.log('📊 Leaderboard update received');
      fetchLeaderboard();
    });

    newSocket.on('new-team', () => {
      console.log('🆕 New team joined');
      fetchLeaderboard();
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [fetchLeaderboard]);

  const emitScoreUpdate = useCallback(() => {
    if (socket) {
      socket.emit('score-updated', { timestamp: new Date().toISOString() });
    }
  }, [socket]);

  const emitTeamCreated = useCallback(() => {
    if (socket) {
      socket.emit('team-created', { timestamp: new Date().toISOString() });
    }
  }, [socket]);

  return {
    leaderboard,
    loading,
    error,
    refresh: fetchLeaderboard,
    emitScoreUpdate,
    emitTeamCreated,
  };
};

export default useLeaderboard;
