const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all challenges
router.get('/', async (req, res) => {
  try {
    const [challenges] = await pool.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT s.team_id) as teams_completed
      FROM challenges c
      LEFT JOIN scores s ON c.id = s.challenge_id
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `);
    
    res.json({
      success: true,
      data: challenges
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch challenges' });
  }
});

// GET single challenge
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [challenges] = await pool.query('SELECT * FROM challenges WHERE id = ?', [id]);
    
    if (challenges.length === 0) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    
    // Get teams that completed this challenge
    const [completedBy] = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.color,
        s.points,
        s.bonus_points,
        s.awarded_at
      FROM scores s
      JOIN teams t ON s.team_id = t.id
      WHERE s.challenge_id = ?
      ORDER BY (s.points + s.bonus_points) DESC
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...challenges[0],
        completed_by: completedBy
      }
    });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch challenge' });
  }
});

// POST create challenge
router.post('/', async (req, res) => {
  try {
    const { name, description, max_points, difficulty, category } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Challenge name is required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO challenges (name, description, max_points, difficulty, category) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), description || '', max_points || 100, difficulty || 'medium', category || 'general']
    );
    
    const [newChallenge] = await pool.query('SELECT * FROM challenges WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Challenge created successfully',
      data: newChallenge[0]
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ success: false, message: 'Failed to create challenge' });
  }
});

// PUT update challenge
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, max_points, difficulty, category } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM challenges WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    
    await pool.query(
      'UPDATE challenges SET name = ?, description = ?, max_points = ?, difficulty = ?, category = ? WHERE id = ?',
      [
        name || existing[0].name,
        description ?? existing[0].description,
        max_points ?? existing[0].max_points,
        difficulty || existing[0].difficulty,
        category || existing[0].category,
        id
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM challenges WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Challenge updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(500).json({ success: false, message: 'Failed to update challenge' });
  }
});

// DELETE challenge
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await pool.query('SELECT * FROM challenges WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    
    await pool.query('DELETE FROM challenges WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Challenge deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({ success: false, message: 'Failed to delete challenge' });
  }
});

module.exports = router;
