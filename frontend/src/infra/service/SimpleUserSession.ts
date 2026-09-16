import type {UserSession} from "@/domain/shared/service/UserSession.ts";
import type {UserId} from "@/domain/User/UserId.ts";

export class SimpleUserSession implements UserSession {
    userId: UserId;
    private readonly listeners = new Set<() => void>();

    constructor(userId: UserId) {
        this.userId = userId;
    }

    setUserId(userId: UserId): void {
        this.userId = userId;
        this.listeners.forEach((listener) => listener());
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
}