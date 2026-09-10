import {createContext, useContext, type ReactElement, type ReactNode} from "react";
import type {RoomAPI} from "../../domain/shared/api/RoomAPI.ts";

const RoomAPIContext = createContext<RoomAPI | null>(null);

export function RoomAPIProvider({roomAPI, children}: { roomAPI: RoomAPI, children: ReactNode }): ReactElement {
    return (
        <RoomAPIContext.Provider value={roomAPI}>
            {children}
        </RoomAPIContext.Provider>
    );
}

export function useRoomAPI(): RoomAPI {
    const roomAPI = useContext(RoomAPIContext);
    if (!roomAPI) {
        throw new Error("useRoomAPI must be used within a RoomAPIProvider");
    }
    return roomAPI;
}
