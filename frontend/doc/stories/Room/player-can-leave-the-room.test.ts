import {describe, expect, it, vi} from 'vitest';
import {waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CommonError, SuccessResponse} from '@/domain/shared/api/APICommon';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {UserId} from '@/domain/User/UserId';
import {createMockRoomAPI, createMockRoomEventsSocket, createMockRouter, createMockUserSession} from '@doc/stories/Room/shared/mocks';
import {buildRoom} from '@doc/stories/Room/shared/builders';
import {renderRoomPage} from '@doc/stories/Room/shared/render';
import {getErrorMessage, getLeaveRoom, getPlayerName} from '@doc/stories/Room/shared/get/room';

const HOST_ID = UserId.create();
const OPPONENT_ID = UserId.create();
const HOST = {id: HOST_ID.value, name: 'HostPlayer'};
const OPPONENT = {id: OPPONENT_ID.value, name: 'CIPHER_88'};

describe('Player can leave the room', () => {
    it('WHEN a non-host player clicks leaveRoom SHOULD leave the room and navigate back to #/rooms', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.WAITING_FOR_PLAYERS}))),
            userLeaveRoom: vi.fn(async () => new SuccessResponse(undefined)),
        });
        const userSession = createMockUserSession(OPPONENT_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getLeaveRoom()).toBeInTheDocument();
        });

        await user.click(getLeaveRoom());

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/rooms');
        });
    });

    it('WHEN leaving the room fails SHOULD show an error message and keep the player in the room', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.WAITING_FOR_PLAYERS}))),
            userLeaveRoom: vi.fn(async () => new CommonError('SERVER ERR', 400)),
        });
        const userSession = createMockUserSession(OPPONENT_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getLeaveRoom()).toBeInTheDocument();
        });

        await user.click(getLeaveRoom());

        await waitFor(() => {
            expect(getErrorMessage()).toBeVisible();
        });
        expect(getPlayerName(1)).toHaveTextContent(OPPONENT.name);
        expect(router.push).not.toHaveBeenCalled();
    });
});
