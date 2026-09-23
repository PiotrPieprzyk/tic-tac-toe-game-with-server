import type {CSSProperties, ReactElement} from "react";
import type {GameRaw, MarkRaw, PlayerRaw} from "@/domain/Game/Game.ts";
import {GameStatusEnum} from "@/domain/Game/GameStatus.ts";
import {GameResultEnum} from "@/domain/Game/GameResult.ts";
import {getWinningLine} from "@/app/Game/GamePage/gameSelectors.ts";

interface BoardProps {
    game: GameRaw;
    myPlayer: PlayerRaw | undefined;
    onMark: (position: number) => void;
}

const WIN_LINE_STYLES: Record<string, CSSProperties> = {
    '0,1,2': {top: '16.66%', left: '0', right: '0', height: '4px', transform: 'translateY(-100%)'},
    '3,4,5': {top: '50%', left: '0', right: '0', height: '4px', transform: 'translateY(-100%)'},
    '6,7,8': {top: '84.33%', left: '0', right: '0', height: '4px', transform: 'translateY(-100%)'},
    '0,3,6': {left: '16.66%', top: '0', bottom: '0', width: '4px', transform: 'translateX(-50%)'},
    '1,4,7': {left: '50%', top: '0', bottom: '0', width: '4px', transform: 'translateX(-50%)'},
    '2,5,8': {left: '83.33%', top: '0', bottom: '0', width: '4px', transform: 'translateX(-50%)'},
    '0,4,8': {top: '50%', left: '50%', width: '140%', height: '4px', transform: 'translate(-50%, -50%) rotate(45deg)'},
    '2,4,6': {top: '50%', left: '50%', width: '140%', height: '4px', transform: 'translate(-50%, -50%) rotate(-45deg)'},
};

function nonWinningMarkColor(mark: MarkRaw | undefined): string {
    if (mark === 'X') return 'text-x-mark';
    if (mark === 'O') return 'text-text-faint';
    return 'text-empty-cell';
}

function inProgressMarkColor(mark: MarkRaw | undefined, activePlayerMark: MarkRaw | undefined): string {
    if (!mark) return 'text-empty-cell';
    return mark === activePlayerMark ? 'text-primary' : 'text-x-mark';
}

export function Board({game, myPlayer, onMark}: BoardProps): ReactElement {
    const markByPosition = new Map(game.cells.map((cell) => [cell.position, cell.mark]));
    const winner = game.players.find((player) => player.id === game.winnerId);
    const winningLine = game.result === GameResultEnum.WIN ? getWinningLine(game.cells, winner?.mark) : null;
    const activePlayerMark = game.players.find((player) => player.id === game.activePlayerId)?.mark;

    return (
        <div data-testid="board" className="bg-primary/25 p-5">
            <div className="relative grid grid-cols-3 gap-0.5">
                {Array.from({length: 9}, (_, position) => {
                    const mark = markByPosition.get(position);
                    const isWinningCell = winningLine?.includes(position) ?? false;
                    let colorClass: string;
                    let glow = false;
                    if (game.result === GameResultEnum.WIN) {
                        colorClass = isWinningCell ? 'text-primary' : nonWinningMarkColor(mark);
                        glow = isWinningCell;
                    } else if (game.result === GameResultEnum.DRAW) {
                        colorClass = 'text-text-muted';
                    } else {
                        colorClass = inProgressMarkColor(mark, activePlayerMark);
                        glow = game.status === GameStatusEnum.IN_PROGRESS && !!mark && mark === activePlayerMark;
                    }
                    const disabled = !(game.status === GameStatusEnum.IN_PROGRESS && game.activePlayerId === myPlayer?.id && !mark);
                    const sizeClass = mark ? 'text-[30px] font-bold' : 'text-body';
                    const glowClass = glow ? '[text-shadow:0_0_12px_currentColor]' : '';
                    return (
                        <button
                            key={position}
                            type="button"
                            data-testid="cell"
                            disabled={disabled}
                            onClick={() => onMark(position)}
                            className={`aspect-square flex items-center justify-center bg-page-background font-mono ${sizeClass} ${colorClass} ${glowClass} disabled:cursor-not-allowed`}
                        >
                            {mark ?? '_'}
                        </button>
                    );
                })}
                {winningLine && (
                    <div
                        data-testid="winLine"
                        className="absolute bg-primary shadow-[0_0_10px_2px_var(--color-primary)]"
                        style={WIN_LINE_STYLES[winningLine.join(',')]}
                    />
                )}
            </div>
        </div>
    );
}
