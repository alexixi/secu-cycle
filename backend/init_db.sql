
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
