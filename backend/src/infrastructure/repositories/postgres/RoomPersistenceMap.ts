import {Room} from "@/domain/Room/Room";

export type RoomPersistence = {
    id?: string,
    name: string,
    hostId: string,
    activeGameId?: string,
    usersIds: string[],
    updatedTimestamp: number,
}

export type RoomRow = {
    id: string,
    name: string,
    host_id: string,
    active_game_id: string | null,
    updated_timestamp: string | number,
}

/**
 * usersIds is the tricky one here: it's modeled as a room_users join table
 * (see migrations/1700000002_create_rooms.js), so building this shape back
 * from Postgres means a second query to collect the member ids — unlike the
 * mock, which just stores the array directly.
 */
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

    static fromRow(row: RoomRow, usersIds: string[]): RoomPersistence {
        return {
            id: row.id,
            name: row.name,
            hostId: row.host_id,
            activeGameId: row.active_game_id ?? undefined,
            usersIds,
            updatedTimestamp: Number(row.updated_timestamp),
        };
    }

    static toRow(persistence: RoomPersistence) {
        return {
            id: persistence.id,
            name: persistence.name,
            host_id: persistence.hostId,
            active_game_id: persistence.activeGameId ?? null,
            updated_timestamp: persistence.updatedTimestamp,
        };
    }
}
