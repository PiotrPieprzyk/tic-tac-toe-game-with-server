import {Game} from "@/domain/Game/Game";
import {GameStatusEnum} from "@/domain/Game/valueObject/GameStatus";
import {GameResultEnum} from "@/domain/Game/valueObject/GameResult";
import {PlayerMap, PlayerPersistence} from "@/application/Game/PlayerMap";
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

export type GameRow = {
    id: string,
    status: GameStatusEnum,
    result: GameResultEnum | null,
    room_id: string,
    active_player_id: string | null,
    winner_player_id: string | null,
    updated_timestamp: string | number,
}

/**
 * Like the mock version, toDomain needs cells passed in separately (they're
 * fetched via PostgresCellRepository.findByGameId, same as
 * MockGameRepository.find does with the mock cell repository) — players
 * likewise come from PostgresPlayerRepository rather than living on this row.
 */
export class GamePersistenceMap {
    static toPersistence(game: Game): GamePersistence {
        return {
            id: game.id.value,
            status: game.status.value,
            players: game.players.map((player) => PlayerMap.toPersistence(player, game.id.value)),
            activePlayerId: game.activePlayerId?.value,
            result: game.result?.value,
            winnerPlayerId: game.winnerPlayerId?.value,
            roomId: game.roomId.value,
            updatedTimestamp: game.updatedTimestamp.toPersistent()
        };
    }

    static toDomain(persistence: GamePersistence, cells: CellPersistence[]): Game {
        return Game.create({
            id: persistence.id,
            roomId: persistence.roomId,
            players: persistence.players,
            cells,
            status: persistence.status,
            result: persistence.result,
            activePlayerId: persistence.activePlayerId,
            winnerPlayerId: persistence.winnerPlayerId,
            updatedTimestamp: persistence.updatedTimestamp,
        });
    }

    static fromRow(row: GameRow, players: PlayerPersistence[]): GamePersistence {
        return {
            id: row.id,
            status: row.status,
            players,
            activePlayerId: row.active_player_id ?? undefined,
            result: row.result ?? undefined,
            winnerPlayerId: row.winner_player_id ?? undefined,
            roomId: row.room_id,
            updatedTimestamp: Number(row.updated_timestamp),
        };
    }

    static toRow(persistence: GamePersistence) {
        return {
            id: persistence.id,
            status: persistence.status,
            result: persistence.result ?? null,
            room_id: persistence.roomId,
            active_player_id: persistence.activePlayerId ?? null,
            winner_player_id: persistence.winnerPlayerId ?? null,
            updated_timestamp: persistence.updatedTimestamp,
        };
    }
}
