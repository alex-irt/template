CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    hash TEXT NOT NULL,
    avatar_src TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS tokens (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created TIMESTAMP NOT NULL,
    last_active TIMESTAMP NOT NULL
);