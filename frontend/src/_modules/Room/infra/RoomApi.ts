import {API, CommonError, SuccessResponse} from "@/_modules/shared/api/API";
import {PaginatedResponse, PaginationRequest} from "@/_modules/shared/api/Pagination";
import {GameStatusEnum} from "@/_modules/Game/domain/GameStatus";
import {UserPropsRaw} from "@/_modules/User/domain/User";

export type RoomAPIResponseRaw = {
    id: string,
    name: string
    hostId: string
    activeGameId: string
    users: UserPropsRaw[]
    status: GameStatusEnum
}

export type RoomAPIResponse = SuccessResponse<RoomAPIResponseRaw>

export type PaginatedRoomsAPIResponseRaw = PaginatedResponse<RoomAPIResponseRaw>;

export type PaginatedRoomsAPIResponse = SuccessResponse<PaginatedRoomsAPIResponseRaw>;

export type RoomAPIAddRequest = {
    name: string;
    hostId: string;
    usersIds: string[];
}

export type RoomAPIUpdateRequest = {
    name?: string;
    usersIds?: string[];
}

export type RoomAPIJoinRequest = {
    userId: string;
}

export type RoomAPILeaveRequest = {
    userId: string;
}

export type RoomAPIGetRoomsRequest = PaginationRequest;


export type RoomAPIDeletedResponse = SuccessResponse<undefined>;

export interface RoomAPII {
    addRoom(body: RoomAPIAddRequest): Promise<RoomAPIResponse | CommonError>;

    getRoom(roomId: string): Promise<RoomAPIResponse | CommonError>;

    updateRoom(roomId: string, body: RoomAPIUpdateRequest): Promise<RoomAPIResponse | CommonError>;

    userJoinRoom(roomId: string, body: RoomAPIJoinRequest): Promise<RoomAPIResponse | CommonError>;

    userLeaveRoom(roomId: string, body: RoomAPILeaveRequest): Promise<RoomAPIResponse | CommonError>;

    getRooms(options?: RoomAPIGetRoomsRequest): Promise<PaginatedRoomsAPIResponse | CommonError>;

    deleteRoom(roomId: string): Promise<RoomAPIDeletedResponse | CommonError>;
}


export class RoomAPI implements RoomAPII {
    async addRoom(body: RoomAPIAddRequest): Promise<RoomAPIResponse | CommonError> {
        return await API.post<RoomAPIResponseRaw>('/rooms', body);
    }

    async getRoom(roomId: string): Promise<RoomAPIResponse | CommonError> {
        return await API.get<RoomAPIResponseRaw>(`/rooms/${roomId}`);
    }

    async updateRoom(roomId: string, body: RoomAPIUpdateRequest): Promise<RoomAPIResponse | CommonError> {
        return await API.put<RoomAPIResponseRaw>(`/rooms/${roomId}`, body);
    }

    async userJoinRoom(roomId: string, body: RoomAPIJoinRequest): Promise<RoomAPIResponse | CommonError> {
        return await API.put<RoomAPIResponseRaw>(`/rooms/${roomId}/join`, body);
    }

    async userLeaveRoom(roomId: string, body: RoomAPILeaveRequest): Promise<RoomAPIResponse | CommonError> {
        return await API.put<RoomAPIResponseRaw>(`/rooms/${roomId}/leave`, body);
    }

    async getRooms(options?: RoomAPIGetRoomsRequest): Promise<PaginatedRoomsAPIResponse | CommonError> {
        const queries = [];
        if (options?.pageToken) {
            queries.push(`pageToken=${options.pageToken.value}`);
        }
        if (options?.pageSize) {
            queries.push(`pageSize=${options.pageSize.value}`);
        }
        return await API.get<PaginatedRoomsAPIResponseRaw>('/rooms');
    }

    async deleteRoom(roomId: string): Promise<RoomAPIDeletedResponse | CommonError> {
        return await API.delete<undefined>(`/rooms/${roomId}`);
    }
}
