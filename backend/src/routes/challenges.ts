import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { ChallengeRow, CreateChallengeRequest, UpdateChallengeRequest, QueryResult } from '../types';

const router: Router = Router();

// GET /api/challenges - Récupérer tous les défis
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const [challenges] = await pool.execute<ChallengeRow[]>(
      'SELECT * FROM challenges ORDER BY created_at DESC'
    );
    res.json({ success: true, data: challenges });
  } catch (error) {
    console.error('Erreur GET /challenges:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// GET /api/challenges/:id - Récupérer un défi par ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [challenges] = await pool.execute<ChallengeRow[]>(
      'SELECT * FROM challenges WHERE id = ?',
      [id]
    );

    if (challenges.length === 0) {
      res.status(404).json({ success: false, error: 'Défi non trouvé' });
      return;
    }

    res.json({ success: true, data: challenges[0] });
  } catch (error) {
    console.error('Erreur GET /challenges/:id:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// POST /api/challenges - Créer un nouveau défi
router.post('/', async (req: Request<{}, {}, CreateChallengeRequest>, res: Response): Promise<void> => {
  try {
    const { name, description = '', max_points = 100 } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: 'Le nom est requis' });
      return;
    }

    const [result] = await pool.execute<QueryResult>(
      'INSERT INTO challenges (name, description, max_points) VALUES (?, ?, ?)',
      [name, description, max_points]
    );

    // Log de l'activité
    await pool.execute(
      'INSERT INTO activity_log (action, details) VALUES (?, ?)',
      ['challenge_created', `Nouveau défi: ${name}`]
    );

    // Récupérer le défi créé
    const [newChallenge] = await pool.execute<ChallengeRow[]>(
      'SELECT * FROM challenges WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ success: true, data: newChallenge[0] });
  } catch (error) {
    console.error('Erreur POST /challenges:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT /api/challenges/:id - Mettre à jour un défi
router.put('/:id', async (req: Request<{ id: string }, {}, UpdateChallengeRequest>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, max_points } = req.body;

    // Construire la requête dynamiquement
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (max_points !== undefined) {
      updates.push('max_points = ?');
      values.push(max_points);
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'Aucune donnée à mettre à jour' });
      return;
    }

    values.push(parseInt(id));
    const [result] = await pool.execute<QueryResult>(
      `UPDATE challenges SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, error: 'Défi non trouvé' });
      return;
    }

    // Récupérer le défi mis à jour
    const [updatedChallenge] = await pool.execute<ChallengeRow[]>(
      'SELECT * FROM challenges WHERE id = ?',
      [id]
    );

    res.json({ success: true, data: updatedChallenge[0] });
  } catch (error) {
    console.error('Erreur PUT /challenges/:id:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// DELETE /api/challenges/:id - Supprimer un défi
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute<QueryResult>(
      'DELETE FROM challenges WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, error: 'Défi non trouvé' });
      return;
    }

    res.json({ success: true, message: 'Défi supprimé avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /challenges/:id:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

export default router;
