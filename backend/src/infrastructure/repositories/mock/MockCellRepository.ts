import {CellRepositoryI} from "../interfaces/CellRepositoryI";
import {CellId} from "../../../domain/Game/Cell/valueObject/CellId";
import {MockCellDatabase} from "../../databases/mock/MockCellDatabase";
import {CellPersistence} from "../../../application/Game/CellMap";
import {GameId} from "../../../domain/Game/valueObject/GameId";

type Id = CellId;
type Persistence = CellPersistence;

export class MockCellRepository implements CellRepositoryI {
    private database: MockCellDatabase;

    constructor() {
        this.database = new MockCellDatabase()
    }

    async save (persistence: Persistence): Promise<void> {
        await this.database.save(persistence)
    }

    async find (id: Id): Promise<Persistence|undefined> {
        return await this.database.find(id.value)
    }
    
    async findByGameId (gameId: GameId): Promise<Persistence[]|[]> {
        return await this.database.findByGameId(gameId.value)
    }

    async delete (id: Id): Promise<void> {
        await this.database.delete(id.value)
    }
}
