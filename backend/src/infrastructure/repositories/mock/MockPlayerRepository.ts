import {PlayerRepositoryI} from "../interfaces/PlayerRepositoryI";
import {PlayerPersistence} from "../../../application/Game/PlayerMap";
import {GameId} from "../../../domain/Game/valueObject/GameId";

export class PlayerRepository implements PlayerRepositoryI {
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
