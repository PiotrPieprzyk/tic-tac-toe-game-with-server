import type {RoomAPIResponseRaw} from '@/domain/shared/api/RoomAPI';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {RoomId} from '@/domain/Room/RoomId';

// RoomPage constructs a RoomId (a validated GUID) from the URL param, so story room ids
// must be real GUIDs, unlike Menu's plain 'room-1' style ids.
export const DEFAULT_ROOM_ID = RoomId.create().value;

export function buildRoom(overrides: Partial<RoomAPIResponseRaw> = {}): RoomAPIResponseRaw {
    return {
        id: DEFAULT_ROOM_ID,
        name: 'ROOM_NULL_PTR',
        hostId: 'host-1',
        activeGameId: '',
        users: [{id: 'host-1', name: 'HostPlayer'}],
        status: GameStatusEnum.WAITING_FOR_PLAYERS,
        ...overrides,
    };
}
