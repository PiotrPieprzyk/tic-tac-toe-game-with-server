import type {CommonError, SuccessResponse} from "@/domain/shared/api/APICommon.ts";
import type {GameRaw} from "@/domain/Game/Game.ts";
import type {GameId} from "@/domain/Game/GameId.ts";

export interface GameAPI {
    getGame(gameId: GameId): Promise<SuccessResponse<GameRaw> | CommonError>;
    markCell(gameId: GameId, body: { position: number }): Promise<SuccessResponse<GameRaw> | CommonError>;
    leaveGame(gameId: GameId): Promise<SuccessResponse<GameRaw> | CommonError>;
}
