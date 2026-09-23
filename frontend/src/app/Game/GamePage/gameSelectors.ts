import type {CellRaw, GameRaw, MarkRaw, PlayerRaw} from "@/domain/Game/Game.ts";
import {GameStatusEnum} from "@/domain/Game/GameStatus.ts";
import {GameResultEnum} from "@/domain/Game/GameResult.ts";
import type {StatusBarTone} from "@/comp/StatusBar/StatusBar.tsx";

const WINNING_LINES: number[][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

export function isMyTurn(game: GameRaw, myPlayer: PlayerRaw | undefined): boolean {
    return game.status === GameStatusEnum.IN_PROGRESS && game.activePlayerId === myPlayer?.id;
}

export function getWinningLine(cells: CellRaw[], winnerMark: MarkRaw | undefined): number[] | null {
    if (!winnerMark) return null;
    const markByPosition = new Map(cells.map((cell) => [cell.position, cell.mark]));
    return WINNING_LINES.find((line) => line.every((position) => markByPosition.get(position) === winnerMark)) ?? null;
}

export function buildStatusText(game: GameRaw, players: PlayerRaw[]): string {
    if (game.status === GameStatusEnum.IN_PROGRESS) {
        const activePlayer = players.find((player) => player.id === game.activePlayerId);
        return `> AWAITING_INPUT: ${activePlayer?.userName}`;
    }
    if (game.result === GameResultEnum.WIN) {
        const winner = players.find((player) => player.id === game.winnerId);
        return `> GAME_OVER: ${winner?.userName}_WINS`;
    }
    if (game.result === GameResultEnum.DRAW) {
        return '> GAME_OVER: DRAW';
    }
    if (game.result === GameResultEnum.PLAYER_LEFT_THE_GAME) {
        return '> GAME_OVER: OPPONENT_DISCONNECTED';
    }
    return '';
}

export function statusTone(game: GameRaw): StatusBarTone {
    if (game.status === GameStatusEnum.IN_PROGRESS) return 'success';
    if (game.result === GameResultEnum.WIN) return 'success';
    if (game.result === GameResultEnum.DRAW) return 'warning';
    if (game.result === GameResultEnum.PLAYER_LEFT_THE_GAME) return 'danger';
    return 'neutral';
}

export function statusGlow(game: GameRaw): boolean {
    return game.result === GameResultEnum.WIN || game.result === GameResultEnum.PLAYER_LEFT_THE_GAME;
}
