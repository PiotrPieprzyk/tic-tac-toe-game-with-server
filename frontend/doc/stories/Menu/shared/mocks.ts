import {vi} from 'vitest';
import type {Router} from '@/domain/shared/service/Router';
import type {RoomAPI} from '@/domain/shared/api/RoomAPI';
import type {RoomEventsHandlers, RoomEventsSocket} from '@/domain/shared/service/RoomEventsSocket';

export function createMockRouter(): Router {
    return {
        push: vi.fn(),
        replace: vi.fn(),
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
        ...overrides,
    };
}

export function createMockRoomEventsSocket(): {roomEventsSocket: RoomEventsSocket, getHandlers: () => RoomEventsHandlers} {
    let capturedHandlers: RoomEventsHandlers = {};
    const roomEventsSocket: RoomEventsSocket = {
        subscribe: vi.fn((handlers: RoomEventsHandlers) => {
            capturedHandlers = handlers;
            handlers.onConnect?.();
            return vi.fn();
        }),
    };
    return {roomEventsSocket, getHandlers: () => capturedHandlers};
}
