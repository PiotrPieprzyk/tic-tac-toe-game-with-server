-- Least-privilege role the backend connects as (instead of the RDS master user).
-- Run by the `db-grants` service in docker-compose.aws.yml, as the master user,
-- after migrations, on every deploy. Safe to re-run.
--
-- DB_APP_USER / DB_APP_PASSWORD come from .env.aws (written by aws/lib/deploy.mjs).
\set ON_ERROR_STOP on
\getenv app_user DB_APP_USER
\getenv app_password DB_APP_PASSWORD

SELECT format('CREATE ROLE %I LOGIN', :'app_user')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'app_user')
\gexec

-- Also re-syncs the password if the SSM parameter was changed.
ALTER ROLE :"app_user" WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD :'app_password';

-- Read/write data only: no CREATE/ALTER/DROP. Schema changes stay with migrations.
GRANT CONNECT ON DATABASE :"DBNAME" TO :"app_user";
GRANT USAGE ON SCHEMA public TO :"app_user";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :"app_user";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO :"app_user";

-- The app has no business touching node-pg-migrate's bookkeeping table.
REVOKE ALL ON TABLE public.pgmigrations FROM :"app_user";
