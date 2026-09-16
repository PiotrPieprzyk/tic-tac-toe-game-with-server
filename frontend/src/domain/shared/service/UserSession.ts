import type {UserId} from "@/domain/User/UserId.ts";

export interface UserSession {
    readonly userId: UserId;
    readonly userName: string | null;

    setUser(userId: UserId, userName: string): void;

    subscribe(listener: () => void): () => void;
}