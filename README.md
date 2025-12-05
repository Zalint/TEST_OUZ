# 📅 Application de Rappels d'Événements

Application web complète pour gérer des événements et envoyer des rappels automatiques par email.

## 🚀 Technologies Utilisées

- **Backend**: Node.js + Express
- **Base de données**: PostgreSQL
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Emails**: Simulation avec logs (pour le développement)

## 📋 Fonctionnalités

### ✅ Gestion des Utilisateurs
- Créer et gérer plusieurs utilisateurs
- Chaque utilisateur peut créer ses propres événements

### ✅ Gestion des Événements
- Créer des événements avec nom, description et date
- Support de multiples formats de date :
  - `YYYY-MM-DD` (ex: 2025-12-25)
  - `DD-MM-YYYY` (ex: 25-12-2025)
  - `DD/MM/YYYY` (ex: 25/12/2025)
  - `DD/MM/YY` (ex: 25/12/25)
- Visualiser tous les événements avec compteur de jours restants
- Supprimer des événements

### ✅ Configuration des Rappels
- Définir le nombre de jours avant l'événement pour recevoir le rappel
- Choisir la fréquence d'envoi :
  - **Une seule fois** : Un seul rappel X jours avant
  - **Quotidien** : Un email chaque jour à partir de X jours avant jusqu'à l'événement
  - **Hebdomadaire** : Un email par semaine
  - **Personnalisé** : Un email tous les X jours
- Spécifier l'email du destinataire

### ✅ Planificateur de Rappels
- Exécution manuelle via l'interface
- Logique intelligente pour éviter les doublons
- Historique complet des emails envoyés
- Statistiques en temps réel

### ✅ Interface Moderne
- Design responsive et moderne
- Animations fluides
- Feedback visuel immédiat
- Modals pour les actions

## 📦 Installation

### Prérequis

1. **Node.js** (version 14 ou supérieure)
   ```bash
   node --version
   ```

2. **PostgreSQL** (version 12 ou supérieure)
   ```bash
   psql --version
   ```

### Étapes d'Installation

1. **Cloner ou télécharger le projet**
   ```bash
   cd DEMO100
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer PostgreSQL**

   a. Créer la base de données :
   ```bash
   # Se connecter à PostgreSQL
   psql -U postgres

   # Créer la base de données
   CREATE DATABASE event_reminder;

   # Quitter
   \q
   ```

   b. Exécuter le schéma de base de données :
   ```bash
   psql -U postgres -d event_reminder -f database/schema.sql
   ```

   c. **Charger les données de test (RECOMMANDÉ)** :
   ```bash
   psql -U postgres -d event_reminder -f database/seed.sql
   ```
   
   Cela créera automatiquement :
   - 5 utilisateurs de test
   - 8 événements (aujourd'hui, dans 3, 7, 14, 30, 60, 90 jours)
   - 7 rappels avec différentes fréquences
   - 4 logs d'emails dans l'historique

4. **Configuration automatique**

   Le fichier `.env` est déjà configuré avec vos paramètres :
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=event_reminder
   DB_USER=postgres
   DB_PASSWORD=bonea2024
   DB_SSL=false
   PORT=3000
   NODE_ENV=development
   ```

5. **Démarrer l'application**
   ```bash
   npm start
   ```

6. **Ouvrir dans le navigateur**
   ```
   http://localhost:3000
   ```

## 🎯 Données de Test Incluses

Après avoir exécuté `database/seed.sql`, vous aurez :

### 👥 Utilisateurs
- Marie Dubois (marie.dubois@example.com)
- Pierre Martin (pierre.martin@example.com)
- Sophie Laurent (sophie.laurent@example.com)
- Jean Dupont (jean.dupont@example.com)
- Alice Bernard (alice.bernard@example.com)

