import type {UserSession} from "@/domain/shared/service/UserSession.ts";
import {UserId} from "@/domain/User/UserId.ts";

const STORAGE_KEY = "userSession";

interface StoredUserSession {
    userId: string;
    userName: string;
}

export class SimpleUserSession implements UserSession {
    userId: UserId;
    userName: string | null;
    private readonly listeners = new Set<() => void>();

    constructor(userId: UserId) {
        const stored = SimpleUserSession.readFromStorage();
        this.userId = stored ? UserId.create(stored.userId) : userId;
        this.userName = stored?.userName ?? null;
    }

    setUser(userId: UserId, userName: string): void {
        this.userId = userId;
        this.userName = userName;
        SimpleUserSession.writeToStorage({userId: userId.value, userName});
        this.listeners.forEach((listener) => listener());
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private static readFromStorage(): StoredUserSession | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (typeof parsed?.userId !== "string" || typeof parsed?.userName !== "string") return null;
            return parsed;
        } catch {
            return null;
        }
    }

    private static writeToStorage(session: StoredUserSession): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch {
            // localStorage may be unavailable (e.g. private browsing); session still works in-memory.
        }
    }
}
