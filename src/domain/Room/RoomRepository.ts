import {RoomId} from "./RoomId";
import {UserId} from "../User/UserId";
import {RoomPersistence} from "./RoomMap";

export interface RoomRepositoryI {
    save(roomPersistence: RoomPersistence): Promise<void>;
    find(roomId: RoomId): Promise<RoomPersistence|undefined>;
    delete(roomId: RoomId): Promise<void>;
}


export class RoomRepository implements RoomRepositoryI {
    
    async save(roomPersistance: RoomPersistence): Promise<void> {
        //
    }
    
    async find(roomId: RoomId): Promise<RoomPersistence|undefined> {
        //
    }
    
    async delete(roomId: RoomId): Promise<void> {
        //
    }
}
