import {beforeAll, afterAll} from '@jest/globals';
import {PostgresConnection} from "@/infrastructure/databases/postgres/PostgresConnection";

/**
 * No-op unless DATABASE_URL is set (i.e. unless tests are being run against a
 * real Postgres instance) — plain `npm test` stays on the Mock repositories
 * and never touches this file's logic.
 *
 * Mock repositories are process-isolated per Jest worker (a fresh singleton
 * per test file's VM context), so tests never see cross-file leftovers. A
 * shared Postgres instance has no such isolation, so each test file starts
 * by truncating every table. Run with `--runInBand` when DATABASE_URL is set
 * — parallel workers truncating/writing the same shared DB would race.
 */
beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
        return;
    }

    const pool = PostgresConnection.getPool();
    await pool.query('TRUNCATE users, rooms, room_users, games, players, cells RESTART IDENTITY CASCADE');
});

afterAll(async () => {
    if (!process.env.DATABASE_URL) {
        return;
    }

    await PostgresConnection.close();
});