### 📅 Événements
- **Aujourd'hui** : Réunion Importante
- **Dans 3 jours** : Anniversaire de Pierre (avec rappel quotidien)
- **Dans 7 jours** : Conférence Tech 2025 (avec rappel unique)
- **Dans 14 jours** : Vacances à Paris (avec rappel hebdomadaire)
- **Dans 30 jours** : Mariage de Jean (avec rappel quotidien)
- **Dans 60 jours** : Examen de Certification (avec rappel personnalisé tous les 5 jours)
- **Dans 90 jours** : Déménagement (avec rappel hebdomadaire)

### 🧪 Test Rapide

1. Ouvrir l'application : http://localhost:3000
2. Vous verrez immédiatement les événements de test
3. Cliquer sur **"🔄 Exécuter les Rappels"** pour tester l'envoi
4. Cliquer sur **"📧 Historique Emails"** pour voir les emails déjà envoyés

## 🎯 Guide d'Utilisation

### 1. Créer un Utilisateur

1. Cliquer sur **"➕ Nouvel Événement"**
2. Cliquer sur **"➕ Créer un nouvel utilisateur"**
3. Remplir le nom et l'email
4. Cliquer sur **"Créer l'utilisateur"**

### 2. Créer un Événement avec Rappel

1. Cliquer sur **"➕ Nouvel Événement"**
2. Sélectionner un utilisateur
3. Remplir les informations de l'événement :
   - Nom (ex: "Anniversaire de Jean")
   - Description (optionnel)
   - Date (ex: "25/12/2025")
4. Configurer le rappel :
   - Email du destinataire
   - Nombre de jours avant (ex: 7 pour recevoir le rappel 7 jours avant)
   - Fréquence (une fois, quotidien, hebdomadaire, personnalisé)
5. Cliquer sur **"Créer l'événement"**

### 3. Exécuter les Rappels

1. Cliquer sur **"🔄 Exécuter les Rappels"**
2. Confirmer l'exécution
3. Voir le résumé des emails envoyés

### 4. Consulter l'Historique

1. Cliquer sur **"📧 Historique Emails"**
2. Voir tous les emails envoyés avec leur contenu

## 🔧 Structure du Projet

```
DEMO100/
├── database/
│   ├── schema.sql              # Schéma de base de données
│   └── seed.sql                # Données de test
├── public/
│   ├── index.html              # Interface utilisateur
│   ├── styles.css              # Styles CSS
│   └── app.js                  # JavaScript frontend
├── routes/
│   ├── events.js               # Routes pour les événements
│   ├── reminders.js            # Routes pour les rappels
│   ├── users.js                # Routes pour les utilisateurs
│   └── scheduler.js            # Routes pour le planificateur
├── src/
│   ├── db.js                   # Configuration PostgreSQL
│   ├── emailService.js         # Service d'emails simulé
│   └── server.js               # Serveur Express principal
├── .gitignore
├── package.json
└── README.md
```

## 📡 API Endpoints

### Utilisateurs
- `GET /api/users` - Liste tous les utilisateurs
- `POST /api/users` - Créer un utilisateur
- `GET /api/users/:id` - Obtenir un utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

### Événements
- `GET /api/events` - Liste tous les événements
- `POST /api/events` - Créer un événement
- `GET /api/events/:id` - Obtenir un événement
- `PUT /api/events/:id` - Modifier un événement
- `DELETE /api/events/:id` - Supprimer un événement

### Rappels
- `GET /api/reminders` - Liste tous les rappels
- `POST /api/reminders` - Créer un rappel
- `GET /api/reminders/event/:eventId` - Rappels d'un événement
- `GET /api/reminders/:id` - Obtenir un rappel
- `PUT /api/reminders/:id` - Modifier un rappel
- `DELETE /api/reminders/:id` - Supprimer un rappel
- `PATCH /api/reminders/:id/toggle` - Activer/désactiver un rappel

### Planificateur
- `POST /api/scheduler/run` - Exécuter le planificateur
- `GET /api/scheduler/preview` - Prévisualiser les rappels à envoyer
- `GET /api/scheduler/history` - Historique des emails
- `GET /api/scheduler/stats` - Statistiques d'envoi

