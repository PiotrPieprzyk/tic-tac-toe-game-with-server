import {PlayerPersistence} from "../../../application/Game/PlayerMap";
import {PlayerId} from "../../../domain/Game/Player/PlayerId";

export interface PlayerRepositoryI {
    save(playerPersistence: PlayerPersistence): Promise<void>;

    find(playerId: PlayerId): Promise<PlayerPersistence | undefined>;

    delete(playerId: PlayerId): Promise<void>;
}
