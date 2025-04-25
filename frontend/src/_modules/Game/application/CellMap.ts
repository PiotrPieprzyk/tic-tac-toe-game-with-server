import {Cell} from "../../domain/Game/Cell/Cell";

export type CellPersistence = {
    id?: string,
    mark: string,
    position: number,
    gameId: string
}

export type CellDTO = {
    id: string,
    mark: string,
    position: number,
}

export class CellMap {
    static toPersistence(cell: Cell): CellPersistence {
        return {
            id: cell.id.value,
            mark: cell.mark.value,
            position: cell.position.value,
            gameId: cell.gameId.value
        }
    }

    static toDTO(cell: Cell): CellDTO {
        return {
            id: cell.id.value,
            mark: cell.mark.value,
            position: cell.position.value,
        }
    }
}

