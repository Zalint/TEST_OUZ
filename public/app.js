// Configuration de l'API
const API_URL = 'http://localhost:3000/api';

// État global
let currentUsers = [];
let currentEvents = [];

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    loadEvents();
    loadStats();
});

// ==================== UTILITAIRES ====================

function showAlert(message, type = 'info') {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';

    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// ==================== USERS ====================

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();
        currentUsers = users;

        // Remplir le select des utilisateurs
        const userSelect = document.getElementById('eventUserId');
        userSelect.innerHTML = '<option value="">Sélectionner un utilisateur</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (${user.email})`;
            userSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        showAlert('Erreur lors du chargement des utilisateurs', 'error');
    }
}

function showCreateUserModal() {
    document.getElementById('userForm').reset();
    openModal('userModal');
}

async function handleUserSubmit(event) {
    event.preventDefault();

    const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value
    };

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la création');
        }

        const user = await response.json();
        showAlert(`Utilisateur "${user.name}" créé avec succès!`, 'success');
        closeModal('userModal');
        await loadUsers();
        
        // Sélectionner automatiquement le nouvel utilisateur
        document.getElementById('eventUserId').value = user.id;
    } catch (error) {
        console.error('Erreur:', error);
        showAlert(error.message, 'error');
    }
}

// ==================== EVENTS ====================

async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}/events`);
        const events = await response.json();
        currentEvents = events;

        const eventsList = document.getElementById('eventsList');

        if (events.length === 0) {
            eventsList.innerHTML = `
                <div class="no-events">
                    <div class="no-events-icon">📭</div>
                    <div class="no-events-text">Aucun événement pour le moment</div>
                    <button class="btn btn-primary" onclick="showCreateEventModal()">
                        ➕ Créer votre premier événement
                    </button>
                </div>
            `;
            return;
        }

        eventsList.innerHTML = events.map(event => {
            const daysUntil = parseInt(event.days_until);
            let daysBadgeClass = 'future';
            let daysBadgeText = `Dans ${daysUntil} jours`;

            if (daysUntil === 0) {
                daysBadgeClass = 'urgent';
                daysBadgeText = "Aujourd'hui!";
            } else if (daysUntil < 0) {
                daysBadgeClass = 'urgent';
                daysBadgeText = 'Passé';
            } else if (daysUntil <= 7) {
                daysBadgeClass = 'urgent';
            } else if (daysUntil <= 30) {
                daysBadgeClass = 'soon';
            }

            return `
                <div class="event-card">
                    <div class="event-header">
                        <div>
                            <div class="event-title">${event.name}</div>
                        </div>
                        <div>
                            <span class="event-date">📅 ${formatDate(event.event_date)}</span>
                            <span class="days-badge ${daysBadgeClass}">${daysBadgeText}</span>
                        </div>
                    </div>

                    <div class="event-info">
                        ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
                        <p><strong>Créé par:</strong> ${event.user_name || 'Inconnu'} (${event.user_email || 'N/A'})</p>
                        <p><strong>Rappels actifs:</strong> ${event.reminder_count || 0}</p>
                    </div>

                    <div class="event-actions">
                        <button class="btn btn-info btn-small" onclick="viewEventDetails(${event.id})">
                            👁️ Détails
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteEvent(${event.id}, '${event.name.replace(/'/g, "\\'")}')">
                            🗑️ Supprimer
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Erreur lors du chargement des événements:', error);
        showAlert('Erreur lors du chargement des événements', 'error');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate() + 1).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function showCreateEventModal() {
    document.getElementById('eventForm').reset();
    document.getElementById('modalTitle').textContent = '➕ Nouvel Événement';
    document.getElementById('customFrequencyGroup').style.display = 'none';
    openModal('eventModal');
}

function handleFrequencyChange() {
    const frequency = document.getElementById('reminderFrequency').value;
    const customGroup = document.getElementById('customFrequencyGroup');
    
    if (frequency === 'custom') {
        customGroup.style.display = 'block';
        document.getElementById('customFrequencyDays').required = true;
    } else {
        customGroup.style.display = 'none';
        document.getElementById('customFrequencyDays').required = false;
    }
}

