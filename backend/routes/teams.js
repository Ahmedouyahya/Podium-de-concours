const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all teams with their total scores
router.get('/', async (req, res) => {
  try {
    const [teams] = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.avatar,
        t.color,
        t.members,
        t.created_at,
        COALESCE(SUM(s.points + s.bonus_points), 0) as total_score,
        COUNT(DISTINCT s.challenge_id) as challenges_completed
      FROM teams t
      LEFT JOIN scores s ON t.id = s.team_id
      GROUP BY t.id
      ORDER BY total_score DESC
    `);
    
    res.json({
      success: true,
      data: teams,
      count: teams.length
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teams' });
  }
});

// GET single team by ID with detailed scores
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [teams] = await pool.query(`
      SELECT 
        t.*,
        COALESCE(SUM(s.points + s.bonus_points), 0) as total_score
      FROM teams t
      LEFT JOIN scores s ON t.id = s.team_id
      WHERE t.id = ?
      GROUP BY t.id
    `, [id]);
    
    if (teams.length === 0) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Get team's score breakdown
    const [scores] = await pool.query(`
      SELECT 
        s.*,
        c.name as challenge_name,
        c.category,
        c.difficulty
      FROM scores s
      LEFT JOIN challenges c ON s.challenge_id = c.id
      WHERE s.team_id = ?
      ORDER BY s.awarded_at DESC
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...teams[0],
        score_breakdown: scores
      }
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch team' });
  }
});

// POST create new team
router.post('/', async (req, res) => {
  try {
    const { name, color, members, avatar } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Team name is required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO teams (name, color, members, avatar) VALUES (?, ?, ?, ?)',
      [name.trim(), color || '#6366f1', members || 1, avatar || null]
    );
    
    // Log activity
    await pool.query(
      'INSERT INTO activity_log (team_id, action_type, description) VALUES (?, ?, ?)',
      [result.insertId, 'team_created', `L'équipe "${name}" a rejoint la compétition!`]
    );
    
    const [newTeam] = await pool.query('SELECT * FROM teams WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: { ...newTeam[0], total_score: 0 }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Team name already exists' });
    }
    console.error('Error creating team:', error);
    res.status(500).json({ success: false, message: 'Failed to create team' });
  }
});

// PUT update team
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, members, avatar } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM teams WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    await pool.query(
      'UPDATE teams SET name = ?, color = ?, members = ?, avatar = ? WHERE id = ?',
      [name || existing[0].name, color || existing[0].color, members || existing[0].members, avatar, id]
    );
    
    const [updated] = await pool.query(`
      SELECT 
        t.*,
        COALESCE(SUM(s.points + s.bonus_points), 0) as total_score
      FROM teams t
      LEFT JOIN scores s ON t.id = s.team_id
      WHERE t.id = ?
      GROUP BY t.id
    `, [id]);
    
    res.json({
      success: true,
      message: 'Team updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ success: false, message: 'Failed to update team' });
  }
});

// DELETE team
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await pool.query('SELECT * FROM teams WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    await pool.query('DELETE FROM teams WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ success: false, message: 'Failed to delete team' });
  }
});

module.exports = router;
