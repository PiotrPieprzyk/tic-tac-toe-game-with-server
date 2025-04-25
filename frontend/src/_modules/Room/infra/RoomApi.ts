import {API, CommonError, SuccessResponse} from "@/_modules/shared/api/API";
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


export type RoomAPIDeletedResponse = SuccessResponse<undefined>;

export interface RoomAPII {
    addRoom(body: RoomAPIAddRequest): Promise<RoomAPIResponse | CommonError>;

    getRoom(roomId: string): Promise<RoomAPIResponse | CommonError>;

    updateRoom(roomId: string, body: RoomAPIUpdateRequest): Promise<RoomAPIResponse | CommonError>;

    userJoinRoom(roomId: string, body: RoomAPIJoinRequest): Promise<RoomAPIResponse | CommonError>;

    userLeaveRoom(roomId: string, body: RoomAPILeaveRequest): Promise<{} | CommonError>;
    
    deleteRoom(roomId: string): Promise<RoomAPIDeletedResponse | CommonError>;
}


export class RoomAPI implements RoomAPII {
    static path = '/rooms';
    
    async addRoom(body: RoomAPIAddRequest): Promise<RoomAPIResponse | CommonError> {
        return await API.post<RoomAPIResponseRaw>(`${RoomAPI.path}`, body);
    }

    async getRoom(roomId: string): Promise<RoomAPIResponse | CommonError> {
        return await API.get<RoomAPIResponseRaw>(`${RoomAPI.path}/${roomId}`);
    }

    async updateRoom(roomId: string, body: RoomAPIUpdateRequest): Promise<RoomAPIResponse | CommonError> {
        return await API.put<RoomAPIResponseRaw>(`${RoomAPI.path}/${roomId}`, body);
    }

    async userJoinRoom(roomId: string, body: RoomAPIJoinRequest): Promise<RoomAPIResponse | CommonError> {
        return await API.put<RoomAPIResponseRaw>(`${RoomAPI.path}/${roomId}/join`, body);
    }

    async userLeaveRoom(roomId: string, body: RoomAPILeaveRequest): Promise<{} | CommonError> {
        return await API.put<undefined>(`${RoomAPI.path}/${roomId}/leave`, body);
    }

    async deleteRoom(roomId: string): Promise<RoomAPIDeletedResponse | CommonError> {
        return await API.delete<undefined>(`${RoomAPI.path}/${roomId}`);
    }
}
