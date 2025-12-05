-- Script d'insertion de donnees de test
-- Executer avec: psql -U postgres -d event_reminder -f database/seed.sql

-- Nettoyer les donnees existantes (optionnel, decommenter si besoin)
-- TRUNCATE TABLE reminder_logs, reminders, events, users RESTART IDENTITY CASCADE;

-- Insertion d'utilisateurs de test
INSERT INTO users (name, email, created_at) VALUES 
    ('Marie Dubois', 'marie.dubois@example.com', NOW() - INTERVAL '30 days'),
    ('Pierre Martin', 'pierre.martin@example.com', NOW() - INTERVAL '25 days'),
    ('Sophie Laurent', 'sophie.laurent@example.com', NOW() - INTERVAL '20 days'),
    ('Jean Dupont', 'jean.dupont@example.com', NOW() - INTERVAL '15 days'),
    ('Alice Bernard', 'alice.bernard@example.com', NOW() - INTERVAL '10 days')
ON CONFLICT (email) DO NOTHING;

-- Recuperer les IDs des utilisateurs (en supposant qu''ils commencent a 1)
DO $$
DECLARE
    user1_id INTEGER;
    user2_id INTEGER;
    user3_id INTEGER;
    user4_id INTEGER;
    user5_id INTEGER;
    event1_id INTEGER;
    event2_id INTEGER;
    event3_id INTEGER;
    event4_id INTEGER;
    event5_id INTEGER;
    event6_id INTEGER;
    event7_id INTEGER;
    event8_id INTEGER;
    reminder1_id INTEGER;
    reminder2_id INTEGER;
    reminder3_id INTEGER;
