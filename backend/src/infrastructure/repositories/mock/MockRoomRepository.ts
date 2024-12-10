import {RoomRepositoryI} from "../interfaces/RoomRepositoryI";
import {MockRoomDatabase} from "../../databases/mock/MockRoomDatabase";
import {RoomId} from "../../../domain/Room/RoomId";
import {RoomPersistence} from "../../../application/Room/RoomMap";
import {PageSize, PageToken, PaginatedResponse} from "../../../shared/Pagination";

type Id = RoomId; 
type Persistence = RoomPersistence;

let roomRepository: MockRoomRepository;

export class MockRoomRepository implements RoomRepositoryI {
    private database: MockRoomDatabase;
    
    constructor() {
        this.database = new MockRoomDatabase()
    }
    
    static create(): MockRoomRepository {
        if(!roomRepository) {
            roomRepository = new MockRoomRepository();
        }
        return roomRepository;
    }

    async save(persistence: Persistence): Promise<void> {
        const id = persistence.id;
        const exits = id ? await this.find(RoomId.create(id)) : false;
        if (exits) {
            await this.database.edit(id, persistence)
            return
        }
        await this.database.save(persistence)
    }
    
    async find (id: Id): Promise<Persistence|undefined> {
        return await this.database.find(id.value)
    }
    
    async delete (id: Id): Promise<void> {
        await this.database.delete(id.value)
    }

    async getAll (): Promise<Persistence[]> {
        return await this.database.getAll()
    }
    
    async getPage (pageToken: PageToken, pageSize: PageSize): Promise<PaginatedResponse<Persistence>> {
        return await this.database.getPage<Persistence>(pageToken, pageSize)
    }
    
    async getTotalSize (): Promise<number> {
        return await this.database.getLength()
    }
}
