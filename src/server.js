const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const eventsRouter = require('../routes/events');
const remindersRouter = require('../routes/reminders');
const usersRouter = require('../routes/users');
const schedulerRouter = require('../routes/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// Routes API
app.use('/api/users', usersRouter);
app.use('/api/events', eventsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/scheduler', schedulerRouter);

// Route racine
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Route de santé
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT NOW()');
        res.json({ 
            status: 'ok', 
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            database: 'disconnected',
            error: error.message 
        });
    }
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('Erreur:', err.stack);
    res.status(500).json({ error: 'Erreur serveur interne', message: err.message });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
});

module.exports = app;

