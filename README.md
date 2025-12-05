# 🏆 Podium de Concours - Nuit de l'Info 2025

> Une application moderne et dynamique de classement en temps réel pour les compétitions, développée pour le défi "Podium de concours" de la Nuit de l'Info 2025.

<div align="center">

### 🚀 Réalisé à 100% par l'Équipe MAX 🚀

</div>

![React](https://img.shields.io/badge/React-18.2-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=nodedotjs)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)
![Accessibility](https://img.shields.io/badge/WCAG-2.1_AA-purple)

## ✨ Fonctionnalités

### 🎯 Principales
- **Classement en temps réel** - Mise à jour automatique via WebSocket
- **Podium animé** - Visualisation spectaculaire des 3 premières équipes
- **Gestion des équipes** - CRUD complet avec interface moderne
- **Attribution de scores** - Interface admin intuitive
- **Statistiques détaillées** - Dashboard avec métriques clés

### 🎨 UI/UX
- Design moderne avec effets glassmorphism
- Animations fluides avec Framer Motion
- Effets de confetti pour les célébrations
- Thème sombre élégant
- Responsive design (mobile-first)
- Micro-interactions et transitions soignées

### ♿ Accessibilité (WCAG 2.1 AA)
- Navigation au clavier complète
- Labels ARIA appropriés
- Contraste de couleurs conforme
- Skip links pour navigation rapide
- Support des lecteurs d'écran
- Réduction de mouvement respectée
- Focus visible sur tous les éléments interactifs

## 🛠️ Technologies

### Frontend
- **React 18** avec TypeScript
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Socket.io-client** - Temps réel
- **Lucide React** - Icônes
- **React Hot Toast** - Notifications
- **React Confetti** - Effets festifs

### Backend
- **Node.js** avec Express
- **MySQL** - Base de données
- **Socket.io** - WebSocket
- **mysql2** - Driver MySQL

## 🚀 Installation

### Prérequis
- Node.js 18+
- MySQL 8.0+
- npm ou yarn

### 1. Cloner le projet
```bash
cd "Podium de concours"
```

### 2. Configuration de la base de données

```bash
# Créer la base de données
mysql -u root -p < backend/database/setup.sql
```

Ou créez manuellement une base `podium_concours` et les tables seront créées automatiquement.

### 3. Configuration du Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Éditer le fichier .env avec vos paramètres MySQL
```

Fichier `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=podium_concours
DB_PORT=3306
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 4. Configuration du Frontend

```bash
cd frontend

# Installer les dépendances
npm install
```

### 5. Lancer l'application

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

L'application sera accessible sur:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Structure du Projet

```
Podium de concours/
├── backend/
│   ├── config/
│   │   └── database.js       # Configuration MySQL
│   ├── routes/
│   │   ├── teams.js          # API équipes
│   │   ├── scores.js         # API scores
│   │   ├── challenges.js     # API défis
│   │   └── activity.js       # API activités
│   ├── database/
│   │   └── setup.sql         # Script SQL
│   ├── server.js             # Point d'entrée
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Layout/       # Header, Layout
    │   │   ├── Podium/       # Composant podium
    │   │   ├── Leaderboard/  # Tableau classement
    │   │   ├── Stats/        # Cartes statistiques
    │   │   └── TeamForm/     # Formulaire équipe
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── LeaderboardPage.tsx
    │   │   ├── TeamsPage.tsx
    │   │   └── AdminPage.tsx
    │   ├── hooks/
    │   │   ├── useLeaderboard.ts
    │   │   └── useStats.ts
    │   ├── services/
    │   │   └── api.ts        # Client API
    │   ├── types/
    │   │   └── index.ts      # Types TypeScript
    │   ├── App.tsx
    │   ├── index.tsx
    │   └── index.css         # Styles globaux
    ├── package.json
    └── tsconfig.json
```

## 🔌 API Endpoints

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | Liste toutes les équipes |
| GET | `/api/teams/:id` | Détails d'une équipe |
| POST | `/api/teams` | Créer une équipe |
| PUT | `/api/teams/:id` | Modifier une équipe |
| DELETE | `/api/teams/:id` | Supprimer une équipe |

### Scores
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scores/leaderboard` | Classement complet |
| GET | `/api/scores` | Liste tous les scores |
| POST | `/api/scores` | Ajouter des points |
| PUT | `/api/scores/:id` | Modifier un score |
| DELETE | `/api/scores/:id` | Supprimer un score |

### Challenges
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/challenges` | Liste tous les défis |
| GET | `/api/challenges/:id` | Détails d'un défi |
| POST | `/api/challenges` | Créer un défi |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activity` | Activités récentes |
| GET | `/api/activity/stats` | Statistiques globales |

## 🎨 Captures d'écran

### Dashboard Principal
- Statistiques en temps réel
- Podium animé avec les 3 premiers
- Classement complet

### Page Équipes
- Grille de cartes équipes
- Recherche et filtres
- Création/édition modale

### Page Admin
- Attribution de points
- Actions rapides
- Liste des défis

## ♿ Accessibilité

Cette application respecte les normes WCAG 2.1 niveau AA:

- ✅ Navigation au clavier (Tab, Enter, Escape)
- ✅ Skip links vers le contenu principal
- ✅ Labels ARIA pour lecteurs d'écran
- ✅ Ratio de contraste minimum 4.5:1
- ✅ Focus visible sur tous les éléments
- ✅ Support `prefers-reduced-motion`
- ✅ Textes alternatifs pour icônes
- ✅ Structure sémantique HTML5

## 🏅 Défi Nuit de l'Info 2025

Ce projet répond au défi **"Podium de concours"**:
- ✅ Gamification du défi principal
- ✅ Interface de gestion des équipes
- ✅ Visualisation de progression
- ✅ Classement en temps réel
- ✅ Mise à jour automatique depuis la BDD
- ✅ Bonnes pratiques d'accessibilité (WCAG)

## 👥 Équipe

<div align="center">

### 💪 Projet réalisé à 100% par l'Équipe MAX 100% 💪

Nuit de l'Info 2025

</div>

## 📄 Licence

MIT License - Nuit de l'Info 2025

---

🏆 **Développé avec ❤️ par l'Équipe MAX** pour la Nuit de l'Info 2025 🌊
