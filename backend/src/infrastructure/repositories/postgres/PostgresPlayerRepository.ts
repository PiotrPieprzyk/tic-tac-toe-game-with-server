import {Pool} from "pg";
import {PlayerRepository} from "@/infrastructure/repositories/interfaces/PlayerRepository";
import {PlayerPersistence} from "@/application/Game/PlayerMap";
import {PlayerId} from "@/domain/Game/Player/PlayerId";
import {GameId} from "@/domain/Game/valueObject/GameId";
import {PostgresConnection} from "@/infrastructure/databases/postgres/PostgresConnection";

type PlayerRow = {
    id: string,
    user_id: string,
    mark: string,
    game_id: string,
}

const fromRow = (row: PlayerRow): PlayerPersistence => ({
    id: row.id,
    userId: row.user_id,
    mark: row.mark,
    gameId: row.game_id,
});

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
        await this.pool.query(
            `INSERT INTO players (id, user_id, mark, game_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET user_id = $2, mark = $3, game_id = $4`,
            [playerPersistence.id, playerPersistence.userId, playerPersistence.mark, playerPersistence.gameId]
        );
    }

    async find(playerId: PlayerId): Promise<PlayerPersistence | undefined> {
        const result = await this.pool.query<PlayerRow>('SELECT * FROM players WHERE id = $1', [playerId.value]);
        const row = result.rows[0];
        return row ? fromRow(row) : undefined;
    }

    async findByGameId(gameId: GameId): Promise<PlayerPersistence[] | []> {
        const result = await this.pool.query<PlayerRow>('SELECT * FROM players WHERE game_id = $1', [gameId.value]);
        return result.rows.map(fromRow);
    }

    async delete(playerId: PlayerId): Promise<void> {
        await this.pool.query('DELETE FROM players WHERE id = $1', [playerId.value]);
    }
}
