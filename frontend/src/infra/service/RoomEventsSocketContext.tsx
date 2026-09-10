import {createContext, useContext, type ReactElement, type ReactNode} from "react";
import type {RoomEventsSocket} from "../../domain/shared/service/RoomEventsSocket.ts";

const RoomEventsSocketContext = createContext<RoomEventsSocket | null>(null);

export function RoomEventsSocketProvider({roomEventsSocket, children}: { roomEventsSocket: RoomEventsSocket, children: ReactNode }): ReactElement {
    return (
        <RoomEventsSocketContext.Provider value={roomEventsSocket}>
            {children}
        </RoomEventsSocketContext.Provider>
    );
}

export function useRoomEventsSocket(): RoomEventsSocket {
    const roomEventsSocket = useContext(RoomEventsSocketContext);
    if (!roomEventsSocket) {
        throw new Error("useRoomEventsSocket must be used within a RoomEventsSocketProvider");
    }
    return roomEventsSocket;
}
