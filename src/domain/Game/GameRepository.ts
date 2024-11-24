import {GameId} from "./valueObject/GameId";
import {GamePersistence} from "./GameMap";

export interface GameRepositoryI {
    save(roomPersistence: GamePersistence): Promise<void>;
    find(roomId: GameId): Promise<GamePersistence|undefined>;
    delete(roomId: GameId): Promise<void>;
}

export class GameRepository implements GameRepositoryI{
    async save(gamePersistance: GamePersistence) {
        //
    }
    async find(gameId: GameId): Promise<GamePersistence> {
        //
    }
    async delete(gameId: GameId) {
        //
    }
}
