import {Game} from "@/domain/Game/Game";
import {GameStatusEnum} from "@/domain/Game/valueObject/GameStatus";
import {GameResultEnum} from "@/domain/Game/valueObject/GameResult";
import {PlayerPersistence} from "@/application/Game/PlayerMap";
import {CellPersistence} from "@/application/Game/CellMap";

export type GamePersistence = {
    id?: string,
    status: GameStatusEnum,
    players: PlayerPersistence[],
    activePlayerId?: string,
    result?: GameResultEnum,
    winnerPlayerId?: string,
    roomId: string,
    updatedTimestamp: number,
}

/**
 * Like the mock version, toDomain needs cells passed in separately (they're
 * fetched via PostgresCellRepository.findByGameId, same as
 * MockGameRepository.find does with the mock cell repository) — players
 * likewise come from PostgresPlayerRepository rather than living on this row.
 */
export class GamePersistenceMap {
    static toPersistence(game: Game): GamePersistence {
        // TODO: same as GamePersistenceMap in mock/ — this direction doesn't
        // change with the storage engine.
        throw new Error("not implemented");
    }

    static toDomain(persistence: GamePersistence, cells: CellPersistence[]): Game {
        // TODO: same as GamePersistenceMap in mock/.
        throw new Error("not implemented");
    }

    // TODO: add row <-> GamePersistence helpers.
}
