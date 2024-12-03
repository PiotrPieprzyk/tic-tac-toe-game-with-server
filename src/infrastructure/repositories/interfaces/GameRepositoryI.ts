import {GameId} from "../../../domain/Game/valueObject/GameId";
import {GamePersistence} from "../../../application/Game/GameMap";

export interface GameRepositoryI {
    save(roomPersistence: GamePersistence): Promise<void>;
    find(roomId: GameId): Promise<GamePersistence|undefined>;
    delete(roomId: GameId): Promise<void>;
}
