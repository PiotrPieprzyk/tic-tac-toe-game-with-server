import {API, CommonError} from "@/_modules/shared/api/API";
import {PaginatedResponse} from "@/_modules/shared/api/Pagination";


export type RoomAPIResponse = {
    id: string,
    name: string
    hostId: string
    activeGameId: string
    users: string[]
    status: string
}

export type PaginatedRoomAPIResponse = PaginatedResponse<RoomAPIResponse>;

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


export class RoomAPI {
    static async add(body: RoomAPIAddRequest): Promise<RoomAPIResponse | CommonError> {
        return await API.post<RoomAPIResponse>('/rooms', body);
    }
    
    static async get(roomId: string): Promise<RoomAPIResponse | CommonError> {
        return await API.get<RoomAPIResponse>(`/rooms/${roomId}`);
    }
    
    static async update(roomId: string, body: RoomAPIUpdateRequest): Promise<RoomAPIResponse | CommonError> {
        return await API.put<RoomAPIResponse>(`/rooms/${roomId}`, body);
    }
    
    static async join(roomId: string, body: RoomAPIJoinRequest): Promise<RoomAPIResponse | CommonError> {
        return await API.post<RoomAPIResponse>(`/rooms/${roomId}/join`, body);
    }
    
    static async leave(roomId: string, body: RoomAPILeaveRequest): Promise<RoomAPIResponse | CommonError> {
        return await API.post<RoomAPIResponse>(`/rooms/${roomId}/leave`, body);
    }
    
    static async getAll(): Promise<PaginatedRoomAPIResponse | CommonError> {
        return await API.get<PaginatedRoomAPIResponse>('/rooms');
    }

    static async delete(id: string) {
        return await API.delete<undefined>(`/rooms/${id}`);
    }
}
