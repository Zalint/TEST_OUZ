const express = require('express');
const router = express.Router();
const db = require('../src/db');

/**
 * GET /api/users - Récupérer tous les utilisateurs
 */
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
});

/**
 * GET /api/users/:id - Récupérer un utilisateur par ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'SELECT id, name, email, created_at FROM users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
    }
});

/**
 * POST /api/users - Créer un nouvel utilisateur
 */
router.post('/', async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Le nom et l\'email sont requis' });
        }

        // Vérifier si l'email existe déjà
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        }

        const result = await db.query(
            'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at',
            [name, email]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
    }
});

/**
 * PUT /api/users/:id - Modifier un utilisateur
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Le nom et l\'email sont requis' });
        }

        const result = await db.query(
            'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, created_at',
            [name, email, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la modification de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur lors de la modification de l\'utilisateur' });
    }
});

/**
 * DELETE /api/users/:id - Supprimer un utilisateur
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }
});

module.exports = router;

