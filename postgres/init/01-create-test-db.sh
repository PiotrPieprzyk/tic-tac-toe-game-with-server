#!/bin/sh
set -e

# Runs once, on first init of the postgres data volume, alongside the main
# POSTGRES_DB. Creates a second, separate database for backend tests so test
# runs never touch dev data.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE ${POSTGRES_TEST_DB:-tic_tac_toe_test}'
    WHERE NOT EXISTS (
        SELECT FROM pg_database WHERE datname = '${POSTGRES_TEST_DB:-tic_tac_toe_test}'
    )\gexec
EOSQL
