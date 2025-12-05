const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all scores with leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const [leaderboard] = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.avatar,
        t.color,
        t.members,
        COALESCE(SUM(s.points), 0) as base_points,
        COALESCE(SUM(s.bonus_points), 0) as bonus_points,
        COALESCE(SUM(s.points + s.bonus_points), 0) as total_score,
        COUNT(DISTINCT s.challenge_id) as challenges_completed,
        MAX(s.awarded_at) as last_score_update
      FROM teams t
      LEFT JOIN scores s ON t.id = s.team_id
      GROUP BY t.id
      ORDER BY total_score DESC, last_score_update ASC
    `);
    
    // Add rank to each team
    const rankedLeaderboard = leaderboard.map((team, index) => ({
      ...team,
      rank: index + 1,
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable' // Simulated trend
    }));
    
    res.json({
      success: true,
      data: rankedLeaderboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
});

// GET all scores
router.get('/', async (req, res) => {
  try {
    const [scores] = await pool.query(`
      SELECT 
        s.*,
        t.name as team_name,
        t.color as team_color,
        c.name as challenge_name,
        c.category,
        c.difficulty
      FROM scores s
      LEFT JOIN teams t ON s.team_id = t.id
      LEFT JOIN challenges c ON s.challenge_id = c.id
      ORDER BY s.awarded_at DESC
    `);
    
    res.json({
      success: true,
      data: scores
    });
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch scores' });
  }
});

// POST add score to team
router.post('/', async (req, res) => {
  try {
    const { team_id, challenge_id, points, bonus_points, comment } = req.body;
    
    if (!team_id || points === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'team_id and points are required' 
      });
    }
    
    // Verify team exists
    const [team] = await pool.query('SELECT * FROM teams WHERE id = ?', [team_id]);
    if (team.length === 0) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO scores (team_id, challenge_id, points, bonus_points, comment) VALUES (?, ?, ?, ?, ?)',
      [team_id, challenge_id || null, points, bonus_points || 0, comment || null]
    );
    
    // Log activity
    const totalPoints = points + (bonus_points || 0);
    await pool.query(
      'INSERT INTO activity_log (team_id, action_type, description, points_change) VALUES (?, ?, ?, ?)',
      [team_id, 'score_added', `${team[0].name} a gagné ${totalPoints} points!`, totalPoints]
    );
    
    const [newScore] = await pool.query(`
      SELECT 
        s.*,
        t.name as team_name,
        c.name as challenge_name
      FROM scores s
      LEFT JOIN teams t ON s.team_id = t.id
      LEFT JOIN challenges c ON s.challenge_id = c.id
      WHERE s.id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Score added successfully',
      data: newScore[0]
    });
  } catch (error) {
    console.error('Error adding score:', error);
    res.status(500).json({ success: false, message: 'Failed to add score' });
  }
});

// PUT update score
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { points, bonus_points, comment } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM scores WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Score not found' });
    }
    
    await pool.query(
      'UPDATE scores SET points = ?, bonus_points = ?, comment = ? WHERE id = ?',
      [points ?? existing[0].points, bonus_points ?? existing[0].bonus_points, comment, id]
    );
    
    const [updated] = await pool.query('SELECT * FROM scores WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Score updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ success: false, message: 'Failed to update score' });
  }
});

// DELETE score
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await pool.query('SELECT * FROM scores WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Score not found' });
    }
    
    await pool.query('DELETE FROM scores WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Score deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting score:', error);
    res.status(500).json({ success: false, message: 'Failed to delete score' });
  }
});

module.exports = router;
