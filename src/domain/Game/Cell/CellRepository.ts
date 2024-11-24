import {GameId} from "../valueObject/GameId";
import {CellId} from "./valueObject/CellId";
import {CellPersistence} from "./CellMap";

export interface CellRepositoryI {
    save(cellPersistence: CellPersistence): Promise<void>;
    find(cellId: CellId): Promise<CellPersistence|undefined>;
    findByGameId(gameId: GameId): Promise<CellPersistence[]|[]>;
    delete(cellId: CellId): Promise<void>;
}

export class CellRepository implements CellRepositoryI{
    async save(gamePersistance: CellPersistence) {
        //
    }
    async findByGameId(gameId: GameId): Promise<CellPersistence[] | []> {
        //
    }
    async find(gameId: GameId): Promise<CellPersistence | undefined> {
        //
    }
    async delete(gameId: GameId) {
        //
    }
}
