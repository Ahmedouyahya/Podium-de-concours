import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { TeamRow, CreateTeamRequest, UpdateTeamRequest, QueryResult } from '../types';
import { RowDataPacket } from 'mysql2';

const router: Router = Router();

// GET /api/teams - Récupérer toutes les équipes avec leurs scores
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const [teams] = await pool.execute<TeamRow[]>(`
      SELECT 
        t.*,
        COALESCE(SUM(s.points), 0) as total_score
      FROM teams t
      LEFT JOIN scores s ON t.id = s.team_id
      GROUP BY t.id
      ORDER BY total_score DESC
    `);
    res.json({ success: true, data: teams });
  } catch (error) {
    console.error('Erreur GET /teams:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// GET /api/teams/:id - Récupérer une équipe par ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [teams] = await pool.execute<TeamRow[]>(`
      SELECT 
        t.*,
        COALESCE(SUM(s.points), 0) as total_score
      FROM teams t
      LEFT JOIN scores s ON t.id = s.team_id
      WHERE t.id = ?
      GROUP BY t.id
    `, [id]);

    if (teams.length === 0) {
      res.status(404).json({ success: false, error: 'Équipe non trouvée' });
      return;
    }

    res.json({ success: true, data: teams[0] });
  } catch (error) {
    console.error('Erreur GET /teams/:id:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// POST /api/teams - Créer une nouvelle équipe
router.post('/', async (req: Request<{}, {}, CreateTeamRequest>, res: Response): Promise<void> => {
  try {
    const { name, color = '#3B82F6', avatar = '🏆', members_count = 1 } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: 'Le nom est requis' });
      return;
    }

    const [result] = await pool.execute<QueryResult>(
      'INSERT INTO teams (name, color, avatar, members_count) VALUES (?, ?, ?, ?)',
      [name, color, avatar, members_count]
    );

    // Log de l'activité
    await pool.execute(
      'INSERT INTO activity_log (team_id, action, details) VALUES (?, ?, ?)',
      [result.insertId, 'team_created', `Nouvelle équipe: ${name}`]
    );

    // Récupérer l'équipe créée
    const [newTeam] = await pool.execute<TeamRow[]>(
      'SELECT * FROM teams WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ success: true, data: newTeam[0] });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, error: 'Ce nom d\'équipe existe déjà' });
      return;
    }
    console.error('Erreur POST /teams:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT /api/teams/:id - Mettre à jour une équipe
router.put('/:id', async (req: Request<{ id: string }, {}, UpdateTeamRequest>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, color, avatar, members_count } = req.body;

    // Construire la requête dynamiquement
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }
    if (members_count !== undefined) {
      updates.push('members_count = ?');
      values.push(members_count);
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'Aucune donnée à mettre à jour' });
      return;
    }

    values.push(parseInt(id));
    await pool.execute(
      `UPDATE teams SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Récupérer l'équipe mise à jour
    const [updatedTeam] = await pool.execute<TeamRow[]>(
      'SELECT * FROM teams WHERE id = ?',
      [id]
    );

    if (updatedTeam.length === 0) {
      res.status(404).json({ success: false, error: 'Équipe non trouvée' });
      return;
    }

    res.json({ success: true, data: updatedTeam[0] });
  } catch (error) {
    console.error('Erreur PUT /teams/:id:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// DELETE /api/teams/:id - Supprimer une équipe
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute<QueryResult>(
      'DELETE FROM teams WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, error: 'Équipe non trouvée' });
      return;
    }

    res.json({ success: true, message: 'Équipe supprimée avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /teams/:id:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

export default router;
