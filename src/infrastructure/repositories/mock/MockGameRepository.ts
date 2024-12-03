import {GameRepositoryI} from "../interfaces/GameRepositoryI";
import {MockGameDatabase} from "../../databases/mock/MockGameDatabase";
import {GamePersistence} from "../../../application/Game/GameMap";
import {GameId} from "../../../domain/Game/valueObject/GameId";

type Id = GameId; 
type Persistence = GamePersistence;

export class MockGameRepository implements GameRepositoryI {
    private database: MockGameDatabase;
    
    constructor() {
        this.database = new MockGameDatabase()
    }
    
    async save (persistence: Persistence): Promise<void> {
        await this.database.save(persistence)
    }
    
    async find (id: Id): Promise<Persistence|undefined> {
        return await this.database.find(id.value)
    }
    
    async delete (id: Id): Promise<void> {
        await this.database.delete(id.value)
    }
}
