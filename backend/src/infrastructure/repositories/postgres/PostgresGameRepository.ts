import {Pool} from "pg";
import {GameRepository} from "@/domain/Game/GameRepository";
import {GameId} from "@/domain/Game/valueObject/GameId";
import {Game} from "@/domain/Game/Game";
import {GamePersistence, GamePersistenceMap, GameRow} from "@/infrastructure/repositories/postgres/GamePersistenceMap";
import {PostgresCellRepository} from "@/infrastructure/repositories/postgres/PostgresCellRepository";
import {PostgresPlayerRepository} from "@/infrastructure/repositories/postgres/PostgresPlayerRepository";
import {CellRepository} from "@/infrastructure/repositories/interfaces/CellRepository";
import {PlayerRepository} from "@/infrastructure/repositories/interfaces/PlayerRepository";
import {CellMap} from "@/application/Game/CellMap";
import {PostgresConnection} from "@/infrastructure/databases/postgres/PostgresConnection";

let repository: PostgresGameRepository;

export class PostgresGameRepository implements GameRepository {
    private pool: Pool;
    private cellRepository: CellRepository;
    private playerRepository: PlayerRepository;

    private constructor() {
        this.pool = PostgresConnection.getPool();
        this.cellRepository = PostgresCellRepository.create();
        this.playerRepository = PostgresPlayerRepository.create();
    }

    static create(): PostgresGameRepository {
        if (!repository) {
            repository = new PostgresGameRepository();
        }
        return repository;
    }

    async save(game: Game): Promise<void> {
        const persistence = GamePersistenceMap.toPersistence(game);
        const row = GamePersistenceMap.toRow(persistence);

        await this.pool.query(
            `INSERT INTO games (id, status, result, room_id, active_player_id, winner_player_id, updated_timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
                 status = $2, result = $3, room_id = $4, active_player_id = $5,
                 winner_player_id = $6, updated_timestamp = $7`,
            [row.id, row.status, row.result, row.room_id, row.active_player_id, row.winner_player_id, row.updated_timestamp]
        );

        const currentPlayerIds = persistence.players.map(player => player.id);
        await this.pool.query(
            `DELETE FROM players WHERE game_id = $1 AND id != ALL($2::uuid[])`,
            [row.id, currentPlayerIds]
        );

        await Promise.all([
            ...game.cells.map(cell => this.cellRepository.save(CellMap.toPersistence(cell))),
            ...persistence.players.map(player => this.playerRepository.save(player)),
        ]);
    }

    async find(id: GameId): Promise<Game | undefined> {
        const result = await this.pool.query<GameRow>('SELECT * FROM games WHERE id = $1', [id.value]);
        const row = result.rows[0];
        if (!row) {
            return undefined;
        }

        const [cells, players] = await Promise.all([
            this.cellRepository.findByGameId(id),
            this.playerRepository.findByGameId(id),
        ]);

        const persistence: GamePersistence = GamePersistenceMap.fromRow(row, players);
        return GamePersistenceMap.toDomain(persistence, cells);
    }

    async delete(id: GameId): Promise<void> {
        await this.pool.query('DELETE FROM games WHERE id = $1', [id.value]);
    }
}
