import {PlayerPersistence} from "@/application/Game/PlayerMap";
import {PlayerId} from "@/domain/Game/Player/PlayerId";
import {GameId} from "@/domain/Game/valueObject/GameId";

export interface PlayerRepository {
    save(playerPersistence: PlayerPersistence): Promise<void>;

    find(playerId: PlayerId): Promise<PlayerPersistence | undefined>;

    findByGameId(gameId: GameId): Promise<PlayerPersistence[] | []>;

    delete(playerId: PlayerId): Promise<void>;
}
