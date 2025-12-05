import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuration de la connexion MySQL
const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'podium_concours',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test de connexion
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection: PoolConnection = await pool.getConnection();
    console.log('✅ Connexion à MySQL établie avec succès');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à MySQL:', error);
    return false;
  }
};

// Initialisation de la base de données
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Création de la table teams
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS teams (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        color VARCHAR(7) DEFAULT '#3B82F6',
        avatar VARCHAR(255) DEFAULT '🏆',
        members_count INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Création de la table challenges
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS challenges (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        max_points INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Création de la table scores
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS scores (
        id INT PRIMARY KEY AUTO_INCREMENT,
        team_id INT NOT NULL,
        challenge_id INT NOT NULL,
        points INT NOT NULL,
        awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
      )
    `);

    // Création de la table activity_log
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INT PRIMARY KEY AUTO_INCREMENT,
        team_id INT,
        action VARCHAR(50) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Tables créées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    throw error;
  }
};

// Données d'exemple
export const seedSampleData = async (): Promise<void> => {
  try {
    // Vérifier si des données existent déjà
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM teams');
    if (rows[0].count > 0) {
      console.log('ℹ️ Des données existent déjà, seeding ignoré');
      return;
    }

    // Équipes d'exemple
    const teams: [string, string, string, number][] = [
      ['Les Innovateurs', '#FFD700', '🚀', 5],
      ['Code Warriors', '#4A90E2', '⚔️', 4],
      ['Digital Dreamers', '#9B59B6', '💫', 6],
      ['Tech Titans', '#E74C3C', '🔥', 4],
      ['Binary Beasts', '#2ECC71', '🦖', 5],
      ['Pixel Pioneers', '#F39C12', '🎨', 3],
      ['Quantum Coders', '#1ABC9C', '⚛️', 5],
      ['Cyber Spartans', '#8E44AD', '🛡️', 4]
    ];

    for (const [name, color, avatar, members] of teams) {
      await pool.execute<ResultSetHeader>(
        'INSERT INTO teams (name, color, avatar, members_count) VALUES (?, ?, ?, ?)',
        [name, color, avatar, members]
      );
    }

    // Défis d'exemple
    const challenges: [string, string, number][] = [
      ['Défi Principal - Ocean', 'Sensibilisation aux problèmes océaniques', 500],
      ['Accessibilité WCAG', 'Implémenter les standards d\'accessibilité', 150],
      ['Performance Web', 'Optimiser les performances du site', 100],
      ['Design Responsive', 'Créer un design adaptatif', 100],
      ['Innovation Technique', 'Utiliser des technologies innovantes', 150],
      ['Documentation', 'Documenter le code et le projet', 50],
      ['Tests Unitaires', 'Couvrir le code avec des tests', 100],
      ['Sécurité', 'Implémenter les bonnes pratiques de sécurité', 100]
    ];

    for (const [name, description, maxPoints] of challenges) {
      await pool.execute<ResultSetHeader>(
        'INSERT INTO challenges (name, description, max_points) VALUES (?, ?, ?)',
        [name, description, maxPoints]
      );
    }

    // Scores aléatoires pour le classement initial
    const [teamsResult] = await pool.execute<RowDataPacket[]>('SELECT id FROM teams');
    const [challengesResult] = await pool.execute<RowDataPacket[]>('SELECT id, max_points FROM challenges');

    for (const team of teamsResult) {
      // Chaque équipe a complété quelques défis aléatoires
      const numChallenges = Math.floor(Math.random() * 5) + 2;
      const shuffledChallenges = challengesResult.sort(() => Math.random() - 0.5).slice(0, numChallenges);
      
      for (const challenge of shuffledChallenges) {
        const points = Math.floor(Math.random() * challenge.max_points * 0.8) + challenge.max_points * 0.2;
        await pool.execute<ResultSetHeader>(
          'INSERT INTO scores (team_id, challenge_id, points) VALUES (?, ?, ?)',
          [team.id, challenge.id, Math.floor(points)]
        );

        // Log d'activité
        await pool.execute<ResultSetHeader>(
          'INSERT INTO activity_log (team_id, action, details) VALUES (?, ?, ?)',
          [team.id, 'score_added', `Points attribués pour le défi #${challenge.id}`]
        );
      }
    }

    console.log('✅ Données d\'exemple insérées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données:', error);
    throw error;
  }
};

export default pool;
