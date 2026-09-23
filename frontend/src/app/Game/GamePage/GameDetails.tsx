import type {ReactElement} from "react";
import {useUserSession} from "@/domain/shared/context/UserSessionContext.tsx";
import type {GameRaw} from "@/domain/Game/Game.ts";
import {StatusBar} from "@/comp/StatusBar/StatusBar.tsx";
import {Button} from "@/comp/Button/Button.tsx";
import {Notice} from "@/comp/Notice/Notice.tsx";
import {PlayerRow} from "@/app/Game/GamePage/PlayerRow.tsx";
import {Board} from "@/app/Game/GamePage/Board.tsx";
import {buildStatusText, statusGlow, statusTone} from "@/app/Game/GamePage/gameSelectors.ts";

interface GameDetailsProps {
    game: GameRaw;
    errorMessage: string | null;
    leftPlayerId: string | null;
    onMarkCell: (position: number) => void;
    onLeaveGame: () => void;
}

export function GameDetails({game, errorMessage, leftPlayerId, onMarkCell, onLeaveGame}: GameDetailsProps): ReactElement {
    const currentUserId = useUserSession();
    const myPlayer = game.players.find((player) => player.userId === currentUserId.value);

    return (
        <>
            <PlayerRow players={game.players} game={game} leftPlayerId={leftPlayerId}/>
            <StatusBar data-testid="gameStatus" tone={statusTone(game)} glow={statusGlow(game)}>
                {buildStatusText(game, game.players)}
            </StatusBar>
            <Board game={game} myPlayer={myPlayer} onMark={onMarkCell}/>
            {errorMessage && (
                <Notice data-testid="errorMessage" tone="danger" className="mx-[18px] mb-2">
                    {errorMessage}
                </Notice>
            )}
            <div className="px-[18px] pb-5">
                <Button data-testid="leaveGame" onClick={onLeaveGame} className="w-full">
                    LEAVE_GAME
                </Button>
            </div>
        </>
    );
}
