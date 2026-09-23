import {Player} from "@/domain/Game/Player/Player";
import {PlayerId} from "@/domain/Game/Player/PlayerId";
import {User} from "@/domain/User/User";

export type PlayerPersistence = {
    id: string,
    userId: string,
    mark: string,
    gameId: string,
}

export type PlayerDTO = {
    id: string,
    userId: string,
    userName: string,
    mark: string
}

export class PlayerMap {
    static toPersistence(player: Player, gameId: string): PlayerPersistence {
        return {
            id: player.id.value,
            userId: player.userId.value,
            mark: player.mark.value,
            gameId
        };
    }
    static toDTO(player: Player, user: User): PlayerDTO {
        return {
            id: player.id.value,
            userId: player.userId.value,
            userName: user.name.value,
            mark: player.mark.value
        };
    }
}
