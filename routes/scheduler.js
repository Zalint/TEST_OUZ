const express = require('express');
const router = express.Router();
const db = require('../src/db');
const { sendReminderEmail, getEmailHistory, getEmailStats } = require('../src/emailService');

/**
 * POST /api/scheduler/run - Exécuter manuellement le planificateur de rappels
 * Vérifie tous les rappels actifs et envoie les emails nécessaires
 */
router.post('/run', async (req, res) => {
    try {
        console.log('\n🔄 Démarrage du planificateur de rappels...\n');

        const result = {
            checked: 0,
            sent: 0,
            skipped: 0,
            errors: 0,
            details: []
        };

        // Récupérer tous les rappels actifs avec leurs événements
        const reminders = await db.query(`
            SELECT 
                r.*,
                e.name as event_name,
                e.description as event_description,
                e.event_date,
                (e.event_date - CURRENT_DATE) as days_until_event
            FROM reminders r
            INNER JOIN events e ON r.event_id = e.id
            WHERE r.is_active = true
              AND e.event_date >= CURRENT_DATE
            ORDER BY e.event_date ASC
        `);

        result.checked = reminders.rows.length;

        console.log(`📋 ${result.checked} rappel(s) actif(s) à vérifier\n`);

        // Pour chaque rappel, vérifier s'il doit être envoyé
        for (const reminder of reminders.rows) {
            const daysUntil = parseInt(reminder.days_until_event);
            const daysBefore = reminder.days_before;
            const frequency = reminder.frequency;
            const lastSent = reminder.last_sent_at;

            let shouldSend = false;
            let reason = '';

            // Logique de décision selon la fréquence
            if (frequency === 'once') {
                // Une seule fois : envoyer si on est exactement à X jours avant ET pas encore envoyé
                if (daysUntil === daysBefore && !lastSent) {
                    shouldSend = true;
                    reason = `Rappel unique à ${daysBefore} jours avant`;
                }
            } else if (frequency === 'daily') {
                // Quotidien : envoyer chaque jour si on est dans la période de rappel
                if (daysUntil <= daysBefore) {
                    // Vérifier si on a déjà envoyé aujourd'hui
                    const today = new Date().toISOString().split('T')[0];
                    const lastSentDate = lastSent ? new Date(lastSent).toISOString().split('T')[0] : null;
                    
                    if (lastSentDate !== today) {
                        shouldSend = true;
                        reason = `Rappel quotidien (${daysUntil} jours restants)`;
                    } else {
                        reason = `Déjà envoyé aujourd'hui`;
                    }
                }
            } else if (frequency === 'weekly') {
                // Hebdomadaire : envoyer chaque semaine si on est dans la période de rappel
                if (daysUntil <= daysBefore) {
                    if (!lastSent) {
                        shouldSend = true;
                        reason = `Premier rappel hebdomadaire`;
                    } else {
                        const daysSinceLastSent = Math.floor((new Date() - new Date(lastSent)) / (1000 * 60 * 60 * 24));
                        if (daysSinceLastSent >= 7) {
                            shouldSend = true;
                            reason = `Rappel hebdomadaire (dernier envoi: il y a ${daysSinceLastSent} jours)`;
                        } else {
                            reason = `Déjà envoyé cette semaine (il y a ${daysSinceLastSent} jours)`;
                        }
                    }
                }
            } else if (frequency === 'custom') {
                // Personnalisé : envoyer tous les X jours
                const customDays = reminder.custom_frequency_days || 1;
                
                if (daysUntil <= daysBefore) {
                    if (!lastSent) {
                        shouldSend = true;
                        reason = `Premier rappel personnalisé (tous les ${customDays} jours)`;
                    } else {
                        const daysSinceLastSent = Math.floor((new Date() - new Date(lastSent)) / (1000 * 60 * 60 * 24));
                        if (daysSinceLastSent >= customDays) {
                            shouldSend = true;
                            reason = `Rappel personnalisé (dernier envoi: il y a ${daysSinceLastSent} jours)`;
                        } else {
                            reason = `Prochain envoi dans ${customDays - daysSinceLastSent} jour(s)`;
                        }
                    }
                }
            }

            const detail = {
                reminder_id: reminder.id,
                event_name: reminder.event_name,
                recipient_email: reminder.recipient_email,
                days_until: daysUntil,
                frequency: frequency,
                reason: reason,
                sent: shouldSend
            };

            if (shouldSend) {
                // Envoyer l'email
                try {
                    const emailResult = await sendReminderEmail({
                        to: reminder.recipient_email,
                        eventName: reminder.event_name,
                        eventDate: new Date(reminder.event_date).toLocaleDateString('fr-FR'),
                        eventDescription: reminder.event_description,
                        daysUntil: daysUntil,
                        reminderId: reminder.id
                    });

                    if (emailResult.success) {
                        // Mettre à jour last_sent_at
                        await db.query(
                            'UPDATE reminders SET last_sent_at = NOW() WHERE id = $1',
                            [reminder.id]
                        );

                        result.sent++;
                        detail.status = 'sent';
                        console.log(`✅ Email envoyé pour: ${reminder.event_name} → ${reminder.recipient_email}`);
                    } else {
                        result.errors++;
                        detail.status = 'error';
                        detail.error = emailResult.error;
                        console.log(`❌ Erreur d'envoi pour: ${reminder.event_name}`);
                    }
                } catch (error) {
                    result.errors++;
                    detail.status = 'error';
                    detail.error = error.message;
                    console.error(`❌ Erreur lors de l'envoi:`, error.message);
                }
            } else {
                result.skipped++;
                detail.status = 'skipped';
            }

            result.details.push(detail);
        }

        console.log(`\n📊 Résumé:`);
        console.log(`   - Vérifiés: ${result.checked}`);
        console.log(`   - Envoyés: ${result.sent}`);
        console.log(`   - Ignorés: ${result.skipped}`);
        console.log(`   - Erreurs: ${result.errors}\n`);

        res.json({
            success: true,
            message: 'Planificateur exécuté avec succès',
            summary: {
                checked: result.checked,
                sent: result.sent,
                skipped: result.skipped,
                errors: result.errors
            },
            details: result.details
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'exécution du planificateur:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur lors de l\'exécution du planificateur',
            message: error.message 
        });
    }
});

