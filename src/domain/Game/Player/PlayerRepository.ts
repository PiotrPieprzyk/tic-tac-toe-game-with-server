import {GameId} from "../valueObject/GameId";
import {PlayerId} from "./PlayerId";
import {PlayerPersistence} from "./PlayerMap";

export interface PlayerRepositoryI {
    save(cellPersistence: PlayerPersistence): Promise<void>;
    find(cellId: PlayerId): Promise<PlayerPersistence|undefined>;
    delete(cellId: PlayerId): Promise<void>;
}

export class PlayerRepository implements PlayerRepositoryI{
    async save(gamePersistance: PlayerPersistence) {
        //
    }
    async find(gameId: GameId): Promise<PlayerPersistence> {
        //
    }
    async delete(gameId: GameId) {
        //
    }
}
