"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const PostgresConnection_1 = require("@/infrastructure/databases/postgres/PostgresConnection");
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
(0, globals_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.DATABASE_URL) {
        return;
    }
    const pool = PostgresConnection_1.PostgresConnection.getPool();
    yield pool.query('TRUNCATE users, rooms, room_users, games, players, cells RESTART IDENTITY CASCADE');
}));
(0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.DATABASE_URL) {
        return;
    }
    yield PostgresConnection_1.PostgresConnection.close();
}));
