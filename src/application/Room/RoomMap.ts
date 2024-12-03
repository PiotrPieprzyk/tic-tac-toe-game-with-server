import {Room} from "../../domain/Room/Room";
import {GameRepository} from "../../infrastructure/repositories/interfaces/GameRepository";
import {Game} from "../../domain/Game/Game";
import {UserPersistence} from "../../infrastructure/repositories/interfaces/UserRepository";
import {UserDTO} from "../User/UserMap";
import {GamePersistence} from "../Game/GameMap";

export type RoomPersistence = {
    id?: string,
    name: string,
    hostId: string,
    activeGameId?: string,
    usersIds: string[],
    updatedTimestamp: number,
}

export type RoomDTO = {
    id: string,
    name: string,
    hostId: string,
    activeGameId?: string,
    users: {
        id: string,
        name: string
    }[],
    status: string
}

export class RoomMap {
    static toPersistence(room: Room): RoomPersistence {
        return {
            id: room.id.value,
            name: room.name.value,
            hostId: room.hostId.value,
            usersIds: room.usersIds.map(u => u.value),
            activeGameId: room.activeGameId?.value,
            updatedTimestamp: room.updatedTimestamp.toPersistent()
        };
    }

    static async toDTO(room: Room, userDTO: UserDTO[], gamePersistence?: GamePersistence,): Promise<RoomDTO> {
        return {
            id: room.id.value,
            name: room.name.value,
            hostId: room.hostId.value,
            users: userDTO.map(u => ({id: u.id, name: u.name})),
            activeGameId: room.activeGameId?.value,
            status: gamePersistence?.status || "waiting"
        };
    }
}