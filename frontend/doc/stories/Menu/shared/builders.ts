import type {RoomAPIResponseRaw} from '@/domain/shared/api/RoomAPI';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {RoomId} from '@/domain/Room/RoomId';
import {UserId} from '@/domain/User/UserId';

export const DEFAULT_ROOM_ID = RoomId.create().value;
export const DEFAULT_HOST_ID = UserId.create().value;

export function buildRoom(overrides: Partial<RoomAPIResponseRaw> = {}): RoomAPIResponseRaw {
    return {
        id: DEFAULT_ROOM_ID,
        name: 'ROOM_NULL_PTR',
        hostId: DEFAULT_HOST_ID,
        activeGameId: '',
        users: [{id: DEFAULT_HOST_ID, name: 'PlayerOne'}],
        status: GameStatusEnum.WAITING_FOR_PLAYERS,
        ...overrides,
    };
}
