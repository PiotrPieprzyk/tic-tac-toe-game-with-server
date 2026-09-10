import type {RoomAPIResponseRaw} from "../api/RoomAPI.ts";

export type RoomEventsHandlers = {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onRoomAdded?: (room: RoomAPIResponseRaw) => void;
    onRoomEdited?: (room: RoomAPIResponseRaw) => void;
    onRoomDeleted?: (roomId: string) => void;
}

export interface RoomEventsSocket {
    subscribe(handlers: RoomEventsHandlers): () => void;
}
