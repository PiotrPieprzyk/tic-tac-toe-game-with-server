import {GameId} from "../../../domain/Game/valueObject/GameId";
import {CellId} from "../../../domain/Game/Cell/valueObject/CellId";
import {CellPersistence} from "../../../application/Game/CellMap";

export interface CellRepositoryI {
    save(cellPersistence: CellPersistence): Promise<void>;
    find(cellId: CellId): Promise<CellPersistence|undefined>;
    findByGameId(gameId: GameId): Promise<CellPersistence[]|[]>;
    delete(cellId: CellId): Promise<void>;
}
