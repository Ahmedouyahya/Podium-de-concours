import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import pool, { testConnection, initializeDatabase, seedSampleData } from './config/database';
import teamsRoutes from './routes/teams';
import scoresRoutes from './routes/scores';
import challengesRoutes from './routes/challenges';
import activityRoutes from './routes/activity';
import { ServerToClientEvents, ClientToServerEvents } from './types';

// Configuration
dotenv.config();
const app: Application = express();
const httpServer = createServer(app);
const PORT: number = parseInt(process.env.PORT || '3001', 10);

// Socket.io avec CORS
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware pour ajouter io aux requêtes
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).io = io;
  next();
});

// Routes API
app.use('/api/teams', teamsRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/activity', activityRoutes);

// Route de santé
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'API Podium de Concours - Nuit de l\'Info 2025',
    timestamp: new Date().toISOString()
  });
});

// Route racine
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Podium de Concours API',
    version: '1.0.0',
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

// Gestion des erreurs 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
});

// Socket.io événements
io.on('connection', (socket) => {
  console.log(`🔌 Client connecté: ${socket.id}`);

  socket.on('join_leaderboard', () => {
    socket.join('leaderboard');
    console.log(`📊 ${socket.id} a rejoint le leaderboard`);
  });

  socket.on('leave_leaderboard', () => {
    socket.leave('leaderboard');
    console.log(`📊 ${socket.id} a quitté le leaderboard`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client déconnecté: ${socket.id}`);
  });
});

// Fonction pour émettre les mises à jour du leaderboard
export const emitLeaderboardUpdate = (): void => {
  io.to('leaderboard').emit('leaderboard_updated');
};

// Démarrage du serveur
const startServer = async (): Promise<void> => {
  try {
    // Test de connexion à la base de données
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Impossible de se connecter à MySQL. Vérifiez votre configuration.');
      process.exit(1);
    }

    // Initialisation de la base de données
    await initializeDatabase();
    
    // Seeding des données d'exemple (si la base est vide)
    await seedSampleData();

    // Démarrage du serveur HTTP
    httpServer.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🏆 PODIUM DE CONCOURS - NUIT DE L'INFO 2025 🏆           ║
║                                                            ║
║   Serveur TypeScript démarré avec succès!                  ║
║                                                            ║
║   📡 API:      http://localhost:${PORT}                      ║
║   🔌 Socket:   http://localhost:${PORT}                      ║
║                                                            ║
║   Endpoints disponibles:                                   ║
║   • GET  /api/teams          - Liste des équipes           ║
║   • GET  /api/scores/leaderboard - Classement              ║
║   • GET  /api/challenges     - Liste des défis             ║
║   • GET  /api/activity/stats - Statistiques                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await pool.end();
  process.exit(0);
});

// Démarrer le serveur
startServer();

export { io };
