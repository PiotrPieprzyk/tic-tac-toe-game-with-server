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

export class GamePersistenceMap {
    static toPersistence(game: Game): GamePersistence {
        return {
            id: game.id.value,
            status: game.status.value,
            players: game.players.map((player) => PlayerMap.toPersistence(player)),
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
}
