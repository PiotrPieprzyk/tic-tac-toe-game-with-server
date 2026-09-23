import {User} from "@/domain/User/User";

export type UserPersistence = {
    id?: string,
    name: string,
    lastActiveDate: number,
}

/**
 * A Postgres row uses snake_case columns (see migrations/1700000001_create_users.js:
 * last_active_date) while UserPersistence stays camelCase to match the mock shape —
 * this map's job is exactly that row <-> persistence translation, on top of the
 * persistence <-> domain translation the mock version already does.
 */
export class UserPersistenceMap {
    static toPersistence(user: User): UserPersistence {
        // TODO: same as UserPersistenceMap in mock/ — this direction doesn't
        // change with the storage engine.
        throw new Error("not implemented");
    }

    static toDomain(persistence: UserPersistence): User {
        // TODO: same as UserPersistenceMap in mock/.
        throw new Error("not implemented");
    }

    // TODO: add a fromRow(row) that maps a raw pg row ({ id, name, last_active_date })
    // to UserPersistence, and a toRow(persistence) for the reverse — used by
    // PostgresUserRepository around each query.
}
