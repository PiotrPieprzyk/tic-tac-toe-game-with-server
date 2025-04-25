import {Game} from "../../domain/Game/Game";
import {GameStatusEnum} from "../../domain/Game/valueObject/GameStatus";
import {GameResultEnum} from "../../domain/Game/valueObject/GameResult";
import {PlayerDTO, PlayerMap, PlayerPersistence} from "./PlayerMap";
import {CellDTO} from "./CellMap";
import {Player} from "../../domain/Game/Player/Player";


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

