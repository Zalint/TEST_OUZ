-- Script de création de la base de données
-- Exécuter avec: psql -U postgres -f database/schema.sql

-- Créer la base de données (décommenter si nécessaire)
-- CREATE DATABASE event_reminder;

-- Se connecter à la base de données
-- \c event_reminder;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des événements
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des rappels
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    days_before INTEGER NOT NULL,
    frequency VARCHAR(50) NOT NULL, -- 'once', 'daily', 'weekly', 'custom'
    custom_frequency_days INTEGER, -- Si frequency = 'custom'
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_frequency CHECK (frequency IN ('once', 'daily', 'weekly', 'custom'))
);

-- Table des logs d'envoi d'emails (simulation)
CREATE TABLE IF NOT EXISTS reminder_logs (
    id SERIAL PRIMARY KEY,
    reminder_id INTEGER REFERENCES reminders(id) ON DELETE CASCADE,
    event_name VARCHAR(255),
    recipient_email VARCHAR(255),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL, -- 'sent', 'failed'
    message TEXT,
    error_message TEXT
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_reminders_event ON reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(is_active);
CREATE INDEX IF NOT EXISTS idx_logs_reminder ON reminder_logs(reminder_id);
