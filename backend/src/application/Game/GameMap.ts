import {Game} from "@/domain/Game/Game";
import {GameStatusEnum} from "@/domain/Game/valueObject/GameStatus";
import {GameResultEnum} from "@/domain/Game/valueObject/GameResult";
import {PlayerDTO} from "@/application/Game/PlayerMap";
import {CellDTO} from "@/application/Game/CellMap";


export type gameDTO = {
    id: string,
    players: PlayerDTO[],
    cells: CellDTO[],
    status: GameStatusEnum,
    activePlayerId?: string,
    result?: GameResultEnum,
    winnerId?: string,
    roomId: string,
    updatedTimestamp: number,
}

export class GameMap {
    static toDTO(game: Game, playersDTOs: PlayerDTO[], cellsDTOs?: CellDTO[]): gameDTO {
        return {
            id: game.id.value,
            players: playersDTOs,
            cells: cellsDTOs || [],
            status: game.status.value,
            activePlayerId: game.activePlayerId?.value,
            result: game.result?.value,
            winnerId: game.winnerPlayerId?.value,
            roomId: game.roomId.value,
            updatedTimestamp: game.updatedTimestamp.toPersistent()
        }
    }
}
