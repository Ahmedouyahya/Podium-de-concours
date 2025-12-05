const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { testConnection, initializeDatabase, seedSampleData } = require('./config/database');

// Import routes
const teamsRoutes = require('./routes/teams');
const scoresRoutes = require('./routes/scores');
const challengesRoutes = require('./routes/challenges');
const activityRoutes = require('./routes/activity');

const app = express();
const server = http.createServer(app);

// Socket.io configuration for real-time updates
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/teams', teamsRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/activity', activityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Podium de Concours API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Podium de Concours API',
    description: 'Backend API for competition leaderboard management',
    version: '1.0.0',
    endpoints: {
      teams: '/api/teams',
      scores: '/api/scores',
      leaderboard: '/api/scores/leaderboard',
      challenges: '/api/challenges',
      activity: '/api/activity',
      stats: '/api/activity/stats',
      health: '/api/health'
    }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Join leaderboard room for real-time updates
  socket.on('join-leaderboard', () => {
    socket.join('leaderboard');
    console.log(`👥 ${socket.id} joined leaderboard room`);
  });
  
  // Handle score updates and broadcast to all clients
  socket.on('score-updated', (data) => {
    io.to('leaderboard').emit('leaderboard-update', data);
    console.log('📊 Leaderboard update broadcast');
  });
  
  // Handle new team notifications
  socket.on('team-created', (data) => {
    io.to('leaderboard').emit('new-team', data);
    console.log('🆕 New team notification broadcast');
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Initialize database tables
    await initializeDatabase();
    
    // Seed sample data
    await seedSampleData();
    
    server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏆 PODIUM DE CONCOURS - Backend API                    ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                           ║
║   🌐 API Endpoints:                                       ║
║   • Teams:       /api/teams                               ║
║   • Scores:      /api/scores                              ║
║   • Leaderboard: /api/scores/leaderboard                  ║
║   • Challenges:  /api/challenges                          ║
║   • Activity:    /api/activity                            ║
║   • Stats:       /api/activity/stats                      ║
║                                                           ║
║   📡 WebSocket: Real-time updates enabled                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
