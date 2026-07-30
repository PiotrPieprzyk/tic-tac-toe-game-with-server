import {RoomRepository} from "@/domain/Room/RoomRepository";
import {MockRoomDatabase} from "@/infrastructure/databases/mock/MockRoomDatabase";
import {RoomId} from "@/domain/Room/RoomId";
import {Room} from "@/domain/Room/Room";
import {UserId} from "@/domain/User/UserId";
import {PageSize, PageToken, PaginatedResponse} from "@/shared/Pagination";
import {RoomPersistence, RoomPersistenceMap} from "@/infrastructure/repositories/mock/RoomPersistenceMap";

let roomRepository: MockRoomRepository;

export class MockRoomRepository implements RoomRepository {
    private database: MockRoomDatabase;

    private constructor() {
        this.database = new MockRoomDatabase()
    }

    static create(): MockRoomRepository {
        if(!roomRepository) {
            roomRepository = new MockRoomRepository();
        }
        return roomRepository;
    }

    async save(room: Room): Promise<void> {
        const persistence = RoomPersistenceMap.toPersistence(room);
        const id = persistence.id;
        const exits = id ? await this.database.find(id) : false;
        if (exits) {
            await this.database.edit(id, persistence)
            return
        }
        await this.database.save(persistence)
    }

    async find(id: RoomId): Promise<Room | undefined> {
        const persistence: RoomPersistence | undefined = await this.database.find(id.value)
        return persistence ? RoomPersistenceMap.toDomain(persistence) : undefined;
    }

    async findRoomByHostId(hostId: UserId): Promise<Room | undefined> {
        const persistence: RoomPersistence | undefined = await this.database.findByHostId(hostId.value);
        return persistence ? RoomPersistenceMap.toDomain(persistence) : undefined;
    }

    async findRoomByUserId(userId: UserId): Promise<Room | undefined> {
        const persistence: RoomPersistence | undefined = await this.database.findByUserId(userId.value);
        return persistence ? RoomPersistenceMap.toDomain(persistence) : undefined;
    }

    async delete(id: RoomId): Promise<void> {
        await this.database.delete(id.value)
    }

    async getPage(pageToken: PageToken, pageSize: PageSize): Promise<PaginatedResponse<Room>> {
        const page = await this.database.getPage<RoomPersistence>(pageToken, pageSize)
        return {
            ...page,
            results: page.results.map(RoomPersistenceMap.toDomain)
        };
    }

    async getTotalSize(): Promise<number> {
        return await this.database.getLength()
    }
}
