import {Pool} from "pg";
import {PlayerRepository} from "@/infrastructure/repositories/interfaces/PlayerRepository";
import {PlayerPersistence} from "@/application/Game/PlayerMap";
import {PlayerId} from "@/domain/Game/Player/PlayerId";
import {PostgresConnection} from "@/infrastructure/databases/postgres/PostgresConnection";

let repository: PostgresPlayerRepository;

export class PostgresPlayerRepository implements PlayerRepository {
    private pool: Pool;

    private constructor() {
        this.pool = PostgresConnection.getPool();
    }

    static create(): PostgresPlayerRepository {
        if (!repository) {
            repository = new PostgresPlayerRepository();
        }
        return repository;
    }

    async save(playerPersistence: PlayerPersistence): Promise<void> {
        // TODO: INSERT ... ON CONFLICT (id) DO UPDATE
        throw new Error("not implemented");
    }

    async find(playerId: PlayerId): Promise<PlayerPersistence | undefined> {
        // TODO: SELECT * FROM players WHERE id = $1
        throw new Error("not implemented");
    }

    async delete(playerId: PlayerId): Promise<void> {
        // TODO: DELETE FROM players WHERE id = $1
        throw new Error("not implemented");
    }
}
