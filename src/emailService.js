/**
 * Service d'envoi d'emails simulé
 * Pour le développement, les emails sont loggés dans la console et en base de données
 */

const db = require('./db');

/**
 * Simule l'envoi d'un email de rappel
 * @param {Object} options - Options d'envoi
 * @param {string} options.to - Email du destinataire
 * @param {string} options.eventName - Nom de l'événement
 * @param {string} options.eventDate - Date de l'événement
 * @param {string} options.eventDescription - Description de l'événement
 * @param {number} options.daysUntil - Jours restants jusqu'à l'événement
 * @param {number} options.reminderId - ID du rappel
 */
async function sendReminderEmail(options) {
    const { to, eventName, eventDate, eventDescription, daysUntil, reminderId } = options;

    const message = `
╔════════════════════════════════════════════════════════════╗
║                    📧 EMAIL SIMULÉ                         ║
╠════════════════════════════════════════════════════════════╣
║ À: ${to.padEnd(54)}║
║ Sujet: Rappel - ${eventName.padEnd(43)}║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║ 🎯 Événement: ${eventName.padEnd(45)}║
║ 📅 Date: ${eventDate.padEnd(50)}║
║ ⏰ Dans: ${daysUntil} jour${daysUntil > 1 ? 's' : ''}${('').padEnd(46 - daysUntil.toString().length)}║
║                                                            ║
${eventDescription ? `║ 📝 Description: ${eventDescription.substring(0, 40).padEnd(40)}║\n` : ''}║ N'oubliez pas cet événement important!                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `.trim();

    console.log('\n' + message + '\n');

    try {
        // Logger l'email en base de données
        await db.query(
            `INSERT INTO reminder_logs (reminder_id, event_name, recipient_email, status, message, sent_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [reminderId, eventName, to, 'sent', message]
        );

        return { success: true, message: 'Email simulé envoyé avec succès' };
    } catch (error) {
        console.error('❌ Erreur lors du logging de l\'email:', error.message);
        
        // Logger l'erreur
        await db.query(
            `INSERT INTO reminder_logs (reminder_id, event_name, recipient_email, status, error_message, sent_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [reminderId, eventName, to, 'failed', error.message]
        );

        return { success: false, error: error.message };
    }
}

/**
 * Récupère l'historique des emails envoyés
 * @param {number} limit - Nombre maximum d'emails à récupérer
 */
async function getEmailHistory(limit = 50) {
    try {
        const result = await db.query(
            `SELECT 
                rl.id,
                rl.event_name,
                rl.recipient_email,
                rl.status,
                rl.message,
                rl.error_message,
                rl.sent_at,
                r.frequency,
                r.days_before
             FROM reminder_logs rl
             LEFT JOIN reminders r ON rl.reminder_id = r.id
             ORDER BY rl.sent_at DESC
             LIMIT $1`,
            [limit]
        );

        return result.rows;
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        throw error;
    }
}

/**
 * Compte le nombre d'emails envoyés par statut
 */
async function getEmailStats() {
    try {
        const result = await db.query(
            `SELECT 
                status,
                COUNT(*) as count
             FROM reminder_logs
             GROUP BY status`
        );

        const stats = {
            total: 0,
            sent: 0,
            failed: 0
        };

        result.rows.forEach(row => {
            stats[row.status] = parseInt(row.count);
            stats.total += parseInt(row.count);
        });

        return stats;
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        throw error;
    }
}

module.exports = {
    sendReminderEmail,
    getEmailHistory,
    getEmailStats
};

