const express = require('express');
const router = express.Router();
const db = require('../src/db');

/**
 * GET /api/reminders - Récupérer tous les rappels
 */
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                r.*,
                e.name as event_name,
                e.event_date,
                e.description as event_description
            FROM reminders r
            LEFT JOIN events e ON r.event_id = e.id
            ORDER BY r.created_at DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des rappels:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des rappels' });
    }
});

/**
 * GET /api/reminders/event/:eventId - Récupérer les rappels d'un événement
 */
router.get('/event/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const result = await db.query(
            `SELECT 
                r.*,
                e.name as event_name,
                e.event_date
            FROM reminders r
            LEFT JOIN events e ON r.event_id = e.id
            WHERE r.event_id = $1
            ORDER BY r.days_before DESC`,
            [eventId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des rappels:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des rappels' });
    }
});

/**
 * GET /api/reminders/:id - Récupérer un rappel par ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            `SELECT 
                r.*,
                e.name as event_name,
                e.event_date,
                e.description as event_description
            FROM reminders r
            LEFT JOIN events e ON r.event_id = e.id
            WHERE r.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rappel non trouvé' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération du rappel:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du rappel' });
    }
});

/**
 * POST /api/reminders - Créer un nouveau rappel
 */
router.post('/', async (req, res) => {
    try {
        const { 
            event_id, 
            recipient_email, 
            days_before, 
            frequency, 
            custom_frequency_days 
        } = req.body;

        // Validation
        if (!event_id || !recipient_email || days_before === undefined || !frequency) {
            return res.status(400).json({ 
                error: 'L\'ID de l\'événement, l\'email, les jours avant et la fréquence sont requis' 
            });
        }

        // Valider la fréquence
        const validFrequencies = ['once', 'daily', 'weekly', 'custom'];
        if (!validFrequencies.includes(frequency)) {
            return res.status(400).json({ 
                error: 'Fréquence invalide. Utilisez: once, daily, weekly, custom' 
            });
        }

        // Si fréquence personnalisée, vérifier custom_frequency_days
        if (frequency === 'custom' && !custom_frequency_days) {
            return res.status(400).json({ 
                error: 'La fréquence personnalisée nécessite custom_frequency_days' 
            });
        }

        // Vérifier que l'événement existe
        const eventCheck = await db.query(
            'SELECT id, event_date FROM events WHERE id = $1',
            [event_id]
        );

        if (eventCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Événement non trouvé' });
        }

        // Vérifier que days_before n'est pas supérieur au nombre de jours jusqu'à l'événement
        const eventDate = new Date(eventCheck.rows[0].event_date);
        const today = new Date();
        const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

        if (days_before > daysUntilEvent) {
            return res.status(400).json({ 
                error: `Le nombre de jours avant (${days_before}) ne peut pas être supérieur au nombre de jours jusqu'à l'événement (${daysUntilEvent})` 
            });
        }

        const result = await db.query(
            `INSERT INTO reminders 
             (event_id, recipient_email, days_before, frequency, custom_frequency_days, is_active) 
             VALUES ($1, $2, $3, $4, $5, true) 
             RETURNING *`,
            [event_id, recipient_email, days_before, frequency, custom_frequency_days || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la création du rappel:', error);
        res.status(500).json({ error: 'Erreur lors de la création du rappel' });
    }
});

/**
 * PUT /api/reminders/:id - Modifier un rappel
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            recipient_email, 
            days_before, 
            frequency, 
            custom_frequency_days,
            is_active
        } = req.body;

        if (!recipient_email || days_before === undefined || !frequency) {
            return res.status(400).json({ 
                error: 'L\'email, les jours avant et la fréquence sont requis' 
            });
        }

        // Valider la fréquence
        const validFrequencies = ['once', 'daily', 'weekly', 'custom'];
        if (!validFrequencies.includes(frequency)) {
            return res.status(400).json({ 
                error: 'Fréquence invalide. Utilisez: once, daily, weekly, custom' 
            });
        }

        const result = await db.query(
            `UPDATE reminders 
             SET recipient_email = $1, 
                 days_before = $2, 
                 frequency = $3, 
                 custom_frequency_days = $4,
                 is_active = $5
             WHERE id = $6 
             RETURNING *`,
            [
                recipient_email, 
                days_before, 
                frequency, 
                custom_frequency_days || null,
                is_active !== undefined ? is_active : true,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rappel non trouvé' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la modification du rappel:', error);
        res.status(500).json({ error: 'Erreur lors de la modification du rappel' });
    }
});

/**
 * DELETE /api/reminders/:id - Supprimer un rappel
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM reminders WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rappel non trouvé' });
        }

        res.json({ message: 'Rappel supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du rappel:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression du rappel' });
    }
});

/**
 * PATCH /api/reminders/:id/toggle - Activer/désactiver un rappel
 */
router.patch('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'UPDATE reminders SET is_active = NOT is_active WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rappel non trouvé' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors du changement d\'état du rappel:', error);
        res.status(500).json({ error: 'Erreur lors du changement d\'état du rappel' });
    }
});

module.exports = router;

