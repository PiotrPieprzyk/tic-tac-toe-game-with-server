import {describe, expect, it, vi} from 'vitest';
import {waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CommonError, SuccessResponse} from '@/domain/shared/api/APICommon';
import type {GameAPIResponse} from '@/domain/shared/api/RoomAPI';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {UserId} from '@/domain/User/UserId';
import {createMockRoomAPI, createMockRoomEventsSocket, createMockRouter, createMockUserSession} from '@doc/stories/Room/shared/mocks';
import {buildRoom} from '@doc/stories/Room/shared/builders';
import {renderRoomPage} from '@doc/stories/Room/shared/render';
import {getDeleteRoom, getErrorMessage, getRemovePlayer, getRenameRoom, getStartGame} from '@doc/stories/Room/shared/get/room';

const HOST_ID = UserId.create();
const OPPONENT_ID = UserId.create();
const HOST = {id: HOST_ID.value, name: 'HostPlayer'};
const OPPONENT = {id: OPPONENT_ID.value, name: 'CIPHER_88'};

function buildReadyRoom() {
    return buildRoom({hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.WAITING_FOR_PLAYERS});
}

describe('Host can start a game once the room has 2 of 2 players', () => {
    it('WHEN the host clicks startGame SHOULD show a loading state and disable renameRoom and removePlayer and deleteRoom, navigate to the game view', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        let resolveStartGame: (value: GameAPIResponse) => void = () => {};
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildReadyRoom())),
            startGame: vi.fn(() => new Promise<GameAPIResponse>((resolve) => {
                resolveStartGame = resolve;
            })),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getStartGame()).toBeEnabled();
        });

        await user.click(getStartGame());

        expect(getStartGame()).toHaveAttribute('aria-busy', 'true');
        expect(getStartGame()).toBeDisabled();
        expect(getRenameRoom()).toBeDisabled();
        expect(getRemovePlayer(1)).toBeDisabled();
        expect(getDeleteRoom()).toBeEnabled();

        resolveStartGame(new SuccessResponse({id: 'game-1', roomId: buildReadyRoom().id}));

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/games/game-1');
        });
    });

    it('WHEN starting the game fails SHOULD show an error message and re-enable startGame', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildReadyRoom())),
            startGame: vi.fn(async () => new CommonError('SERVER ERR', 400)),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getStartGame()).toBeEnabled();
        });

        await user.click(getStartGame());

        await waitFor(() => {
            expect(getErrorMessage()).toBeVisible();
        });
        expect(getStartGame()).toBeEnabled();
    });
});
