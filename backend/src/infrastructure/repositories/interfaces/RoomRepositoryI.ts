import {RoomId} from "../../../domain/Room/RoomId";
import {RoomPersistence} from "../../../application/Room/RoomMap";

import {PageSize, PageToken, PaginatedResponse} from "../../../shared/Pagination";

export interface RoomRepositoryI {
    save(roomPersistence: RoomPersistence): Promise<void>;
    find(roomId: RoomId): Promise<RoomPersistence|undefined>;
    delete(roomId: RoomId): Promise<void>;
    getPage(pageToken: PageToken, pageSize: PageSize): Promise<PaginatedResponse<RoomPersistence>>;
}
