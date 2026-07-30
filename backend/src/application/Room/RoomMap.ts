import {Room} from "@/domain/Room/Room";
import {UserDTO} from "@/application/User/UserMap";
import {GameStatusEnum} from "@/domain/Game/valueObject/GameStatus";

export type RoomDTO = {
    id: string,
    name: string,
    hostId: string,
    activeGameId?: string,
    users: {
        id: string,
        name: string
    }[],
    status: GameStatusEnum
}

export class RoomMap {
    static toDTO(room: Room, userDTO: UserDTO[], gameStatus?: GameStatusEnum): RoomDTO {
        return {
            id: room.id.value,
            name: room.name.value,
            hostId: room.hostId.value,
            users: userDTO.map(u => ({id: u.id, name: u.name})),
            activeGameId: room.activeGameId?.value,
            status: gameStatus || GameStatusEnum.WAITING_FOR_PLAYERS
        };
    }
}
