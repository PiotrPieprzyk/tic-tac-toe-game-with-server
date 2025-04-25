import {Player} from "../../domain/Game/Player/Player";
import {PlayerId} from "../../domain/Game/Player/PlayerId";
import {User} from "../../domain/User/User";

export type PlayerPersistence = {
    id?: string,
    userId: string,
    mark: string,
}

export type PlayerDTO = {
    id: string,
    userName: string,
    mark: string
}

export class PlayerMap {
    static toPersistence(player: Player): PlayerPersistence {
        return {
            id: player.id.value,
            userId: player.userId.value,
            mark: player.mark.value
        };
    }
    static toDTO(player: Player, user: User): PlayerDTO {
        return {
            id: player.id.value,
            userName: user.name,
            mark: player.mark.value
        };
    }
}
