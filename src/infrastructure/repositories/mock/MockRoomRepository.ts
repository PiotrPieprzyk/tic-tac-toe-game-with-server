import {RoomRepositoryI} from "../interfaces/RoomRepositoryI";
import {MockRoomDatabase} from "../../databases/mock/MockRoomDatabase";
import {RoomId} from "../../../domain/Room/RoomId";
import {RoomPersistence} from "../../../application/Room/RoomMap";

type Id = RoomId; 
type Persistence = RoomPersistence;

export class MockRoomRepository implements RoomRepositoryI {
    private database: MockRoomDatabase;
    
    constructor() {
        this.database = new MockRoomDatabase()
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
