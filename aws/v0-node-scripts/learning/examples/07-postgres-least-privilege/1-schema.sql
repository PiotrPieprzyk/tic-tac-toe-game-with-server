-- Plays the role of the `migrate` container: creates tables as the master user.
-- A trimmed version of the project's users/rooms tables, plus the bookkeeping
-- table that node-pg-migrate creates.
CREATE TABLE IF NOT EXISTS users (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name             text NOT NULL UNIQUE,
    last_active_date bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
    id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name    text NOT NULL,
    host_id uuid REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS pgmigrations (
    id     serial PRIMARY KEY,
    name   varchar(255) NOT NULL,
    run_on timestamp NOT NULL
);
INSERT INTO pgmigrations (name, run_on) VALUES ('1700000001_create_users', now());
