import {Pool} from "pg";

let pool: Pool;

/**
 * Single shared connection pool for the whole process.
 * Repositories ask for it via PostgresConnection.getPool() instead of each
 * creating their own Pool — connections are expensive, pools are meant to be reused.
 */
export class PostgresConnection {
    static getPool(): Pool {
        if (!pool) {
            // TODO: read these from environment variables (e.g. via a config module),
            // don't hardcode credentials here.
            pool = new Pool({
                host: process.env.POSTGRES_HOST,
                port: Number(process.env.POSTGRES_PORT) || 5432,
                user: process.env.POSTGRES_USER,
                password: process.env.POSTGRES_PASSWORD,
                database: process.env.POSTGRES_DB,
            });
        }
        return pool;
    }

    static async close(): Promise<void> {
        if (pool) {
            await pool.end();
        }
    }
}