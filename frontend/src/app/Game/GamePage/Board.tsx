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
    '0,1,2': {top: '16.66%', left: '4%', right: '4%', height: '4px'},
    '3,4,5': {top: '50%', left: '4%', right: '4%', height: '4px'},
    '6,7,8': {top: '83.33%', left: '4%', right: '4%', height: '4px'},
    '0,3,6': {left: '16.66%', top: '4%', bottom: '4%', width: '4px'},
    '1,4,7': {left: '50%', top: '4%', bottom: '4%', width: '4px'},
    '2,5,8': {left: '83.33%', top: '4%', bottom: '4%', width: '4px'},
    '0,4,8': {top: '50%', left: '50%', width: '140%', height: '4px', transform: 'translate(-50%, -50%) rotate(45deg)'},
    '2,4,6': {top: '50%', left: '50%', width: '140%', height: '4px', transform: 'translate(-50%, -50%) rotate(-45deg)'},
};

function nonWinningMarkColor(mark: MarkRaw | undefined): string {
    if (mark === 'X') return 'text-x-mark';
    if (mark === 'O') return 'text-text-faint';
    return 'text-empty-cell';
}

function inProgressMarkColor(mark: MarkRaw | undefined): string {
    if (mark === 'X') return 'text-x-mark';
    if (mark === 'O') return 'text-primary';
    return 'text-empty-cell';
}

export function Board({game, myPlayer, onMark}: BoardProps): ReactElement {
    const markByPosition = new Map(game.cells.map((cell) => [cell.position, cell.mark]));
    const winner = game.players.find((player) => player.id === game.winnerId);
    const winningLine = game.result === GameResultEnum.WIN ? getWinningLine(game.cells, winner?.mark) : null;

    return (
        <div data-testid="board" className="relative grid grid-cols-3 gap-0.5 bg-primary/25 p-0.5">
            {Array.from({length: 9}, (_, position) => {
                const mark = markByPosition.get(position);
                let colorClass: string;
                if (game.result === GameResultEnum.WIN) {
                    colorClass = winningLine?.includes(position) ? 'text-primary' : nonWinningMarkColor(mark);
                } else if (game.result === GameResultEnum.DRAW) {
                    colorClass = 'text-text-muted';
                } else {
                    colorClass = inProgressMarkColor(mark);
                }
                const disabled = !(game.status === GameStatusEnum.IN_PROGRESS && game.activePlayerId === myPlayer?.id && !mark);
                return (
                    <button
                        key={position}
                        type="button"
                        data-testid="cell"
                        disabled={disabled}
                        onClick={() => onMark(position)}
                        className={`aspect-square bg-page-background font-mono text-title ${colorClass} disabled:cursor-not-allowed`}
                    >
                        {mark ?? '_'}
                    </button>
                );
            })}
            {winningLine && (
                <div
                    data-testid="winLine"
                    className="absolute bg-primary"
                    style={WIN_LINE_STYLES[winningLine.join(',')]}
                />
            )}
        </div>
    );
}