BEGIN
    -- Recuperer les IDs des utilisateurs
    SELECT id INTO user1_id FROM users WHERE email = 'marie.dubois@example.com';
    SELECT id INTO user2_id FROM users WHERE email = 'pierre.martin@example.com';
    SELECT id INTO user3_id FROM users WHERE email = 'sophie.laurent@example.com';
    SELECT id INTO user4_id FROM users WHERE email = 'jean.dupont@example.com';
    SELECT id INTO user5_id FROM users WHERE email = 'alice.bernard@example.com';

    -- Insertion d''evenements de test (differentes dates)
    
    -- Evenement aujourd''hui
    INSERT INTO events (user_id, name, description, event_date, created_at) 
    VALUES (
        user1_id, 
        'Reunion Importante', 
        'Reunion avec les clients pour le nouveau projet', 
        CURRENT_DATE,
        NOW() - INTERVAL '5 days'
    ) RETURNING id INTO event1_id;

    -- Evenement dans 3 jours
    INSERT INTO events (user_id, name, description, event_date, created_at) 
    VALUES (
        user2_id, 
        'Anniversaire de Pierre', 
        'Fete d''anniversaire surprise au restaurant Le Gourmet', 
        CURRENT_DATE + INTERVAL '3 days',
        NOW() - INTERVAL '10 days'
    ) RETURNING id INTO event2_id;

    -- Evenement dans 7 jours
    INSERT INTO events (user_id, name, description, event_date, created_at) 
    VALUES (
        user3_id, 
        'Conference Tech 2025', 
        'Grande conference sur les nouvelles technologies et l''IA', 
        CURRENT_DATE + INTERVAL '7 days',
        NOW() - INTERVAL '15 days'
    ) RETURNING id INTO event3_id;

    -- Evenement dans 14 jours
    INSERT INTO events (user_id, name, description, event_date, created_at) 
    VALUES (
        user1_id, 
        'Vacances a Paris', 
        'Voyage de 5 jours a Paris avec la famille', 
        CURRENT_DATE + INTERVAL '14 days',
        NOW() - INTERVAL '8 days'
    ) RETURNING id INTO event4_id;

    -- Evenement dans 30 jours
    INSERT INTO events (user_id, name, description, event_date, created_at) 
    VALUES (
        user4_id, 
        'Mariage de Jean', 
        'Ceremonie de mariage a la mairie suivie d''une reception', 
        CURRENT_DATE + INTERVAL '30 days',
        NOW() - INTERVAL '60 days'
    ) RETURNING id INTO event5_id;

    -- Evenement dans 60 jours
    INSERT INTO events (user_id, name, description, event_date, created_at) 
    VALUES (
        user5_id, 
        'Examen de Certification', 
        'Examen final pour la certification professionnelle AWS', 
        CURRENT_DATE + INTERVAL '60 days',
        NOW() - INTERVAL '20 days'
    ) RETURNING id INTO event6_id;

    -- Evenement dans 90 jours
    INSERT INTO events (user_id, name, description, event_date, created_at) 
    VALUES (
        user2_id, 
        'Demenagement', 
        'Demenagement dans le nouvel appartement au centre-ville', 
        CURRENT_DATE + INTERVAL '90 days',
        NOW() - INTERVAL '5 days'
    ) RETURNING id INTO event7_id;

    -- Evenement passe (pour tester)
    INSERT INTO events (user_id, name, description, event_date, created_at) 
    VALUES (
        user3_id, 
        'Evenement Passe Test', 
        'Cet evenement est dans le passe pour les tests', 
        CURRENT_DATE - INTERVAL '5 days',
        NOW() - INTERVAL '10 days'
    ) RETURNING id INTO event8_id;

    -- Insertion de rappels avec differentes frequences
    
    -- Rappel quotidien pour l''anniversaire (3 jours avant)
    INSERT INTO reminders (event_id, recipient_email, days_before, frequency, is_active, created_at)
    VALUES (
        event2_id,
        'pierre.martin@example.com',
        5,
        'daily',
        true,
        NOW() - INTERVAL '10 days'
    ) RETURNING id INTO reminder1_id;

    -- Rappel unique pour la conference (7 jours avant)
    INSERT INTO reminders (event_id, recipient_email, days_before, frequency, is_active, created_at)
    VALUES (
        event3_id,
        'sophie.laurent@example.com',
        7,
        'once',
        true,
        NOW() - INTERVAL '15 days'
    ) RETURNING id INTO reminder2_id;

    -- Rappel hebdomadaire pour les vacances
    INSERT INTO reminders (event_id, recipient_email, days_before, frequency, is_active, created_at)
    VALUES (
        event4_id,
        'marie.dubois@example.com',
        21,
        'weekly',
        true,
        NOW() - INTERVAL '8 days'
    );

    -- Rappel quotidien pour le mariage
    INSERT INTO reminders (event_id, recipient_email, days_before, frequency, is_active, created_at)
    VALUES (
        event5_id,
        'jean.dupont@example.com',
        10,
        'daily',
        true,
        NOW() - INTERVAL '60 days'
    );

    -- Rappel personnalise pour l''examen (tous les 5 jours)
    INSERT INTO reminders (event_id, recipient_email, days_before, frequency, custom_frequency_days, is_active, created_at)
    VALUES (
        event6_id,
        'alice.bernard@example.com',
        30,
        'custom',
        5,
        true,
        NOW() - INTERVAL '20 days'
    );

    -- Rappel hebdomadaire pour le demenagement
    INSERT INTO reminders (event_id, recipient_email, days_before, frequency, is_active, created_at)
    VALUES (
        event7_id,
        'pierre.martin@example.com',
        45,
        'weekly',
        true,
        NOW() - INTERVAL '5 days'
    );

    -- Rappel desactive (pour tester)
    INSERT INTO reminders (event_id, recipient_email, days_before, frequency, is_active, created_at)
    VALUES (
        event4_id,
        'test@example.com',
        7,
        'daily',
        false,
        NOW() - INTERVAL '3 days'
    ) RETURNING id INTO reminder3_id;

    -- Insertion de logs d''emails simules (historique)
    
    -- Email envoye avec succes
    INSERT INTO reminder_logs (reminder_id, event_name, recipient_email, status, message, sent_at)
    VALUES (
        reminder1_id,
        'Anniversaire de Pierre',
        'pierre.martin@example.com',
        'sent',
        'Email simule envoye avec succes',
        NOW() - INTERVAL '2 days'
    );

    INSERT INTO reminder_logs (reminder_id, event_name, recipient_email, status, message, sent_at)
    VALUES (
        reminder1_id,
        'Anniversaire de Pierre',
        'pierre.martin@example.com',
        'sent',
        'Email simule envoye avec succes',
        NOW() - INTERVAL '1 day'
    );

    INSERT INTO reminder_logs (reminder_id, event_name, recipient_email, status, message, sent_at)
    VALUES (
        reminder2_id,
        'Conference Tech 2025',
        'sophie.laurent@example.com',
        'sent',
        'Email simule envoye avec succes',
        NOW() - INTERVAL '3 days'
    );

    -- Email echoue (pour tester)
    INSERT INTO reminder_logs (reminder_id, event_name, recipient_email, status, error_message, sent_at)
    VALUES (
        reminder3_id,
        'Test Evenement',
        'error@example.com',
        'failed',
        'Erreur de test: Adresse email invalide',
        NOW() - INTERVAL '5 days'
    );

    RAISE NOTICE 'Donnees de test inserees avec succes!';
    RAISE NOTICE 'Utilisateurs crees: %', 5;
    RAISE NOTICE 'Evenements crees: %', 8;
    RAISE NOTICE 'Rappels crees: %', 7;
    RAISE NOTICE 'Logs d''emails crees: %', 4;

END $$;

-- Afficher un resume
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM events) as total_events,
    (SELECT COUNT(*) FROM reminders) as total_reminders,
    (SELECT COUNT(*) FROM reminders WHERE is_active = true) as active_reminders,
    (SELECT COUNT(*) FROM reminder_logs) as total_email_logs;
