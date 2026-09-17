import {describe, expect, it, vi} from 'vitest';
import {waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CommonError, SuccessResponse} from '@/domain/shared/api/APICommon';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {UserId} from '@/domain/User/UserId';
import {createMockRoomAPI, createMockRoomEventsSocket, createMockRouter, createMockUserSession} from '@doc/stories/Room/shared/mocks';
import {buildRoom} from '@doc/stories/Room/shared/builders';
import {renderRoomPage} from '@doc/stories/Room/shared/render';
import {getEmptySlotMessage, getErrorMessage, getPlayerName, getPlayerSlots, getRemovePlayer} from '@doc/stories/Room/shared/get/room';

const HOST_ID = UserId.create();
const OPPONENT_ID = UserId.create();
const HOST = {id: HOST_ID.value, name: 'HostPlayer'};
const OPPONENT = {id: OPPONENT_ID.value, name: 'CIPHER_88'};

describe('Host can remove a player from the room', () => {
    it("WHEN the host clicks removePlayer on the opponent's slot SHOULD remove that player and show the slot as empty again", async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.WAITING_FOR_PLAYERS}))),
            updateRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST], status: GameStatusEnum.WAITING_FOR_PLAYERS}))),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getPlayerName(1)).toHaveTextContent(OPPONENT.name);
        });

        await user.click(getRemovePlayer(1));

        expect(roomAPI.updateRoom).toHaveBeenCalled();
        await waitFor(() => {
            expect(getEmptySlotMessage(1)).toBeInTheDocument();
        });
        expect(getPlayerSlots()).toHaveLength(2);
    });

    it('WHEN removing the player fails SHOULD show an error message and keep the player listed', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.WAITING_FOR_PLAYERS}))),
            updateRoom: vi.fn(async () => new CommonError('SERVER ERR', 400)),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getPlayerName(1)).toHaveTextContent(OPPONENT.name);
        });

        await user.click(getRemovePlayer(1));

        await waitFor(() => {
            expect(getErrorMessage()).toBeVisible();
        });
        expect(getPlayerName(1)).toHaveTextContent(OPPONENT.name);
    });
});
