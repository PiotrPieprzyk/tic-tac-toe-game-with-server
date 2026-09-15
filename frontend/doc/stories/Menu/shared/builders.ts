import type {RoomAPIResponseRaw} from '../../../../src/domain/shared/api/RoomAPI';
import {GameStatusEnum} from '../../../../src/domain/Game/GameStatus';

export function buildRoom(overrides: Partial<RoomAPIResponseRaw> = {}): RoomAPIResponseRaw {
    return {
        id: 'room-1',
        name: 'ROOM_NULL_PTR',
        hostId: 'host-1',
        activeGameId: '',
        users: [{id: 'user-1', name: 'PlayerOne'}],
        status: GameStatusEnum.WAITING_FOR_PLAYERS,
        ...overrides,
    };
}
