#!/usr/bin/env bash
# Lab 07: the least-privilege database role from aws/db/app-role.sql, on a
# local Postgres in Docker. Free and safe: nothing in AWS is touched.
#
#   bash aws/learning/examples/07-postgres-least-privilege/run.sh
#
# Needs Docker. Steps mirror docker-compose.aws.yml: migrate → db-grants → backend.
set -euo pipefail
cd "$(dirname "$0")"

compose() { docker compose -p aws-learning-pg "$@"; }
psql_as_master() { compose exec -T db psql -v ON_ERROR_STOP=1 -U postgres -d tic_tac_toe "$@"; }
psql_as_app() { compose exec -T -e PGPASSWORD=app-password-only-for-this-lab db \
    psql -h 127.0.0.1 -U tic_tac_toe_app -d tic_tac_toe "$@"; }

trap 'compose down -v >/dev/null 2>&1 || true' EXIT

echo "==> Starting Postgres 16 (stand-in for RDS)"
compose up -d --wait 2>/dev/null || compose up -d
until compose exec -T db pg_isready -U postgres -d tic_tac_toe >/dev/null 2>&1; do sleep 1; done
# The image restarts Postgres once after first-time initialisation; wait for that too.
sleep 2
until compose exec -T db pg_isready -U postgres -d tic_tac_toe >/dev/null 2>&1; do sleep 1; done

echo "==> 1. 'migrate': create tables as the master user"
psql_as_master -q -f /lab/1-schema.sql

echo "==> 2. 'db-grants': run the project's real aws/db/app-role.sql as the master user"
psql_as_master -f /sql/app-role.sql

echo "==> Grants the app role ended up with:"
psql_as_master -c "SELECT table_name, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
                   FROM information_schema.role_table_grants
                   WHERE grantee = 'tic_tac_toe_app' GROUP BY table_name ORDER BY table_name;"

echo "==> 3. 'backend': connect as tic_tac_toe_app and try things"
psql_as_app -f /lab/3-try-as-app.sql 2>&1

echo
echo "==> Re-running app-role.sql is safe (it runs on every deploy):"
psql_as_master -q -f /sql/app-role.sql && echo "OK, second run succeeded"

echo
echo "Done. The container and its data are removed on exit."
echo "To explore by hand instead: docker compose -p aws-learning-pg up -d, then"
echo "  docker compose -p aws-learning-pg exec db psql -U postgres -d tic_tac_toe"
