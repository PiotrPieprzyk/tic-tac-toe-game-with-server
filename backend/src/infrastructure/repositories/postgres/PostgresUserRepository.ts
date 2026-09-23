import {Pool} from "pg";
import {UserId} from "@/domain/User/UserId";
import {UserRepository} from "@/domain/User/UserRepository";
import {User} from "@/domain/User/User";
import {PostgresConnection} from "@/infrastructure/databases/postgres/PostgresConnection";
import {UserPersistenceMap} from "@/infrastructure/repositories/postgres/UserPersistenceMap";

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
        // TODO: INSERT ... ON CONFLICT (id) DO UPDATE, using UserPersistenceMap.toPersistence(user)
        // and parameterized values ($1, $2, ...) — never string-interpolate values into SQL.
        throw new Error("not implemented");
    }

    async find(id: UserId): Promise<User | undefined> {
        // TODO: SELECT * FROM users WHERE id = $1, map the single row (or
        // undefined if no rows) through UserPersistenceMap.toDomain.
        throw new Error("not implemented");
    }

    async findByName(name: string): Promise<User | undefined> {
        // TODO: SELECT * FROM users WHERE name = $1
        throw new Error("not implemented");
    }

    async delete(id: UserId): Promise<void> {
        // TODO: DELETE FROM users WHERE id = $1
        throw new Error("not implemented");
    }

    async getAll(): Promise<User[]> {
        // TODO: SELECT * FROM users, map every row through UserPersistenceMap.toDomain
        throw new Error("not implemented");
    }
}
