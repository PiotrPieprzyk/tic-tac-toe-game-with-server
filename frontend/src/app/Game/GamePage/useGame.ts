import {useEffect, useRef, useState} from "react";
import {useGameAPI} from "@/domain/shared/context/GameAPIContext.tsx";
import {useGameEventsSocket} from "@/domain/shared/context/GameEventsSocketContext.tsx";
import {useRouter} from "@/domain/shared/context/RouterContext.tsx";
import {useUserSession} from "@/domain/shared/context/UserSessionContext.tsx";
import {CommonError} from "@/domain/shared/api/APICommon.ts";
import type {GameRaw, PlayerRaw} from "@/domain/Game/Game.ts";
import {GameResultEnum} from "@/domain/Game/GameResult.ts";
import {GameId} from "@/domain/Game/GameId.ts";
import {Guid} from "@/domain/shared/models/GUID.ts";

export function useGame(gameId: string) {
    const gameAPI = useGameAPI();
    const gameEventsSocket = useGameEventsSocket();
    const router = useRouter();
    const userId = useUserSession();

    const [game, setGame] = useState<GameRaw | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [leftPlayerId, setLeftPlayerId] = useState<string | null>(null);
    const knownPlayers = useRef<PlayerRaw[]>([]);

    useEffect(() => {
        let cancelled = false;
        gameAPI.getGame(GameId.create(gameId)).then((response) => {
            if (cancelled) return;
            if (response instanceof CommonError) {
                router.push('#/rooms');
                return;
            }
            knownPlayers.current = response.value.players;
            setGame(response.value);
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [gameAPI, gameId, router]);

    useEffect(() => {
        return gameEventsSocket.subscribeToGame(gameId, {
            onGameLastTurn: (updated) => {
                knownPlayers.current = updated.players;
                setLeftPlayerId(null);
                setGame(updated);
            },
            onGameEnded: (updated) => {
                if (updated.result === GameResultEnum.PLAYER_LEFT_THE_GAME) {
                    const missing = knownPlayers.current.find(
                        (player) => !updated.players.some((incoming) => incoming.id === player.id)
                    );
                    const mergedPlayers = knownPlayers.current.map(
                        (player) => updated.players.find((incoming) => incoming.id === player.id) ?? player
                    );
                    setLeftPlayerId(missing?.id ?? null);
                    knownPlayers.current = mergedPlayers;
                    setGame({...updated, players: mergedPlayers});
                    return;
                }
                knownPlayers.current = updated.players;
                setLeftPlayerId(null);
                setGame(updated);
            },
            onGameDeleted: () => {
                router.push('#/rooms');
            },
        });
    }, [gameEventsSocket, gameId, router]);

    async function markCell(position: number) {
        if (!game) return;
        const myPlayer = game.players.find((player) => player.userId === userId.value);
        if (!myPlayer) return;
        const opponent = game.players.find((player) => player.id !== myPlayer.id);
        const previousGame = game;
        const optimisticGame: GameRaw = {
            ...game,
            cells: [...game.cells, {id: Guid.createNewGuid(), position, mark: myPlayer.mark}],
            activePlayerId: opponent?.id,
        };
        setGame(optimisticGame);
        setErrorMessage(null);
        const response = await gameAPI.markCell(GameId.create(gameId), {position});
        if (response instanceof CommonError) {
            setGame(previousGame);
            setErrorMessage(response.message);
        }
    }

    async function leaveGame() {
        if (!game) return;
        const response = await gameAPI.leaveGame(GameId.create(gameId));
        if (response instanceof CommonError) {
            setErrorMessage(response.message);
            return;
        }
        router.push(`#/rooms/${game.roomId}`);
    }

    return {game, loading, errorMessage, leftPlayerId, markCell, leaveGame};
}
