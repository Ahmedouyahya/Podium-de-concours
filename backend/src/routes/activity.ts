import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { ActivityRow, StatsRow } from '../types';
import { RowDataPacket } from 'mysql2';

const router: Router = Router();

// GET /api/activity - Récupérer les dernières activités
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    
    const [activities] = await pool.execute<ActivityRow[]>(`
      SELECT 
        a.*,
        t.name as team_name,
        t.color as team_color
      FROM activity_log a
      LEFT JOIN teams t ON a.team_id = t.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `, [limit]);
    
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Erreur GET /activity:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// GET /api/activity/stats - Statistiques globales
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    // Nombre total d'équipes
    const [teamsResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM teams'
    );
    
    // Nombre total de défis
    const [challengesResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM challenges'
    );
    
    // Total des points attribués
    const [pointsResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COALESCE(SUM(points), 0) as total FROM scores'
    );
    
    // Équipes actives aujourd'hui
    const [activeResult] = await pool.execute<RowDataPacket[]>(`
      SELECT COUNT(DISTINCT team_id) as total 
      FROM activity_log 
      WHERE DATE(created_at) = CURDATE()
    `);

    const stats = {
      total_teams: teamsResult[0].total,
      total_challenges: challengesResult[0].total,
      total_points_awarded: pointsResult[0].total,
      active_today: activeResult[0].total
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Erreur GET /activity/stats:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// GET /api/activity/team/:teamId - Activités d'une équipe
router.get('/team/:teamId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const [activities] = await pool.execute<ActivityRow[]>(`
      SELECT * FROM activity_log 
      WHERE team_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [teamId, limit]);
    
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Erreur GET /activity/team/:teamId:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

export default router;
