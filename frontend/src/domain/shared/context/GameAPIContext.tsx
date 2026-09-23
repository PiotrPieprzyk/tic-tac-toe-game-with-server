import {createContext, useContext, type ReactElement, type ReactNode} from "react";
import type {GameAPI} from "@/domain/shared/api/GameAPI.ts";

const GameAPIContext = createContext<GameAPI | null>(null);

export function GameAPIProvider({gameAPI, children}: { gameAPI: GameAPI, children: ReactNode }): ReactElement {
    return (
        <GameAPIContext.Provider value={gameAPI}>
            {children}
        </GameAPIContext.Provider>
    );
}

export function useGameAPI(): GameAPI {
    const gameAPI = useContext(GameAPIContext);
    if (!gameAPI) {
        throw new Error("useGameAPI must be used within a GameAPIProvider");
    }
    return gameAPI;
}
