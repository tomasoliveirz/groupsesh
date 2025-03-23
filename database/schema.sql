-- Schema para o banco de dados SQLite

-- Tabela para armazenar informações da survey
CREATE TABLE IF NOT EXISTS surveys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token VARCHAR(64) NOT NULL UNIQUE,  -- Token único para acesso à survey
    title VARCHAR(255) NOT NULL,
    description TEXT,
    admin_email VARCHAR(255) NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,      -- Data de expiração da survey
    is_active BOOLEAN NOT NULL DEFAULT 1
);

-- Tabela para armazenar respostas dos usuários
CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

-- Tabela para armazenar os dias de disponibilidade
CREATE TABLE IF NOT EXISTS availabilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    available_date DATE NOT NULL,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE(participant_id, available_date)  -- Evita duplicatas
);

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_surveys_token ON surveys(token);
CREATE INDEX IF NOT EXISTS idx_participants_survey_id ON participants(survey_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_participant_id ON availabilities(participant_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_date ON availabilities(available_date);