import {Pool} from "pg";
import {GameRepository} from "@/domain/Game/GameRepository";
import {GameId} from "@/domain/Game/valueObject/GameId";
import {Game} from "@/domain/Game/Game";
import {GamePersistence, GamePersistenceMap} from "@/infrastructure/repositories/postgres/GamePersistenceMap";
import {PostgresCellRepository} from "@/infrastructure/repositories/postgres/PostgresCellRepository";
import {CellRepository} from "@/infrastructure/repositories/interfaces/CellRepository";
import {CellMap} from "@/application/Game/CellMap";
import {PostgresConnection} from "@/infrastructure/databases/postgres/PostgresConnection";

let repository: PostgresGameRepository;

export class PostgresGameRepository implements GameRepository {
    private pool: Pool;
    private cellRepository: CellRepository;

    private constructor() {
        this.pool = PostgresConnection.getPool();
        this.cellRepository = PostgresCellRepository.create();
    }

    static create(): PostgresGameRepository {
        if (!repository) {
            repository = new PostgresGameRepository();
        }
        return repository;
    }

    async save(game: Game): Promise<void> {
        // TODO: upsert the game row, then Promise.all(...) the cell saves via
        // this.cellRepository, mirroring MockGameRepository.save.
        //
        // Note: MockGameRepository never touches a player repository — Game's
        // players are just part of GamePersistence and saved as part of the
        // game row there. Decide deliberately here: either a `players` jsonb
        // column on games (closest to the mock), or a normalized players
        // table keyed by game_id (closer to how cells are done) using
        // PostgresPlayerRepository. Whichever you pick, keep GameRepository's
        // public contract unchanged — that decision stays inside this class.
        throw new Error("not implemented");
    }

    async find(id: GameId): Promise<Game | undefined> {
        // TODO: SELECT the game row (+ players, however you stored them),
        // then this.cellRepository.findByGameId(id), then GamePersistenceMap.toDomain
        throw new Error("not implemented");
    }

    async delete(id: GameId): Promise<void> {
        // TODO: DELETE FROM games WHERE id = $1 (cells should cascade —
        // check the ON DELETE behavior you set in the migration)
        throw new Error("not implemented");
    }
}
