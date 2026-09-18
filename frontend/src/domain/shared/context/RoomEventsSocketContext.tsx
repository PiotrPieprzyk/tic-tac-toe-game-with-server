import {createContext, useContext, type ReactElement, type ReactNode} from "react";
import type {RoomEventsSocket} from "@/domain/shared/service/RoomEventsSocket.ts";

const noopRoomEventsSocket: RoomEventsSocket = {
    subscribe: () => () => {},
    subscribeToRoom: () => () => {},
};

const RoomEventsSocketContext = createContext<RoomEventsSocket>(noopRoomEventsSocket);

export function RoomEventsSocketProvider({roomEventsSocket, children}: { roomEventsSocket: RoomEventsSocket, children: ReactNode }): ReactElement {
    return (
        <RoomEventsSocketContext.Provider value={roomEventsSocket}>
            {children}
        </RoomEventsSocketContext.Provider>
    );
}

export function useRoomEventsSocket(): RoomEventsSocket {
    return useContext(RoomEventsSocketContext);
}
