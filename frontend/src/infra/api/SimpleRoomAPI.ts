import type {
    GameAPIResponseRaw,
    RoomAPI,
    RoomAPIGetRoomsOptions,
    RoomAPIJoinRequest,
    RoomAPILeaveRequest,
    RoomAPIListResponseRaw,
    RoomAPIResponseRaw,
    RoomAPIUpdateRequest
} from "@/domain/shared/api/RoomAPI.ts";
import {API} from "@/infra/api/API.ts";
import type {RoomId} from "@/domain/Room/RoomId.ts";

export class SimpleRoomAPI implements RoomAPI {
    static path = '/rooms';

    async addRoom(body){
        return await API.post<RoomAPIResponseRaw>(`${SimpleRoomAPI.path}`, body);
    }

    async getRoom(id: RoomId) {
        return await API.get<RoomAPIResponseRaw>(`${SimpleRoomAPI.path}/${id.value}`);
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
        const rawBody = {
            ...(body.name && {name: body.name}),
            ...(body.usersIds && {usersIds: body.usersIds?.map((id) => id.value)}),
        }
        return await API.put<RoomAPIResponseRaw>(`${SimpleRoomAPI.path}/${id.value}`, rawBody);
    }

    async userJoinRoom(id: RoomId, body: RoomAPIJoinRequest) {
        const rawBody = {
            userId: body.userId.value,
        }
        return await API.put<RoomAPIResponseRaw>(`${SimpleRoomAPI.path}/${id.value}/join`, rawBody);
    }

    async userLeaveRoom(id: RoomId, body: RoomAPILeaveRequest) {
        const rawBody = {
            userId: body.userId.value,
        }
        return await API.put<undefined>(`${SimpleRoomAPI.path}/${id.value}/leave`, rawBody);
    }

    async deleteRoom(id: RoomId) {
        return await API.delete<undefined>(`${SimpleRoomAPI.path}/${id.value}`);
    }

    async startGame(id: RoomId) {
        return await API.post<GameAPIResponseRaw>(`/games`, {roomId: id.value});
    }
}