# 🏆 Podium de Concours - Nuit de l'Info 2025

> **Défi:** Podium de concours - Développement Web Full-Stack
> 
> Une application moderne et dynamique de classement en temps réel pour les compétitions, développée pour la Nuit de l'Info 2025.

<div align="center">

### 🚀 Réalisé par l'Équipe MAX 100% 🚀

[![React](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=nodedotjs)](https://nodejs.org)
[![WCAG](https://img.shields.io/badge/WCAG-2.1_AA-purple)](https://www.w3.org/WAI/WCAG21/quickref/)

</div>

---

## ✨ Fonctionnalités Réalisées

### 🎯 Fonctionnalités Principales
- ✅ **Classement en temps réel** - Mise à jour automatique via WebSocket
- ✅ **Podium animé** - Visualisation spectaculaire des 3 premières équipes
- ✅ **Gestion des équipes** - CRUD complet (création, modification, suppression)
- ✅ **Attribution de scores** - Interface admin intuitive
- ✅ **Statistiques détaillées** - Dashboard avec métriques en temps réel
- ✅ **Système d'authentification** - Admin, Leader, Participant
- ✅ **Gestion des membres** - Leader peut ajouter/retirer des membres
- ✅ **Compte à rebours** - Timer pour la compétition
- ✅ **Fil d'activité** - Historique des actions en temps réel

### 🎨 Interface Utilisateur
- ✅ Design moderne avec effets glassmorphism
- ✅ Animations fluides avec Framer Motion
- ✅ Effets de confetti pour les célébrations
- ✅ Thème sombre élégant
- ✅ Responsive design (mobile-first)
- ✅ Micro-interactions et transitions soignées

### ♿ Accessibilité (WCAG 2.1 AA)
- ✅ Navigation au clavier complète (Tab, Enter, Escape)
- ✅ Labels ARIA appropriés pour lecteurs d'écran
- ✅ Ratio de contraste minimum 4.5:1
- ✅ Skip links vers le contenu principal
- ✅ Focus visible sur tous les éléments interactifs
- ✅ Support `prefers-reduced-motion`
- ✅ Structure sémantique HTML5
- ✅ Textes alternatifs pour icônes

### 💾 Stockage Adaptatif
- ✅ **MySQL** - Si base de données configurée
- ✅ **JSON Files** - Persistance locale automatique
- ✅ **In-Memory** - Mode démo sans configuration

---

## 🚀 Lancer l'Application de A à Z

### Prérequis
- **Node.js 18+** ([télécharger](https://nodejs.org))
- **npm** (inclus avec Node.js)
- MySQL 8.0+ *(optionnel - l'app fonctionne sans!)*

### Installation en 4 étapes

```bash
# 1. Cloner le projet
git clone https://github.com/Ahmedouyahya/Podium-de-concours.git
cd Podium-de-concours

# 2. Installer et lancer le Backend
cd backend
npm install
npm run dev

# 3. Ouvrir un NOUVEAU terminal, installer et lancer le Frontend
cd frontend
npm install
npm run dev

# 4. Ouvrir dans le navigateur
# Frontend: http://localhost:5173
# API: http://localhost:3001
```

### 🔐 Comptes de Test

| Rôle | Username | Mot de passe | Permissions |
|------|----------|--------------|-------------|
| 👑 **Admin** | `admin` | `admin123` | Tout gérer, attribuer des scores |
| 🎯 **Leader** | `max_leader` | `leader123` | Gérer son équipe, ajouter des membres |
| 👤 **Participant** | `ahmed` | `pass123` | Voir le classement, soumettre |

---

## 🛠️ Technologies Utilisées

### Frontend
| Technologie | Usage |
|-------------|-------|
| React 18 | Framework UI |
| TypeScript | Typage statique |
| Vite | Build tool |
| Framer Motion | Animations |
| React Router | Navigation |
| Socket.io-client | Temps réel |
| Lucide React | Icônes |
| React Hot Toast | Notifications |
| React Confetti | Effets festifs |

### Backend
| Technologie | Usage |
|-------------|-------|
| Node.js | Runtime |
| Express | Framework API |
| TypeScript | Typage statique |
| Socket.io | WebSocket temps réel |
| MySQL2 | Driver base de données |

---

## 📁 Structure du Projet

```
Podium-de-concours/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── dataStore.ts    # Système stockage adaptatif
│   │   │   └── mockData.ts     # Données initiales
│   │   ├── server-adaptive.ts  # Serveur principal
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/         # Header, Footer, Navigation
│   │   │   ├── Podium/         # Podium animé
│   │   │   ├── Leaderboard/    # Tableau classement
│   │   │   ├── Countdown/      # Compte à rebours
│   │   │   ├── ActivityFeed/   # Fil d'activité
│   │   │   └── Stats/          # Cartes statistiques
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx   # Page principale
│   │   │   ├── TeamsPage.tsx   # Gestion équipes
│   │   │   ├── AdminPage.tsx   # Administration
│   │   │   └── LoginPage.tsx   # Authentification
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # Gestion auth
│   │   ├── hooks/
│   │   │   ├── useLeaderboard.ts
│   │   │   └── useStats.ts
│   │   ├── services/
│   │   │   └── api.ts          # Client API
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## 🔌 API Endpoints

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/register` | Inscription |
| GET | `/api/auth/me` | Utilisateur courant |

### Équipes
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/teams` | Liste des équipes |
| POST | `/api/teams` | Créer une équipe (auth) |
| PUT | `/api/teams/:id` | Modifier (leader/admin) |
| DELETE | `/api/teams/:id` | Supprimer (admin) |
| GET | `/api/teams/:id/members` | Membres d'une équipe |
| POST | `/api/teams/:id/members` | Ajouter membre (leader) |

### Scores
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/scores/leaderboard` | Classement |
| POST | `/api/scores` | Attribuer points (admin) |

### Activité
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/activity` | Activités récentes |
| GET | `/api/activity/stats` | Statistiques |

---

## 🏅 Réponse au Défi

Ce projet répond à **100%** aux critères du défi "Podium de concours":

| Critère | Status |
|---------|--------|
| Gamification du défi principal | ✅ |
| Interface gestion des équipes | ✅ |
| Visualisation de progression | ✅ |
| Classement en temps réel | ✅ |
| Mise à jour automatique depuis BDD | ✅ |
| Bonnes pratiques accessibilité (WCAG) | ✅ |
| Code source complet (Frontend + Backend) | ✅ |
| README avec instructions | ✅ |
| Dépôt GitHub | ✅ |

---

## 👥 Équipe

<div align="center">

### 💪 Projet réalisé par l'Équipe MAX 100% 💪

**Nuit de l'Info 2025**

</div>

---

## 📄 Licence

MIT License - Nuit de l'Info 2025

---

<div align="center">

🏆 **Développé avec ❤️ par l'Équipe MAX 100%** pour la Nuit de l'Info 2025 🌊

</div>
