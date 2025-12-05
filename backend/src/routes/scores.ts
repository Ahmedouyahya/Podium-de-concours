import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { ScoreRow, LeaderboardRow, AddScoreRequest, QueryResult } from '../types';

const router: Router = Router();

// GET /api/scores - Récupérer tous les scores
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const [scores] = await pool.execute<ScoreRow[]>(`
      SELECT 
        s.*,
        t.name as team_name,
        t.color as team_color,
        c.name as challenge_name
      FROM scores s
      JOIN teams t ON s.team_id = t.id
      JOIN challenges c ON s.challenge_id = c.id
      ORDER BY s.awarded_at DESC
    `);
    res.json({ success: true, data: scores });
  } catch (error) {
    console.error('Erreur GET /scores:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// GET /api/scores/leaderboard - Classement général
router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const [leaderboard] = await pool.execute<LeaderboardRow[]>(`
      SELECT 
        t.id,
        t.name,
        t.color,
        t.avatar,
        t.members_count,
        COALESCE(SUM(s.points), 0) as total_score,
        COUNT(DISTINCT s.challenge_id) as challenges_completed
      FROM teams t
      LEFT JOIN scores s ON t.id = s.team_id
      GROUP BY t.id
      ORDER BY total_score DESC, challenges_completed DESC
    `);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Erreur GET /scores/leaderboard:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// GET /api/scores/team/:teamId - Scores d'une équipe
router.get('/team/:teamId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const [scores] = await pool.execute<ScoreRow[]>(`
      SELECT 
        s.*,
        c.name as challenge_name,
        c.max_points
      FROM scores s
      JOIN challenges c ON s.challenge_id = c.id
      WHERE s.team_id = ?
      ORDER BY s.awarded_at DESC
    `, [teamId]);
    res.json({ success: true, data: scores });
  } catch (error) {
    console.error('Erreur GET /scores/team/:teamId:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// POST /api/scores - Ajouter un score
router.post('/', async (req: Request<{}, {}, AddScoreRequest>, res: Response): Promise<void> => {
  try {
    const { team_id, challenge_id, points } = req.body;

    if (!team_id || !challenge_id || points === undefined) {
      res.status(400).json({ 
        success: false, 
        error: 'team_id, challenge_id et points sont requis' 
      });
      return;
    }

    const [result] = await pool.execute<QueryResult>(
      'INSERT INTO scores (team_id, challenge_id, points) VALUES (?, ?, ?)',
      [team_id, challenge_id, points]
    );

    // Log de l'activité
    await pool.execute(
      'INSERT INTO activity_log (team_id, action, details) VALUES (?, ?, ?)',
      [team_id, 'score_added', `+${points} points pour le défi #${challenge_id}`]
    );

    // Récupérer le score créé
    const [newScore] = await pool.execute<ScoreRow[]>(`
      SELECT 
        s.*,
        t.name as team_name,
        c.name as challenge_name
      FROM scores s
      JOIN teams t ON s.team_id = t.id
      JOIN challenges c ON s.challenge_id = c.id
      WHERE s.id = ?
    `, [result.insertId]);

    res.status(201).json({ success: true, data: newScore[0] });
  } catch (error) {
    console.error('Erreur POST /scores:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT /api/scores/:id - Mettre à jour un score
router.put('/:id', async (req: Request<{ id: string }, {}, { points: number }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { points } = req.body;

    if (points === undefined) {
      res.status(400).json({ success: false, error: 'points est requis' });
      return;
    }

    const [result] = await pool.execute<QueryResult>(
      'UPDATE scores SET points = ? WHERE id = ?',
      [points, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, error: 'Score non trouvé' });
      return;
    }

    res.json({ success: true, message: 'Score mis à jour' });
  } catch (error) {
    console.error('Erreur PUT /scores/:id:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// DELETE /api/scores/:id - Supprimer un score
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute<QueryResult>(
      'DELETE FROM scores WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, error: 'Score non trouvé' });
      return;
    }

    res.json({ success: true, message: 'Score supprimé avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /scores/:id:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

export default router;
