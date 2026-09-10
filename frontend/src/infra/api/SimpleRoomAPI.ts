import type {
    RoomAPI,
    RoomAPIGetRoomsOptions,
    RoomAPIJoinRequest,
    RoomAPILeaveRequest,
    RoomAPIListResponseRaw,
    RoomAPIResponseRaw,
    RoomAPIUpdateRequest
} from "../../domain/shared/api/RoomAPI.ts";
import {API} from "./API.ts";
import type {RoomId} from "../../domain/Room/RoomId.ts";

export class SimpleRoomAPI implements RoomAPI {
    static path = '/rooms';

    async addRoom(body){
        return await API.post<RoomAPIResponseRaw>(`${SimpleRoomAPI.path}`, body);
    }

    async getRoom(id: RoomId) {
        return await API.get<RoomAPIResponseRaw>(`${SimpleRoomAPI.path}/${id}`);
    }

    async getRooms(options?: RoomAPIGetRoomsOptions) {
        const queries: string[] = [];
        if (options?.pageToken) {
            queries.push(`pageToken=${options.pageToken}`);
        }
        if (options?.userId) {
            queries.push(`userId=${options.userId.value}`);
        }
        return await API.get<RoomAPIListResponseRaw>(`${SimpleRoomAPI.path}`, {queries});
    }

    async updateRoom(id: RoomId, body: RoomAPIUpdateRequest) {
        return await API.put<RoomAPIResponseRaw>(`${SimpleRoomAPI.path}/${id}`, body);
    }

    async userJoinRoom(id: RoomId, body: RoomAPIJoinRequest) {
        return await API.put<RoomAPIResponseRaw>(`${SimpleRoomAPI.path}/${id}/join`, body);
    }

    async userLeaveRoom(id: RoomId, body: RoomAPILeaveRequest) {
        return await API.put<undefined>(`${SimpleRoomAPI.path}/${id}/leave`, body);
    }

    async deleteRoom(id: RoomId) {
        return await API.delete<undefined>(`${SimpleRoomAPI.path}/${id}`);
    }
}