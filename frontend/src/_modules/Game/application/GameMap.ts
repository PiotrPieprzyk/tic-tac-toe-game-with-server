import {GameStatusEnum} from "@/_modules/Game/domain/GameStatus";
import {GameResultEnum} from "@/_modules/Game/domain/GameResults";


export type GamePersistence = {
    id?: string,
    status: GameStatusEnum,
    activePlayerId?: string,
    result?: GameResultEnum,
    winnerPlayerId?: string,
    roomId: string,
}

export class GameMap {
    static toPersistence(game: Game): GamePersistence {
        return {
            id: game.id.value,
            status: game.status.value,
            activePlayerId: game.activePlayerId?.value,
            result: game.result?.value,
            winnerPlayerId: game.winnerPlayerId?.value,
            roomId: game.roomId.value,
        };
    }
}

