import type {ReactElement} from "react";
import {useParams} from "react-router";
import {TerminalCard} from "@/comp/TerminalCard/TerminalCard.tsx";
import {EmptyState} from "@/comp/EmptyState/EmptyState.tsx";
import {useGame} from "@/app/Game/GamePage/useGame.ts";
import {GameDetails} from "@/app/Game/GamePage/GameDetails.tsx";

export function GamePage(): ReactElement {
    const {gameId} = useParams<{ gameId: string }>();
    const {game, loading, errorMessage, leftPlayerId, markCell, leaveGame} = useGame(gameId!);

    return (
        <TerminalCard titleBarLabel="game.sh" className="w-full max-w-[390px]">
            <div data-testid="gamePage" className="flex flex-col">
                {loading ? (
                    <EmptyState className="p-6">LOADING...</EmptyState>
                ) : game ? (
                    <GameDetails
                        game={game}
                        errorMessage={errorMessage}
                        leftPlayerId={leftPlayerId}
                        onMarkCell={markCell}
                        onLeaveGame={leaveGame}
                    />
                ) : null}
            </div>
        </TerminalCard>
    );
}
