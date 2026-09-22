import type {CellRaw, GameRaw, MarkRaw, PlayerRaw} from '@/domain/Game/Game';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {Guid} from '@/domain/shared/models/GUID';
import {UserId} from '@/domain/User/UserId';

// GamePage constructs a GameId (a validated GUID) from the URL param, so story ids must be real GUIDs.
export const DEFAULT_GAME_ID = Guid.createNewGuid();
export const DEFAULT_ROOM_ID = Guid.createNewGuid();

// A player has its own id (the one used by activePlayerId / winnerId) and the id of the user behind it.
// The frontend matches the current user's session id against `userId` to know which player is "me".
export const X_USER_ID = UserId.create();
export const O_USER_ID = UserId.create();

export function buildPlayer(overrides: Partial<PlayerRaw> = {}): PlayerRaw {
    return {
        id: Guid.createNewGuid(),
        userId: Guid.createNewGuid(),
        userName: 'PLAYER',
        mark: 'X',
        ...overrides,
    };
}

export const X_PLAYER = buildPlayer({userId: X_USER_ID.value, userName: 'NEO_7734', mark: 'X'});
export const O_PLAYER = buildPlayer({userId: O_USER_ID.value, userName: 'CIPHER_88', mark: 'O'});

export function buildCells(marksByPosition: Partial<Record<number, MarkRaw>>): CellRaw[] {
    return Object.entries(marksByPosition).map(([position, mark]) => ({
        id: Guid.createNewGuid(),
        position: Number(position),
        mark: mark as MarkRaw,
    }));
}

export function buildGame(overrides: Partial<GameRaw> = {}): GameRaw {
    return {
        id: DEFAULT_GAME_ID,
        roomId: DEFAULT_ROOM_ID,
        players: [X_PLAYER, O_PLAYER],
        cells: [],
        status: GameStatusEnum.IN_PROGRESS,
        activePlayerId: X_PLAYER.id,
        updatedTimestamp: 1_700_000_000_000,
        ...overrides,
    };
}