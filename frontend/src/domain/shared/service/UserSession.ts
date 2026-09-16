import type {UserId} from "@/domain/User/UserId.ts";

export interface UserSession {
    readonly userId: UserId;

    setUserId(userId: UserId): void;

    subscribe(listener: () => void): () => void;
}