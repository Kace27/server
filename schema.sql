-- Esquema de Base de Datos para PES 6 / Football Life adaptado a PostgreSQL (Supabase)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    username VARCHAR(32) NOT NULL UNIQUE,
    serial CHAR(20) NOT NULL,
    hash CHAR(32) NOT NULL UNIQUE,
    reset_nonce VARCHAR(32) DEFAULT NULL,
    updated_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ordinal SMALLINT NOT NULL DEFAULT -1,
    name VARCHAR(32) NOT NULL UNIQUE,
    rank INT NOT NULL DEFAULT 0,
    rating INT NOT NULL DEFAULT 0,
    points INT NOT NULL DEFAULT 0,
    disconnects INT NOT NULL DEFAULT 0,
    seconds_played BIGINT NOT NULL DEFAULT 0,
    comment VARCHAR(256) DEFAULT NULL,
    updated_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
    id BIGSERIAL PRIMARY KEY,
    score_home INT NOT NULL DEFAULT 0,
    score_away INT NOT NULL DEFAULT 0,
    team_id_home INT NOT NULL DEFAULT -1,
    team_id_away INT NOT NULL DEFAULT -1,
    played_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches_played (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    profile_id INT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    home BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (match_id, profile_id)
);

CREATE TABLE IF NOT EXISTS streaks (
    id BIGSERIAL PRIMARY KEY,
    profile_id INT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    wins INT NOT NULL DEFAULT 0,
    best INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS friends (
    id BIGSERIAL PRIMARY KEY,
    profile_id INT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    friend_profile_id INT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE (profile_id, friend_profile_id)
);

CREATE TABLE IF NOT EXISTS blocked (
    id BIGSERIAL PRIMARY KEY,
    profile_id INT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_profile_id INT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE (profile_id, blocked_profile_id)
);

CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    profile_id INT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    settings1 BYTEA DEFAULT NULL,
    settings2 BYTEA DEFAULT NULL
);

-- Tabla para el ecosistema Web (Caché de Rankings)
CREATE TABLE IF NOT EXISTS ranking_cache (
    player_id INT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    matches_played INT DEFAULT 0,
    matches_won INT DEFAULT 0,
    points INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_users_hash ON users(hash);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_played_profile ON matches_played(profile_id);
