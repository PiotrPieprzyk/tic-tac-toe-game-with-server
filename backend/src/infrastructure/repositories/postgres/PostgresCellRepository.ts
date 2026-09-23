import {Pool} from "pg";
import {CellRepository} from "@/infrastructure/repositories/interfaces/CellRepository";
import {CellId} from "@/domain/Game/Cell/valueObject/CellId";
import {CellPersistence} from "@/application/Game/CellMap";
import {GameId} from "@/domain/Game/valueObject/GameId";
import {PostgresConnection} from "@/infrastructure/databases/postgres/PostgresConnection";

type CellRow = {
    id: string,
    mark: string,
    position: number,
    game_id: string,
}

const fromRow = (row: CellRow): CellPersistence => ({
    id: row.id,
    mark: row.mark,
    position: row.position,
    gameId: row.game_id,
});

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
        await this.pool.query(
            `INSERT INTO cells (id, mark, position, game_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET mark = $2, position = $3, game_id = $4`,
            [cellPersistence.id, cellPersistence.mark, cellPersistence.position, cellPersistence.gameId]
        );
    }

    async find(cellId: CellId): Promise<CellPersistence | undefined> {
        const result = await this.pool.query<CellRow>('SELECT * FROM cells WHERE id = $1', [cellId.value]);
        const row = result.rows[0];
        return row ? fromRow(row) : undefined;
    }

    async findByGameId(gameId: GameId): Promise<CellPersistence[] | []> {
        const result = await this.pool.query<CellRow>('SELECT * FROM cells WHERE game_id = $1', [gameId.value]);
        return result.rows.map(fromRow);
    }

    async delete(cellId: CellId): Promise<void> {
        await this.pool.query('DELETE FROM cells WHERE id = $1', [cellId.value]);
    }
}
