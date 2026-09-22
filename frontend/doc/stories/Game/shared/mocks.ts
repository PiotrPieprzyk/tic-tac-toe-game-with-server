import {vi} from 'vitest';
import type {Router} from '@/domain/shared/service/Router';
import type {GameAPI} from '@/domain/shared/api/GameAPI';
import type {GameEventsHandlers, GameEventsSocket} from '@/domain/shared/service/GameEventsSocket';
import type {UserSession} from '@/domain/shared/service/UserSession';
import type {UserId} from '@/domain/User/UserId';

export function createMockRouter(): Router {
    return {push: vi.fn(), replace: vi.fn()};
}

export function createMockUserSession(userId: UserId, userName: string | null = null): UserSession {
    return {userId, userName, setUser: vi.fn(), subscribe: vi.fn(() => vi.fn())};
}

export function createMockGameAPI(overrides: Partial<GameAPI> = {}): GameAPI {
    return {
        getGame: vi.fn(),
        markCell: vi.fn(),
        leaveGame: vi.fn(),
        ...overrides,
    };
}

export function createMockGameEventsSocket(): {gameEventsSocket: GameEventsSocket, getHandlers: () => GameEventsHandlers} {
    let capturedHandlers: GameEventsHandlers = {};
    const gameEventsSocket: GameEventsSocket = {
        subscribeToGame: vi.fn((_gameId: string, handlers: GameEventsHandlers) => {
            capturedHandlers = handlers;
            handlers.onConnect?.();
            return vi.fn();
        }),
    };
    return {gameEventsSocket, getHandlers: () => capturedHandlers};
}