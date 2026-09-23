import type {ReactElement} from "react";
import type {GameRaw, PlayerRaw} from "@/domain/Game/Game.ts";
import {GameStatusEnum} from "@/domain/Game/GameStatus.ts";
import {GameResultEnum} from "@/domain/Game/GameResult.ts";

interface PlayerRowProps {
    players: PlayerRaw[];
    game: GameRaw;
    leftPlayerId: string | null;
}

function playerColor(player: PlayerRaw, game: GameRaw, leftPlayerId: string | null): { name: string; mark: string } {
    if (game.result === GameResultEnum.PLAYER_LEFT_THE_GAME) {
        if (player.id === leftPlayerId) {
            return {name: 'text-danger line-through', mark: 'text-left-player-mark'};
        }
        return {name: 'text-draw-player-name', mark: 'text-text-muted'};
    }
    if (game.result === GameResultEnum.WIN) {
        return player.id === game.winnerId
            ? {name: 'text-primary', mark: 'text-primary'}
            : {name: 'text-text-faint', mark: 'text-text-faint'};
    }
    if (game.result === GameResultEnum.DRAW) {
        return {name: 'text-draw-player-name', mark: 'text-text-muted'};
    }
    if (game.status === GameStatusEnum.IN_PROGRESS && player.id === game.activePlayerId) {
        return {name: 'text-primary', mark: 'text-primary'};
    }
    return {name: 'text-text-primary', mark: 'text-text-faint'};
}

export function PlayerRow({players, game, leftPlayerId}: PlayerRowProps): ReactElement {
    return (
        <div className="flex border-b border-panel-border-subtle">
            {players.map((player) => {
                const {name, mark} = playerColor(player, game, leftPlayerId);
                return (
                    <div key={player.id} data-testid="player" className="flex flex-1 flex-col items-center gap-1 p-3">
                        <span data-testid="playerName" className={`font-mono text-body ${name}`}>
                            {player.userName}
                        </span>
                        <span data-testid="playerMark" className={`font-mono text-title ${mark}`}>
                            {player.mark}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
