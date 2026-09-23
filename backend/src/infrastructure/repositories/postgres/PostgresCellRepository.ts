import {Pool} from "pg";
import {CellRepository} from "@/infrastructure/repositories/interfaces/CellRepository";
import {CellId} from "@/domain/Game/Cell/valueObject/CellId";
import {CellPersistence} from "@/application/Game/CellMap";
import {GameId} from "@/domain/Game/valueObject/GameId";
import {PostgresConnection} from "@/infrastructure/databases/postgres/PostgresConnection";

let repository: PostgresCellRepository;

export class PostgresCellRepository implements CellRepository {
    private pool: Pool;

    private constructor() {
        this.pool = PostgresConnection.getPool();
    }

    static create(): PostgresCellRepository {
        if (!repository) {
            repository = new PostgresCellRepository();
        }
        return repository;
    }

    async save(cellPersistence: CellPersistence): Promise<void> {
        // TODO: INSERT ... ON CONFLICT (id) DO UPDATE
        throw new Error("not implemented");
    }

    async find(cellId: CellId): Promise<CellPersistence | undefined> {
        // TODO: SELECT * FROM cells WHERE id = $1
        throw new Error("not implemented");
    }

    async findByGameId(gameId: GameId): Promise<CellPersistence[] | []> {
        // TODO: SELECT * FROM cells WHERE game_id = $1
        throw new Error("not implemented");
    }

    async delete(cellId: CellId): Promise<void> {
        // TODO: DELETE FROM cells WHERE id = $1
        throw new Error("not implemented");
    }
}
