import {Room} from "@/domain/Room/Room";

export type RoomPersistence = {
    id?: string,
    name: string,
    hostId: string,
    activeGameId?: string,
    usersIds: string[],
    updatedTimestamp: number,
}

export class RoomPersistenceMap {
    static toPersistence(room: Room): RoomPersistence {
        return {
            id: room.id.value,
            name: room.name.value,
            hostId: room.hostId.value,
            usersIds: room.usersIds.values.map(u => u.value),
            activeGameId: room.activeGameId?.value,
            updatedTimestamp: room.updatedTimestamp.toPersistent()
        };
    }

    static toDomain(persistence: RoomPersistence): Room {
        return Room.create({
            id: persistence.id,
            name: persistence.name,
            hostId: persistence.hostId,
            activeGameId: persistence.activeGameId,
            usersIds: persistence.usersIds,
            updatedTimestamp: persistence.updatedTimestamp,
        });
    }
}
