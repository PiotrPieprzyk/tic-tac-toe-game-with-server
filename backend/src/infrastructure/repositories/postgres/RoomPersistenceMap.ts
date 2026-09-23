import {Room} from "@/domain/Room/Room";

export type RoomPersistence = {
    id?: string,
    name: string,
    hostId: string,
    activeGameId?: string,
    usersIds: string[],
    updatedTimestamp: number,
}

/**
 * usersIds is the tricky one here: if you modeled it as a room_users join
 * table (see migrations/1700000002_create_rooms.js), building this shape
 * back from Postgres means a second query (or a JOIN) to collect the
 * member ids — unlike the mock, which just stores the array directly.
 */
export class RoomPersistenceMap {
    static toPersistence(room: Room): RoomPersistence {
        // TODO: same as RoomPersistenceMap in mock/ — this direction doesn't
        // change with the storage engine.
        throw new Error("not implemented");
    }

    static toDomain(persistence: RoomPersistence): Room {
        // TODO: same as RoomPersistenceMap in mock/.
        throw new Error("not implemented");
    }

    // TODO: add row <-> RoomPersistence helpers, deciding how usersIds gets
    // assembled from the room_users rows.
}
