import {CommonError, type SuccessResponse} from "./APICommon.ts";
import type {UserRaw} from "../../User/User.ts";
import type {GameStatusEnum} from "../../Game/GameStatus.ts";
import type {RoomId} from "../../Room/RoomId.ts";
import type {UserId} from "../../User/UserId.ts";

export type RoomAPIResponseRaw = {
    id: string,
    name: string
    hostId: string
    activeGameId: string
    users: UserRaw[]
    status: GameStatusEnum
}

export type RoomAPIResponse = SuccessResponse<RoomAPIResponseRaw>

export type RoomAPIAddRequest = {
    name: string;
    hostId: UserId;
    usersIds: UserId[];
}

export type RoomAPIUpdateRequest = {
    name?: string;
    usersIds?: UserId[];
}

export type RoomAPIJoinRequest = {
    userId: UserId;
}

export type RoomAPILeaveRequest = {
    userId: UserId;
}


export type RoomAPIDeletedResponse = SuccessResponse<undefined>;

export type RoomAPIListResponseRaw = {
    rooms: RoomAPIResponseRaw[];
    nextPageToken: string | null;
}

export type RoomAPIListResponse = SuccessResponse<RoomAPIListResponseRaw>

export type RoomAPIGetRoomsOptions = {
    pageToken?: string;
    userId?: UserId;
}

export interface RoomAPI {
    addRoom(body: RoomAPIAddRequest): Promise<RoomAPIResponse | CommonError>;

    getRoom(roomId: RoomId): Promise<RoomAPIResponse | CommonError>;

    getRooms(options?: RoomAPIGetRoomsOptions): Promise<RoomAPIListResponse | CommonError>;

    updateRoom(roomId: RoomId, body: RoomAPIUpdateRequest): Promise<RoomAPIResponse | CommonError>;

    userJoinRoom(roomId: RoomId, body: RoomAPIJoinRequest): Promise<RoomAPIResponse | CommonError>;

    userLeaveRoom(roomId: RoomId, body: RoomAPILeaveRequest): Promise<{} | CommonError>;

    deleteRoom(roomId: RoomId): Promise<RoomAPIDeletedResponse | CommonError>;
}
