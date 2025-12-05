-- =====================================================
-- PODIUM DE CONCOURS - Database Setup Script
-- Nuit de l'Info 2025
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS podium_concours
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE podium_concours;

-- =====================================================
-- TABLES
-- =====================================================

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  avatar VARCHAR(255) DEFAULT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  members INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  max_points INT DEFAULT 100,
  difficulty ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB;

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  challenge_id INT,
  points INT DEFAULT 0,
  bonus_points INT DEFAULT 0,
  comment VARCHAR(255),
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE SET NULL,
  INDEX idx_team (team_id),
  INDEX idx_challenge (challenge_id),
  INDEX idx_awarded (awarded_at)
) ENGINE=InnoDB;

-- Activity log table for real-time updates
CREATE TABLE IF NOT EXISTS activity_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT,
  action_type ENUM('score_added', 'team_created', 'challenge_completed', 'bonus_awarded') NOT NULL,
  description TEXT,
  points_change INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_team_activity (team_id),
  INDEX idx_action (action_type),
  INDEX idx_created_activity (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample teams
INSERT INTO teams (name, color, members) VALUES
  ('Les Codeurs Fous', '#6366f1', 4),
  ('Byte Me', '#ec4899', 3),
  ('Debug Dynasty', '#10b981', 5),
  ('Syntax Errors', '#f59e0b', 4),
  ('Infinite Loop', '#ef4444', 3),
  ('Code Crusaders', '#8b5cf6', 4),
  ('Binary Bandits', '#06b6d4', 5),
  ('Pixel Pioneers', '#84cc16', 3);

-- Insert sample challenges
INSERT INTO challenges (name, description, max_points, difficulty, category) VALUES
  ('Défi Principal - Océans', 'Développement de la solution principale sur le thème des océans', 500, 'expert', 'main'),
  ('Accessibilité WCAG', 'Implémentation des normes d\'accessibilité WCAG 2.1', 100, 'medium', 'bonus'),
  ('UI/UX Design', 'Qualité de l\'interface utilisateur et expérience utilisateur', 150, 'medium', 'design'),
  ('Performance', 'Optimisation et rapidité de l\'application', 100, 'hard', 'technical'),
  ('Innovation', 'Créativité et originalité de la solution', 200, 'hard', 'bonus'),
  ('Clean Code', 'Qualité du code et bonnes pratiques', 80, 'medium', 'technical'),
  ('Documentation', 'Qualité de la documentation technique', 50, 'easy', 'bonus');

-- Insert sample scores
INSERT INTO scores (team_id, challenge_id, points, bonus_points, comment) VALUES
  (1, 1, 450, 25, 'Excellente implémentation'),
  (1, 2, 85, 10, 'Bonne accessibilité'),
  (2, 1, 420, 30, 'Solution créative'),
  (2, 3, 130, 15, 'Design moderne'),
  (3, 1, 480, 20, 'Très bon travail'),
  (3, 4, 90, 5, 'Performance optimisée'),
  (4, 1, 380, 15, 'Bon effort'),
  (5, 1, 350, 20, 'Solution fonctionnelle'),
  (6, 1, 400, 10, 'Travail solide'),
  (6, 5, 180, 20, 'Très innovant'),
  (7, 1, 320, 25, 'Bonne base'),
  (8, 1, 280, 15, 'Première participation');

-- Insert activity logs
INSERT INTO activity_log (team_id, action_type, description, points_change) VALUES
  (1, 'team_created', 'L\'équipe "Les Codeurs Fous" a rejoint la compétition!', 0),
  (2, 'team_created', 'L\'équipe "Byte Me" a rejoint la compétition!', 0),
  (3, 'team_created', 'L\'équipe "Debug Dynasty" a rejoint la compétition!', 0),
  (1, 'score_added', 'Les Codeurs Fous ont gagné 475 points!', 475),
  (2, 'score_added', 'Byte Me a gagné 595 points!', 595),
  (3, 'score_added', 'Debug Dynasty a gagné 595 points!', 595);

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get leaderboard
-- SELECT 
--   t.id,
--   t.name,
--   t.color,
--   t.members,
--   COALESCE(SUM(s.points + s.bonus_points), 0) as total_score
-- FROM teams t
-- LEFT JOIN scores s ON t.id = s.team_id
-- GROUP BY t.id
-- ORDER BY total_score DESC;

-- Get team details with scores
-- SELECT 
--   t.*,
--   s.points,
--   s.bonus_points,
--   c.name as challenge_name
-- FROM teams t
-- LEFT JOIN scores s ON t.id = s.team_id
-- LEFT JOIN challenges c ON s.challenge_id = c.id
-- WHERE t.id = 1;
