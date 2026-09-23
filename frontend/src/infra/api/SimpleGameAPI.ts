import type {GameAPI} from "@/domain/shared/api/GameAPI.ts";
import type {GameRaw} from "@/domain/Game/Game.ts";
import type {GameId} from "@/domain/Game/GameId.ts";
import {API} from "@/infra/api/API.ts";

export class SimpleGameAPI implements GameAPI {
    static path = '/games';

    async getGame(id: GameId) {
        return await API.get<GameRaw>(`${SimpleGameAPI.path}/${id.value}`);
    }

    async markCell(id: GameId, body: { position: number }) {
        return await API.put<GameRaw>(`${SimpleGameAPI.path}/${id.value}/mark`, body);
    }

    async leaveGame(id: GameId) {
        return await API.put<GameRaw>(`${SimpleGameAPI.path}/${id.value}/leave`, {});
    }
}
