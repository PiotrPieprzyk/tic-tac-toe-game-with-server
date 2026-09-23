import {User} from "@/domain/User/User";

export type UserPersistence = {
    id?: string,
    name: string,
    lastActiveDate: number,
}

export type UserRow = {
    id: string,
    name: string,
    last_active_date: string | number,
}

/**
 * A Postgres row uses snake_case columns (see migrations/1700000001_create_users.js:
 * last_active_date) while UserPersistence stays camelCase to match the mock shape —
 * this map's job is exactly that row <-> persistence translation, on top of the
 * persistence <-> domain translation the mock version already does.
 */
export class UserPersistenceMap {
    static toPersistence(user: User): UserPersistence {
        return {
            id: user.id.value,
            name: user.name.value,
            lastActiveDate: user.lastActiveDate.toPersistent()
        };
    }

    static toDomain(persistence: UserPersistence): User {
        return User.create({
            id: persistence.id,
            name: persistence.name,
            lastActiveDate: persistence.lastActiveDate,
        });
    }

    static fromRow(row: UserRow): UserPersistence {
        return {
            id: row.id,
            name: row.name,
            lastActiveDate: Number(row.last_active_date),
        };
    }

    static toRow(persistence: UserPersistence): { id?: string, name: string, last_active_date: number } {
        return {
            id: persistence.id,
            name: persistence.name,
            last_active_date: persistence.lastActiveDate,
        };
    }
}
