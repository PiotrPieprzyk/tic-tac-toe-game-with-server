import {GameStatusEnum} from "@/_modules/Game/domain/GameStatus";
import {Room} from "@/_modules/Room/domain/Room";
import {UserPropsRaw} from "@/_modules/User/domain/User";

export type RoomPersistence = {
    id: string,
    name: string,
    hostId: string,
    activeGameId?: string,
    users: UserPropsRaw[],
    status: GameStatusEnum
}

export class RoomMap {
    static toPersistence(room: Room): RoomPersistence {
        return {
            id: room.id,
            name: room.name.value,
            hostId: room.hostId,
            users: room.users.map(user => ({
                id: user.id,
                name: user.name.value,
            })),
            status: room.status.value,
            activeGameId: room.activeGameId,
        };
    }
}
