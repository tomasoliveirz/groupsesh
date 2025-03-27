DROP TABLE surveys;
DROP TABLE participants;
DROP TABLE availabilities;
DROP TABLE users;

BEGIN TRANSACTION;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    google_id VARCHAR(255) UNIQUE,
    profile_picture VARCHAR(255),
    is_verified BOOLEAN NOT NULL DEFAULT 0,
    verification_token VARCHAR(255),
    verification_token_expiry TIMESTAMP,
    reset_password_token VARCHAR(255),
    reset_password_token_expiry TIMESTAMP
);

-- Tabela de surveys
CREATE TABLE IF NOT EXISTS surveys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    admin_email VARCHAR(255) NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,

    -- Criador da survey (chave estrangeira para users)
    creator_id INTEGER REFERENCES users(id)
);

-- Tabela de participantes de uma survey
CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id INTEGER NOT NULL,
    user_id INTEGER,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN NOT NULL DEFAULT 0,

    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uix_participant_survey_email UNIQUE (survey_id, email)
);

-- Tabela de disponibilidades
CREATE TABLE IF NOT EXISTS availabilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    available_date DATE NOT NULL,

    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    CONSTRAINT uix_avail_participant_date UNIQUE (participant_id, available_date)
);

COMMIT;
