const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'podium_concours',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create teams table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        avatar VARCHAR(255) DEFAULT NULL,
        color VARCHAR(7) DEFAULT '#6366f1',
        members INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create challenges table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS challenges (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        max_points INT DEFAULT 100,
        difficulty ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
        category VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create scores table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id INT PRIMARY KEY AUTO_INCREMENT,
        team_id INT NOT NULL,
        challenge_id INT,
        points INT DEFAULT 0,
        bonus_points INT DEFAULT 0,
        comment VARCHAR(255),
        awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE SET NULL
      )
    `);
    
    // Create activity_log for real-time updates
    await connection.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INT PRIMARY KEY AUTO_INCREMENT,
        team_id INT,
        action_type ENUM('score_added', 'team_created', 'challenge_completed', 'bonus_awarded') NOT NULL,
        description TEXT,
        points_change INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Database tables initialized successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }
};

// Seed sample data
const seedSampleData = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Check if data already exists
    const [teams] = await connection.query('SELECT COUNT(*) as count FROM teams');
    if (teams[0].count > 0) {
      console.log('📊 Sample data already exists, skipping seed...');
      connection.release();
      return;
    }
    
    // Insert sample teams
    const sampleTeams = [
      { name: 'Les Codeurs Fous', color: '#6366f1', members: 4 },
      { name: 'Byte Me', color: '#ec4899', members: 3 },
      { name: 'Debug Dynasty', color: '#10b981', members: 5 },
      { name: 'Syntax Errors', color: '#f59e0b', members: 4 },
      { name: 'Infinite Loop', color: '#ef4444', members: 3 },
      { name: 'Code Crusaders', color: '#8b5cf6', members: 4 },
      { name: 'Binary Bandits', color: '#06b6d4', members: 5 },
      { name: 'Pixel Pioneers', color: '#84cc16', members: 3 }
    ];
    
    for (const team of sampleTeams) {
      await connection.query(
        'INSERT INTO teams (name, color, members) VALUES (?, ?, ?)',
        [team.name, team.color, team.members]
      );
    }
    
    // Insert sample challenges
    const sampleChallenges = [
      { name: 'Défi Principal - Océans', description: 'Développement de la solution principale', max_points: 500, difficulty: 'expert', category: 'main' },
      { name: 'Accessibilité WCAG', description: 'Implémentation des normes d\'accessibilité', max_points: 100, difficulty: 'medium', category: 'bonus' },
      { name: 'UI/UX Design', description: 'Qualité de l\'interface utilisateur', max_points: 150, difficulty: 'medium', category: 'design' },
      { name: 'Performance', description: 'Optimisation et rapidité', max_points: 100, difficulty: 'hard', category: 'technical' },
      { name: 'Innovation', description: 'Créativité et originalité', max_points: 200, difficulty: 'hard', category: 'bonus' }
    ];
    
    for (const challenge of sampleChallenges) {
      await connection.query(
        'INSERT INTO challenges (name, description, max_points, difficulty, category) VALUES (?, ?, ?, ?, ?)',
        [challenge.name, challenge.description, challenge.max_points, challenge.difficulty, challenge.category]
      );
    }
    
    // Add some sample scores
    const sampleScores = [
      { team_id: 1, challenge_id: 1, points: 450, bonus_points: 25 },
      { team_id: 1, challenge_id: 2, points: 85, bonus_points: 10 },
      { team_id: 2, challenge_id: 1, points: 420, bonus_points: 30 },
      { team_id: 2, challenge_id: 3, points: 130, bonus_points: 15 },
      { team_id: 3, challenge_id: 1, points: 480, bonus_points: 20 },
      { team_id: 3, challenge_id: 4, points: 90, bonus_points: 5 },
      { team_id: 4, challenge_id: 1, points: 380, bonus_points: 15 },
      { team_id: 5, challenge_id: 1, points: 350, bonus_points: 20 },
      { team_id: 6, challenge_id: 1, points: 400, bonus_points: 10 },
      { team_id: 6, challenge_id: 5, points: 180, bonus_points: 20 },
      { team_id: 7, challenge_id: 1, points: 320, bonus_points: 25 },
      { team_id: 8, challenge_id: 1, points: 280, bonus_points: 15 }
    ];
    
    for (const score of sampleScores) {
      await connection.query(
        'INSERT INTO scores (team_id, challenge_id, points, bonus_points) VALUES (?, ?, ?, ?)',
        [score.team_id, score.challenge_id, score.points, score.bonus_points]
      );
    }
    
    console.log('✅ Sample data seeded successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Data seeding failed:', error.message);
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  seedSampleData
};
