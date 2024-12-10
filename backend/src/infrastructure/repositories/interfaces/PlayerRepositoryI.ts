import {PlayerPersistence} from "../../../application/Game/PlayerMap";
import {PlayerId} from "../../../domain/Game/Player/PlayerId";

export interface PlayerRepositoryI {
    save(cellPersistence: PlayerPersistence): Promise<void>;

    find(cellId: PlayerId): Promise<PlayerPersistence | undefined>;

    delete(cellId: PlayerId): Promise<void>;
}
