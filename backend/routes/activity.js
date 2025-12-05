const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET recent activity
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const [activities] = await pool.query(`
      SELECT 
        a.*,
        t.name as team_name,
        t.color as team_color
      FROM activity_log a
      LEFT JOIN teams t ON a.team_id = t.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `, [limit]);
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
});

// GET statistics
router.get('/stats', async (req, res) => {
  try {
    const [teamCount] = await pool.query('SELECT COUNT(*) as count FROM teams');
    const [challengeCount] = await pool.query('SELECT COUNT(*) as count FROM challenges');
    const [totalPoints] = await pool.query('SELECT COALESCE(SUM(points + bonus_points), 0) as total FROM scores');
    const [avgScore] = await pool.query(`
      SELECT AVG(team_total) as average FROM (
        SELECT COALESCE(SUM(s.points + s.bonus_points), 0) as team_total
        FROM teams t
        LEFT JOIN scores s ON t.id = s.team_id
        GROUP BY t.id
      ) as team_scores
    `);
    
    // Get top performer
    const [topTeam] = await pool.query(`
      SELECT 
        t.name,
        t.color,
        COALESCE(SUM(s.points + s.bonus_points), 0) as total_score
      FROM teams t
      LEFT JOIN scores s ON t.id = s.team_id
      GROUP BY t.id
      ORDER BY total_score DESC
      LIMIT 1
    `);
    
    res.json({
      success: true,
      data: {
        total_teams: teamCount[0].count,
        total_challenges: challengeCount[0].count,
        total_points_awarded: totalPoints[0].total,
        average_team_score: Math.round(avgScore[0].average || 0),
        top_team: topTeam[0] || null
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

module.exports = router;
