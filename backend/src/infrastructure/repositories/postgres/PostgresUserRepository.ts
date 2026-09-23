import {Pool} from "pg";
import {UserId} from "@/domain/User/UserId";
import {UserRepository} from "@/domain/User/UserRepository";
import {User} from "@/domain/User/User";
import {PostgresConnection} from "@/infrastructure/databases/postgres/PostgresConnection";
import {UserPersistenceMap, UserRow} from "@/infrastructure/repositories/postgres/UserPersistenceMap";

let userRepository: PostgresUserRepository;

export class PostgresUserRepository implements UserRepository {
    private pool: Pool;

    private constructor() {
        this.pool = PostgresConnection.getPool();
    }

    static create(): PostgresUserRepository {
        if (!userRepository) {
            userRepository = new PostgresUserRepository();
        }
        return userRepository;
    }

    async save(user: User): Promise<void> {
        const row = UserPersistenceMap.toRow(UserPersistenceMap.toPersistence(user));
        await this.pool.query(
            `INSERT INTO users (id, name, last_active_date)
             VALUES ($1, $2, $3)
             ON CONFLICT (id) DO UPDATE SET name = $2, last_active_date = $3`,
            [row.id, row.name, row.last_active_date]
        );
    }

    async find(id: UserId): Promise<User | undefined> {
        const result = await this.pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [id.value]);
        const row = result.rows[0];
        return row ? UserPersistenceMap.toDomain(UserPersistenceMap.fromRow(row)) : undefined;
    }

    async findByName(name: string): Promise<User | undefined> {
        const result = await this.pool.query<UserRow>('SELECT * FROM users WHERE name = $1', [name]);
        const row = result.rows[0];
        return row ? UserPersistenceMap.toDomain(UserPersistenceMap.fromRow(row)) : undefined;
    }

    async delete(id: UserId): Promise<void> {
        await this.pool.query('DELETE FROM users WHERE id = $1', [id.value]);
    }

    async getAll(): Promise<User[]> {
        const result = await this.pool.query<UserRow>('SELECT * FROM users');
        return result.rows.map(row => UserPersistenceMap.toDomain(UserPersistenceMap.fromRow(row)));
    }
}
