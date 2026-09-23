import type {GameStatusEnum} from "@/domain/Game/GameStatus.ts";
import type {GameResultEnum} from "@/domain/Game/GameResult.ts";

export type MarkRaw = 'X' | 'O';

export type CellRaw = {
    id: string;
    position: number;
    mark: MarkRaw;
};

export type PlayerRaw = {
    id: string;
    userId: string;
    userName: string;
    mark: MarkRaw;
};

export type GameRaw = {
    id: string;
    roomId: string;
    players: PlayerRaw[];
    cells: CellRaw[];
    status: GameStatusEnum;
    activePlayerId?: string;
    winnerId?: string;
    result?: GameResultEnum;
    updatedTimestamp: number;
};
