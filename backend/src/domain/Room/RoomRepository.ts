import {RoomId} from "@/domain/Room/RoomId";
import {UserId} from "@/domain/User/UserId";
import {Room} from "@/domain/Room/Room";
import {PageSize, PageToken, PaginatedResponse} from "@/shared/Pagination";

export interface RoomRepository {
    save(room: Room): Promise<void>;
    find(roomId: RoomId): Promise<Room | undefined>;
    findRoomByHostId(hostId: UserId): Promise<Room | undefined>;
    findRoomByUserId(userId: UserId): Promise<Room | undefined>;
    delete(roomId: RoomId): Promise<void>;
    getPage(pageToken: PageToken, pageSize: PageSize): Promise<PaginatedResponse<Room>>;
    getTotalSize(): Promise<number>;
}
