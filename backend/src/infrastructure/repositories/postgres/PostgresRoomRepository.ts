import {Pool} from "pg";
import {RoomRepository} from "@/domain/Room/RoomRepository";
import {RoomId} from "@/domain/Room/RoomId";
import {Room} from "@/domain/Room/Room";
import {UserId} from "@/domain/User/UserId";
import {PageSize, PageToken, PaginatedResponse} from "@/shared/Pagination";
import {PostgresConnection} from "@/infrastructure/databases/postgres/PostgresConnection";
import {RoomPersistenceMap} from "@/infrastructure/repositories/postgres/RoomPersistenceMap";

let roomRepository: PostgresRoomRepository;

export class PostgresRoomRepository implements RoomRepository {
    private pool: Pool;

    private constructor() {
        this.pool = PostgresConnection.getPool();
    }

    static create(): PostgresRoomRepository {
        if (!roomRepository) {
            roomRepository = new PostgresRoomRepository();
        }
        return roomRepository;
    }

    async save(room: Room): Promise<void> {
        // TODO: upsert the room row, then reconcile room_users against
        // RoomPersistenceMap.toPersistence(room).usersIds — likely a
        // transaction: DELETE the ones no longer present, INSERT the new ones.
        throw new Error("not implemented");
    }

    async find(id: RoomId): Promise<Room | undefined> {
        // TODO: SELECT the room row + its room_users, then RoomPersistenceMap.toDomain
        throw new Error("not implemented");
    }

    async findRoomByHostId(hostId: UserId): Promise<Room | undefined> {
        // TODO: SELECT ... WHERE host_id = $1
        throw new Error("not implemented");
    }

    async findRoomByUserId(userId: UserId): Promise<Room | undefined> {
        // TODO: SELECT rooms.* FROM rooms JOIN room_users ON ... WHERE room_users.user_id = $1
        throw new Error("not implemented");
    }

    async delete(id: RoomId): Promise<void> {
        // TODO: DELETE FROM rooms WHERE id = $1 (room_users rows should cascade —
        // check the ON DELETE behavior you set in the migration)
        throw new Error("not implemented");
    }

    async getPage(pageToken: PageToken, pageSize: PageSize): Promise<PaginatedResponse<Room>> {
        // TODO: SELECT ... ORDER BY <stable column> LIMIT/OFFSET (or keyset
        // pagination using pageToken directly), plus a COUNT(*) for totalSize.
        throw new Error("not implemented");
    }

    async getTotalSize(): Promise<number> {
        // TODO: SELECT COUNT(*) FROM rooms
        throw new Error("not implemented");
    }
}
