import {createContext, useContext, type ReactElement, type ReactNode} from "react";
import type {GameEventsSocket} from "@/domain/shared/service/GameEventsSocket.ts";

const noopGameEventsSocket: GameEventsSocket = {
    subscribeToGame: () => () => {},
};

const GameEventsSocketContext = createContext<GameEventsSocket>(noopGameEventsSocket);

export function GameEventsSocketProvider({gameEventsSocket, children}: { gameEventsSocket: GameEventsSocket, children: ReactNode }): ReactElement {
    return (
        <GameEventsSocketContext.Provider value={gameEventsSocket}>
            {children}
        </GameEventsSocketContext.Provider>
    );
}

export function useGameEventsSocket(): GameEventsSocket {
    return useContext(GameEventsSocketContext);
}
