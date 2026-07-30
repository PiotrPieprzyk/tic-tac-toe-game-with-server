import {GameId} from "@/domain/Game/valueObject/GameId";
import {Game} from "@/domain/Game/Game";

export interface GameRepository {
    save(game: Game): Promise<void>;
    find(gameId: GameId): Promise<Game | undefined>;
    delete(gameId: GameId): Promise<void>;
}
