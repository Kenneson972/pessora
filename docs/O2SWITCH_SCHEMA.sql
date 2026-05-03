-- PESSORA – Schéma MySQL pour o2switch
-- À exécuter dans phpMyAdmin ou en ligne de commande MySQL.
--
-- 1) Créer la base (si besoin) :
--    CREATE DATABASE pessora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--    USE pessora;
--
-- 2) Coller et exécuter tout le script ci-dessous.
-- Les IDs (users, products, events) sont en CHAR(36) ; le backend doit générer les UUID à l'insertion.

-- ============================================================
-- 1. USERS (auth + profil fusionné)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) DEFAULT '',
  last_name VARCHAR(255) DEFAULT '',
  phone VARCHAR(50) DEFAULT NULL,
  avatar_url VARCHAR(512) DEFAULT NULL,
  role ENUM('member', 'admin') NOT NULL DEFAULT 'member',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  plan ENUM('free', 'starter', 'premium', 'vip') NOT NULL DEFAULT 'free',
  status ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  auto_renew TINYINT(1) NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stripe_subscription_id VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_subscriptions_user_id (user_id),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger : créer une subscription "free" à chaque nouvel utilisateur
DELIMITER //
CREATE TRIGGER after_user_insert_subscription
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO subscriptions (id, user_id, plan, status)
  VALUES (UUID(), NEW.id, 'free', 'active');
END//
DELIMITER ;

-- ============================================================
-- 3. PRODUCTS (menu / admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category ENUM('wellness', 'energie', 'shakes', 'coffee') DEFAULT NULL,
  price DECIMAL(10,2) DEFAULT NULL,
  calories INT DEFAULT NULL,
  protein INT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  ingredients JSON DEFAULT NULL COMMENT 'Tableau JSON des ingrédients',
  benefits JSON DEFAULT NULL COMMENT 'Tableau JSON des bénéfices',
  image_url VARCHAR(512) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date VARCHAR(100) DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  type ENUM('popup', 'event') NOT NULL DEFAULT 'popup',
  description TEXT DEFAULT NULL,
  image_url VARCHAR(512) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Index utiles
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