### Santé
- `GET /api/health` - Vérifier l'état du serveur et de la DB

## 🔍 Exemples d'Utilisation de l'API

### Créer un utilisateur
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jean Dupont",
    "email": "jean@example.com"
  }'
```

### Créer un événement
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "Anniversaire",
    "description": "Fête d'\''anniversaire de Jean",
    "event_date": "25/12/2025"
  }'
```

### Créer un rappel
```bash
curl -X POST http://localhost:3000/api/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": 1,
    "recipient_email": "jean@example.com",
    "days_before": 7,
    "frequency": "daily"
  }'
```

### Exécuter le planificateur
```bash
curl -X POST http://localhost:3000/api/scheduler/run
```

## 📊 Logique de Fréquence des Rappels

### Une seule fois (`once`)
- Envoie UN SEUL email exactement X jours avant l'événement
- Exemple : Si configuré à 7 jours avant, envoie un email 7 jours avant et c'est tout

### Quotidien (`daily`)
- Envoie un email CHAQUE JOUR à partir de X jours avant jusqu'à l'événement
- Exemple : Si configuré à 7 jours avant, envoie un email quotidien pendant 7 jours

### Hebdomadaire (`weekly`)
- Envoie un email CHAQUE SEMAINE à partir de X jours avant jusqu'à l'événement
- Exemple : Si configuré à 21 jours avant, envoie un email aux jours 21, 14, 7 et 0

### Personnalisé (`custom`)
- Envoie un email tous les X jours à partir de Y jours avant jusqu'à l'événement
- Exemple : Tous les 3 jours à partir de 15 jours avant

## 🐛 Dépannage

### Erreur de connexion à la base de données

```
❌ Erreur de connexion à la base de données
```

**Solutions:**
1. Vérifier que PostgreSQL est démarré :
   ```bash
   # Windows
   pg_ctl status

   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Vérifier les identifiants dans `.env`
3. Vérifier que la base de données existe :
   ```bash
   psql -U postgres -l
   ```

### Le serveur ne démarre pas

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:** Le port 3000 est déjà utilisé. Modifier `PORT` dans `.env` ou tuer le processus :
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Réinitialiser les données de test

Pour recommencer à zéro avec les données de test :
```bash
# Supprimer toutes les données
psql -U postgres -d event_reminder -c "TRUNCATE TABLE reminder_logs, reminders, events, users RESTART IDENTITY CASCADE;"

# Recharger les données de test
psql -U postgres -d event_reminder -f database/seed.sql
```

## 🔐 Sécurité

⚠️ **Cette application est conçue pour le développement local uniquement !**

Pour une utilisation en production, il faudrait :
- Ajouter l'authentification des utilisateurs
- Implémenter la validation des entrées côté serveur
- Utiliser HTTPS
- Configurer un vrai service d'envoi d'emails (SMTP)
- Ajouter la protection CSRF
- Limiter les requêtes (rate limiting)

## 📝 Notes Importantes

1. **Formats de Date**: L'application accepte plusieurs formats de date et les convertit automatiquement en `YYYY-MM-DD` pour PostgreSQL.

2. **Emails Simulés**: Les emails ne sont pas réellement envoyés. Ils sont loggés dans la console du serveur et dans la base de données. Pour envoyer de vrais emails, il faudrait configurer un service SMTP (ex: Nodemailer avec Gmail).

3. **Planificateur Manuel**: Le planificateur n'est pas automatique. Il faut l'exécuter manuellement via l'interface ou l'API. Pour une exécution automatique, il faudrait implémenter un cron job.

4. **Fuseau Horaire**: Tous les événements et rappels utilisent le même fuseau horaire (celui du serveur).

## 📞 Support

Pour toute question ou problème, vérifier :
1. Les logs de la console Node.js
2. La console du navigateur (F12)
3. Les logs PostgreSQL
4. La table `reminder_logs` pour voir l'historique des emails

## 📄 Licence

MIT - Libre d'utilisation

---

**Développé avec ❤️ en Node.js, Express et PostgreSQL**
