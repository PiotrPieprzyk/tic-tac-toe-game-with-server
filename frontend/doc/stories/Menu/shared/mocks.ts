import {vi} from 'vitest';
import type {Router} from '@/domain/shared/service/Router';
import type {RoomAPI, RoomAPIGetRoomsOptions, RoomAPIListResponseRaw} from '@/domain/shared/api/RoomAPI';
import {SuccessResponse} from '@/domain/shared/api/APICommon';
import type {RoomEventsHandlers, RoomEventsSocket} from '@/domain/shared/service/RoomEventsSocket';
import type {UserSession} from '@/domain/shared/service/UserSession';
import type {UserId} from '@/domain/User/UserId';

export function createMockRouter(): Router {
    return {
        push: vi.fn(),
        replace: vi.fn(),
    };
}

export function createMockUserSession(userId: UserId, userName: string | null = null): UserSession {
    return {
        userId,
        userName,
        setUser: vi.fn(),
        subscribe: vi.fn(() => vi.fn()),
    };
}

export function createMockRoomAPI(overrides: Partial<RoomAPI> = {}): RoomAPI {
    return {
        addRoom: vi.fn(),
        getRoom: vi.fn(),
        getRooms: vi.fn(),
        updateRoom: vi.fn(),
        userJoinRoom: vi.fn(),
        userLeaveRoom: vi.fn(),
        deleteRoom: vi.fn(),
        startGame: vi.fn(),
        ...overrides,
    };
}

// RoomList and RoomListHeader each look up the current user's own room independently
// (options.userId set), separately from the paginated room list (options.pageToken).
export function mockGetRooms(
    list: RoomAPIListResponseRaw,
    ownRoom: RoomAPIListResponseRaw = {results: [], nextPageToken: null},
): RoomAPI['getRooms'] {
    return vi.fn(async (options?: RoomAPIGetRoomsOptions) =>
        new SuccessResponse(options?.userId ? ownRoom : list)
    );
}

export function createMockRoomEventsSocket(): {roomEventsSocket: RoomEventsSocket, getHandlers: () => RoomEventsHandlers} {
    let capturedHandlers: RoomEventsHandlers = {};
    const roomEventsSocket: RoomEventsSocket = {
        subscribe: vi.fn((handlers: RoomEventsHandlers) => {
            capturedHandlers = handlers;
            handlers.onConnect?.();
            return vi.fn();
        }),
        subscribeToRoom: vi.fn(() => vi.fn()),
    };
    return {roomEventsSocket, getHandlers: () => capturedHandlers};
}
