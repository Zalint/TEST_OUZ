const express = require('express');
const router = express.Router();
const db = require('../src/db');

/**
 * Helper: Convertir différents formats de date en YYYY-MM-DD
 */
function parseDate(dateString) {
    // Supprimer les espaces
    dateString = dateString.trim();

    // Format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }

    // Format DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('-');
        return `${year}-${month}-${day}`;
    }

    // Format DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`;
    }

    // Format DD/MM/YY
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(dateString)) {
        const [day, month, year] = dateString.split('/');
        const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
        return `${fullYear}-${month}-${day}`;
    }

    throw new Error('Format de date invalide. Utilisez: YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY ou DD/MM/YY');
}

/**
 * GET /api/events - Récupérer tous les événements
 */
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                e.id,
                e.name,
                e.description,
                e.event_date,
                e.created_at,
                e.user_id,
                u.name as user_name,
                u.email as user_email,
                (e.event_date - CURRENT_DATE) as days_until,
                COUNT(r.id) as reminder_count
            FROM events e
            LEFT JOIN users u ON e.user_id = u.id
            LEFT JOIN reminders r ON e.id = r.event_id AND r.is_active = true
            GROUP BY e.id, u.name, u.email
            ORDER BY e.event_date ASC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des événements:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
    }
});

/**
 * GET /api/events/:id - Récupérer un événement par ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT 
                e.id,
                e.name,
                e.description,
                e.event_date,
                e.created_at,
                e.user_id,
                u.name as user_name,
                u.email as user_email,
                (e.event_date - CURRENT_DATE) as days_until
            FROM events e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Événement non trouvé' });
        }

        // Récupérer les rappels associés
        const reminders = await db.query(
            'SELECT * FROM reminders WHERE event_id = $1 ORDER BY days_before DESC',
            [id]
        );

        const event = result.rows[0];
        event.reminders = reminders.rows;

        res.json(event);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'événement:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'événement' });
    }
});

/**
 * POST /api/events - Créer un nouvel événement
 */
router.post('/', async (req, res) => {
    try {
        const { user_id, name, description, event_date } = req.body;

        if (!user_id || !name || !event_date) {
            return res.status(400).json({ 
                error: 'L\'ID utilisateur, le nom et la date de l\'événement sont requis' 
            });
        }

        // Convertir la date au format standard
        let parsedDate;
        try {
            parsedDate = parseDate(event_date);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }

        // Vérifier que la date n'est pas dans le passé
        const today = new Date().toISOString().split('T')[0];
        if (parsedDate < today) {
            return res.status(400).json({ 
                error: 'La date de l\'événement ne peut pas être dans le passé' 
            });
        }

        const result = await db.query(
            `INSERT INTO events (user_id, name, description, event_date) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, user_id, name, description, event_date, created_at`,
            [user_id, name, description || null, parsedDate]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la création de l\'événement:', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'événement' });
    }
});

/**
 * PUT /api/events/:id - Modifier un événement
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, event_date } = req.body;

        if (!name || !event_date) {
            return res.status(400).json({ 
                error: 'Le nom et la date de l\'événement sont requis' 
            });
        }

        // Convertir la date au format standard
        let parsedDate;
        try {
            parsedDate = parseDate(event_date);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }

        const result = await db.query(
            `UPDATE events 
             SET name = $1, description = $2, event_date = $3 
             WHERE id = $4 
             RETURNING id, user_id, name, description, event_date, created_at`,
            [name, description || null, parsedDate, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Événement non trouvé' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la modification de l\'événement:', error);
        res.status(500).json({ error: 'Erreur lors de la modification de l\'événement' });
    }
});

/**
 * DELETE /api/events/:id - Supprimer un événement
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM events WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Événement non trouvé' });
        }

        res.json({ message: 'Événement supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'événement:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'événement' });
    }
});

module.exports = router;

