
-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    birth_date DATE,
    sport_level VARCHAR(50), -- debutant / intermediaire / experimente
    home_address TEXT,
    work_address TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BIKES
CREATE TABLE bikes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100),
    type VARCHAR(50), -- VTT, route, urbain
    is_electric BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROUTES (trajets)
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    start_address TEXT NOT NULL,
    end_address TEXT NOT NULL,
    route_type VARCHAR(50), -- securise / rapide / compromis
    distance_km FLOAT,
    duration_min FLOAT,
    safety_score FLOAT,
    path JSONB,
    bike_type VARCHAR(50),
    is_electric VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- BADGES 
CREATE TABLE badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    goal_value INTEGER
);

CREATE TABLE user_badges (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id)
);


-- USER HISTORY (historique utilisateur)
CREATE TABLE user_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- trajet, consultation, signalement
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- REPORTS (signalements)

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR(50), -- accident, travaux, danger
    report_description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- HOME CASES (cases de la page d'accueil, éditables depuis l'admin)
CREATE TABLE home_cases (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TASKS (planning d'administration : kanban à faire / en cours / fait)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'a_faire', -- a_faire / en_cours / fait
    position INTEGER NOT NULL DEFAULT 0,
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO home_cases (title, text, position) VALUES
('Qu''est-ce que Sécu''Cycle ?', 'Sécu''Cycle est un projet développé par 6 étudiants de l''ENSEIRB-MATMECA dans le cadre d''un PFA. L''objectif de ce projet est de créer un site web et une application mobile qui aide les cyclistes à trouver des itinéraires sécurisés en fonction de leurs préférences, de leur profil et de leur équipement. Nous nous sommes focalisés sur la zone de Bordeaux et de notre campus universitaire pour affiner les résultats avec nos connaissances locales du terrain.', 0),
('Problématiques', 'Dans les nombreux freins à l''utilisation du vélo, la sécurité est un facteur déterminant. Les cyclistes sont souvent confrontés à des routes dangereuses ou à un manque d''infrastructures adaptées. Sécu''Cycle répond à ces problématiques en proposant des itinéraires optimisés pour la sécurité, en tenant compte des préférences et du profil de chaque utilisateur.', 1),
('Pourquoi Sécu''Cycle ?', 'Sécu''Cycle a pour but de palier ces problèmes. Il s''inscrit dans une démarche de promotion des mobilités douces et de la sécurité des cyclistes. En fournissant des itinéraires adaptés, Sécu''Cycle vise à encourager davantage de personnes à adopter le vélo comme moyen de transport quotidien à la place de la voiture ou des transports en commun.', 2),
('Sources des données', 'Sécu''Cycle combine différentes sources de données, principalement les données d''OpenStreetMap (openstreetmap.fr) pour la carte des routes et pistes cyclables. Nous ajoutons à cette carte des données topographiques de l''IGN (ign.fr). Pour la complétion des adresses nous utilisons la BAN (Base Adresse Nationale, adresse.data.gouv.fr). Pour avoir des données de trafic de la circulation routière nous utilisons les données du projet Avatar du Cerema (avatar.cerema.fr). Enfin pour l''affichage de la carte, nous utilisons MapTiler (maptiler.com) qui propose des tuiles cartographiques basées sur les données d''OpenStreetMap.', 3);
