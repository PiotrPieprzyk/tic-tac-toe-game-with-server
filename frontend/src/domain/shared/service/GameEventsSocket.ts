import type {GameRaw} from "@/domain/Game/Game.ts";

export type GameEventsHandlers = {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onGameLastTurn?: (game: GameRaw) => void;
    onGameEnded?: (game: GameRaw) => void;
    onGameDeleted?: (gameId: string) => void;
}

export interface GameEventsSocket {
    subscribeToGame(gameId: string, handlers: GameEventsHandlers): () => void;
}
