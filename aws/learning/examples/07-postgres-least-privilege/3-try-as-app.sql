-- Run as tic_tac_toe_app, the role the backend uses on AWS.
-- ON_ERROR_STOP is off on purpose: several statements below are EXPECTED to fail.
\set ON_ERROR_STOP off
\echo
\echo '--- who am I?'
SELECT current_user;

\echo
\echo '--- EXPECTED TO WORK: reading and writing rows'
INSERT INTO users (name, last_active_date) VALUES ('alice', 0) ON CONFLICT (name) DO NOTHING;
SELECT name FROM users;
UPDATE users SET last_active_date = 1 WHERE name = 'alice';
DELETE FROM users WHERE name = 'nobody';

\echo
\echo '--- EXPECTED TO FAIL: changing the schema (only migrations may do that)'
DROP TABLE users;
ALTER TABLE users ADD COLUMN is_admin boolean;
CREATE TABLE hacked (id int);

\echo
\echo '--- EXPECTED TO FAIL: touching node-pg-migrate bookkeeping'
SELECT * FROM pgmigrations;

\echo
\echo '--- EXPECTED TO FAIL: creating roles or databases'
CREATE ROLE attacker LOGIN;
CREATE DATABASE other;