/**
 * GET /api/scheduler/history - Récupérer l'historique des emails envoyés
 */
router.get('/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const history = await getEmailHistory(limit);
        res.json(history);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
    }
});

/**
 * GET /api/scheduler/stats - Récupérer les statistiques d'envoi
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await getEmailStats();
        res.json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
});

/**
 * GET /api/scheduler/preview - Prévisualiser les rappels qui seraient envoyés
 * Sans réellement les envoyer
 */
router.get('/preview', async (req, res) => {
    try {
        const reminders = await db.query(`
            SELECT 
                r.*,
                e.name as event_name,
                e.event_date,
                (e.event_date - CURRENT_DATE) as days_until_event
            FROM reminders r
            INNER JOIN events e ON r.event_id = e.id
            WHERE r.is_active = true
              AND e.event_date >= CURRENT_DATE
            ORDER BY e.event_date ASC
        `);

        const preview = reminders.rows.map(reminder => {
            const daysUntil = parseInt(reminder.days_until_event);
            const daysBefore = reminder.days_before;
            const frequency = reminder.frequency;
            const lastSent = reminder.last_sent_at;

            let wouldSend = false;
            let reason = '';

            // Même logique que dans /run mais sans envoyer
            if (frequency === 'once') {
                if (daysUntil === daysBefore && !lastSent) {
                    wouldSend = true;
                    reason = `Rappel unique à ${daysBefore} jours avant`;
                }
            } else if (frequency === 'daily') {
                if (daysUntil <= daysBefore) {
                    const today = new Date().toISOString().split('T')[0];
                    const lastSentDate = lastSent ? new Date(lastSent).toISOString().split('T')[0] : null;
                    
                    if (lastSentDate !== today) {
                        wouldSend = true;
                        reason = `Rappel quotidien (${daysUntil} jours restants)`;
                    } else {
                        reason = `Déjà envoyé aujourd'hui`;
                    }
                }
            } else if (frequency === 'weekly') {
                if (daysUntil <= daysBefore) {
                    if (!lastSent) {
                        wouldSend = true;
                        reason = `Premier rappel hebdomadaire`;
                    } else {
                        const daysSinceLastSent = Math.floor((new Date() - new Date(lastSent)) / (1000 * 60 * 60 * 24));
                        if (daysSinceLastSent >= 7) {
                            wouldSend = true;
                            reason = `Rappel hebdomadaire`;
                        } else {
                            reason = `Déjà envoyé cette semaine`;
                        }
                    }
                }
            } else if (frequency === 'custom') {
                const customDays = reminder.custom_frequency_days || 1;
                
                if (daysUntil <= daysBefore) {
                    if (!lastSent) {
                        wouldSend = true;
                        reason = `Premier rappel personnalisé`;
                    } else {
                        const daysSinceLastSent = Math.floor((new Date() - new Date(lastSent)) / (1000 * 60 * 60 * 24));
                        if (daysSinceLastSent >= customDays) {
                            wouldSend = true;
                            reason = `Rappel personnalisé`;
                        }
                    }
                }
            }

            return {
                reminder_id: reminder.id,
                event_name: reminder.event_name,
                event_date: reminder.event_date,
                recipient_email: reminder.recipient_email,
                days_until: daysUntil,
                frequency: frequency,
                would_send: wouldSend,
                reason: reason,
                last_sent: lastSent
            };
        });

        const toSend = preview.filter(p => p.would_send).length;

        res.json({
            total_active: preview.length,
            would_send: toSend,
            would_skip: preview.length - toSend,
            reminders: preview
        });

    } catch (error) {
        console.error('Erreur lors de la prévisualisation:', error);
        res.status(500).json({ error: 'Erreur lors de la prévisualisation' });
    }
});

module.exports = router;

