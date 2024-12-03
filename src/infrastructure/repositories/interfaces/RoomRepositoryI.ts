import {RoomId} from "../../../domain/Room/RoomId";
import {UserId} from "../../../domain/User/UserId";
import {RoomPersistence} from "../../../application/Room/RoomMap";

export interface RoomRepositoryI {
    save(roomPersistence: RoomPersistence): Promise<void>;
    find(roomId: RoomId): Promise<RoomPersistence|undefined>;
    delete(roomId: RoomId): Promise<void>;
}