async function handleEventSubmit(event) {
    event.preventDefault();

    const eventData = {
        user_id: parseInt(document.getElementById('eventUserId').value),
        name: document.getElementById('eventName').value,
        description: document.getElementById('eventDescription').value,
        event_date: document.getElementById('eventDate').value
    };

    const reminderData = {
        recipient_email: document.getElementById('reminderEmail').value,
        days_before: parseInt(document.getElementById('reminderDaysBefore').value),
        frequency: document.getElementById('reminderFrequency').value,
        custom_frequency_days: document.getElementById('customFrequencyDays').value 
            ? parseInt(document.getElementById('customFrequencyDays').value) 
            : null
    };

    try {
        // Créer l'événement
        const eventResponse = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });

        if (!eventResponse.ok) {
            const error = await eventResponse.json();
            throw new Error(error.error || 'Erreur lors de la création de l\'événement');
        }

        const newEvent = await eventResponse.json();

        // Créer le rappel associé
        reminderData.event_id = newEvent.id;
        
        const reminderResponse = await fetch(`${API_URL}/reminders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reminderData)
        });

        if (!reminderResponse.ok) {
            const error = await reminderResponse.json();
            throw new Error(error.error || 'Erreur lors de la création du rappel');
        }

        showAlert(`Événement "${newEvent.name}" créé avec succès!`, 'success');
        closeModal('eventModal');
        await loadEvents();
        await loadStats();

    } catch (error) {
        console.error('Erreur:', error);
        showAlert(error.message, 'error');
    }
}

async function deleteEvent(eventId, eventName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${eventName}" et tous ses rappels?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }

        showAlert(`Événement "${eventName}" supprimé avec succès`, 'success');
        await loadEvents();
        await loadStats();

    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur lors de la suppression de l\'événement', 'error');
    }
}

async function viewEventDetails(eventId) {
    try {
        const response = await fetch(`${API_URL}/events/${eventId}`);
        const event = await response.json();

        const detailsContent = document.getElementById('detailsContent');
        
        let remindersHtml = '<p><em>Aucun rappel configuré</em></p>';
        
        if (event.reminders && event.reminders.length > 0) {
            remindersHtml = event.reminders.map(r => {
                const frequencyText = {
                    'once': 'Une seule fois',
                    'daily': 'Quotidien',
                    'weekly': 'Hebdomadaire',
                    'custom': `Tous les ${r.custom_frequency_days} jours`
                };

                return `
                    <div class="reminder-item">
                        <p><strong>📧 Email:</strong> ${r.recipient_email}</p>
                        <p><strong>⏰ Jours avant:</strong> ${r.days_before} jours</p>
                        <p><strong>🔄 Fréquence:</strong> ${frequencyText[r.frequency]}</p>
                        <p><strong>📊 Statut:</strong> ${r.is_active ? '✅ Actif' : '❌ Inactif'}</p>
                        ${r.last_sent_at ? `<p><strong>📮 Dernier envoi:</strong> ${new Date(r.last_sent_at).toLocaleString('fr-FR')}</p>` : ''}
                    </div>
                `;
            }).join('');
        }

        detailsContent.innerHTML = `
            <div class="event-info">
                <h3>${event.name}</h3>
                <p><strong>📅 Date:</strong> ${formatDate(event.event_date)}</p>
                <p><strong>⏳ Dans:</strong> ${event.days_until} jours</p>
                ${event.description ? `<p><strong>📝 Description:</strong> ${event.description}</p>` : ''}
                <p><strong>👤 Créé par:</strong> ${event.user_name} (${event.user_email})</p>
                
                <hr>
                
                <h3>🔔 Rappels configurés (${event.reminders ? event.reminders.length : 0})</h3>
                ${remindersHtml}
            </div>
        `;

        openModal('detailsModal');

    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur lors du chargement des détails', 'error');
    }
}

// ==================== SCHEDULER ====================

async function runScheduler() {
    if (!confirm('Voulez-vous exécuter le planificateur de rappels maintenant?\n\nCela enverra tous les rappels en attente.')) {
        return;
    }

    showAlert('Exécution du planificateur en cours...', 'info');

    try {
        const response = await fetch(`${API_URL}/scheduler/run`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            const message = `Planificateur exécuté!\n\n` +
                `✅ Vérifiés: ${result.summary.checked}\n` +
                `📧 Envoyés: ${result.summary.sent}\n` +
                `⏭️ Ignorés: ${result.summary.skipped}\n` +
                `❌ Erreurs: ${result.summary.errors}`;
            
            showAlert(message, result.summary.errors > 0 ? 'info' : 'success');
            await loadStats();
        } else {
            throw new Error(result.error || 'Erreur inconnue');
        }

    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur lors de l\'exécution du planificateur', 'error');
    }
}

// ==================== EMAIL HISTORY ====================

async function showEmailHistory() {
    openModal('historyModal');
    
    const historyContent = document.getElementById('historyContent');
    historyContent.innerHTML = '<p class="loading">Chargement de l\'historique...</p>';

    try {
        const response = await fetch(`${API_URL}/scheduler/history?limit=20`);
        const history = await response.json();

        if (history.length === 0) {
            historyContent.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Aucun email envoyé pour le moment</p>';
            return;
        }

        historyContent.innerHTML = history.map(log => {
            const statusClass = log.status === 'sent' ? 'success' : 'failed';
            const date = new Date(log.sent_at).toLocaleString('fr-FR');

            return `
                <div class="history-item ${statusClass}">
                    <div class="history-header">
                        <div>
                            <strong>${log.event_name || 'Événement inconnu'}</strong>
                            <br>
                            <small>À: ${log.recipient_email}</small>
                        </div>
                        <div style="text-align: right;">
                            <span class="status-badge ${log.status}">${log.status === 'sent' ? '✅ Envoyé' : '❌ Échoué'}</span>
                            <br>
                            <small>${date}</small>
                        </div>
                    </div>
                    ${log.message ? `<div class="history-body">${log.message}</div>` : ''}
                    ${log.error_message ? `<div class="history-body" style="color: red;">${log.error_message}</div>` : ''}
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Erreur:', error);
        historyContent.innerHTML = '<p style="color: red; text-align: center;">Erreur lors du chargement de l\'historique</p>';
    }
}

// ==================== STATS ====================

async function loadStats() {
    try {
        // Charger les événements
        const eventsResponse = await fetch(`${API_URL}/events`);
        const events = await eventsResponse.json();

        // Charger les rappels
        const remindersResponse = await fetch(`${API_URL}/reminders`);
        const reminders = await remindersResponse.json();

        // Charger les stats d'emails
        const statsResponse = await fetch(`${API_URL}/scheduler/stats`);
        const emailStats = await statsResponse.json();

        // Mettre à jour l'interface
        document.getElementById('totalEvents').textContent = events.length;
        document.getElementById('totalReminders').textContent = reminders.filter(r => r.is_active).length;
        document.getElementById('emailsSent').textContent = emailStats.sent || 0;

    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

// Fermer les modals en cliquant en dehors
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

