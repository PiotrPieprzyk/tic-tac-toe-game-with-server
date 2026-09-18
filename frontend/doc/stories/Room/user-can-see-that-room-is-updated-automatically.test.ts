import {describe, expect, it, vi} from 'vitest';
import {waitFor} from '@testing-library/react';
import {SuccessResponse} from '@/domain/shared/api/APICommon';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {UserId} from '@/domain/User/UserId';
import {createMockRoomAPI, createMockRoomEventsSocket, createMockRouter, createMockUserSession} from '@doc/stories/Room/shared/mocks';
import {buildRoom, DEFAULT_ROOM_ID} from '@doc/stories/Room/shared/builders';
import {renderRoomPage} from '@doc/stories/Room/shared/render';
import {
    getEmptySlotMessage,
    getPlayerName,
    getPlayerSlots,
    getRoomName,
    getRoomStatus,
} from '@doc/stories/Room/shared/get/room';

const HOST_ID = UserId.create();
const OPPONENT_ID = UserId.create();
const HOST = {id: HOST_ID.value, name: 'HostPlayer'};
const OPPONENT = {id: OPPONENT_ID.value, name: 'CIPHER_88'};

describe('User can see that the room is updated automatically', () => {
    it('WHEN a roomEdited event is received for this room with a new player SHOULD fill the empty slot without a page reload', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST], status: GameStatusEnum.WAITING_FOR_PLAYERS}))),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket, getHandlers} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getEmptySlotMessage(1)).toBeInTheDocument();
        });

        expect(roomEventsSocket.subscribeToRoom).toHaveBeenCalledWith(DEFAULT_ROOM_ID, expect.anything());

        getHandlers().onRoomEdited?.(buildRoom({hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.WAITING_FOR_PLAYERS}));

        await waitFor(() => {
            expect(getPlayerName(1)).toHaveTextContent(OPPONENT.name);
        });
        expect(roomAPI.getRoom).toHaveBeenCalledTimes(1);
    });

    it("WHEN a roomEdited event is received for this room with the opponent removed SHOULD show the slot as empty again", async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.WAITING_FOR_PLAYERS}))),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket, getHandlers} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getPlayerName(1)).toHaveTextContent(OPPONENT.name);
        });

        getHandlers().onRoomEdited?.(buildRoom({hostId: HOST.id, users: [HOST], status: GameStatusEnum.WAITING_FOR_PLAYERS}));

        await waitFor(() => {
            expect(getEmptySlotMessage(1)).toBeInTheDocument();
        });
        expect(getPlayerSlots()).toHaveLength(2);
    });

    it('WHEN a roomEdited event is received for this room with a new name SHOULD update the displayed room name', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST], name: 'ROOM_NULL_PTR'}))),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket, getHandlers} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomName()).toHaveTextContent('ROOM_NULL_PTR');
        });

        getHandlers().onRoomEdited?.(buildRoom({hostId: HOST.id, users: [HOST], name: 'NEW_NAME'}));

        await waitFor(() => {
            expect(getRoomName()).toHaveTextContent('NEW_NAME');
        });
    });

    it('WHEN a roomEdited event is received for this room with status changed to IN_PROGRESS SHOULD navigate to #/games/game-1', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.WAITING_FOR_PLAYERS}))),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket, getHandlers} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomStatus()).toHaveTextContent('STATUS: READY — 2/2 PLAYERS');
        });

        getHandlers().onRoomEdited?.(buildRoom({
            hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.IN_PROGRESS, activeGameId: 'game-1',
        }));

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/games/game-1');
        });
    });

    it('WHEN a roomEdited event is received for this room with the current user removed from the players list SHOULD navigate back to #/rooms', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.WAITING_FOR_PLAYERS}))),
        });
        const userSession = createMockUserSession(OPPONENT_ID);
        const {roomEventsSocket, getHandlers} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getPlayerName(1)).toHaveTextContent(OPPONENT.name);
        });

        getHandlers().onRoomEdited?.(buildRoom({hostId: HOST.id, users: [HOST], status: GameStatusEnum.WAITING_FOR_PLAYERS}));

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/rooms');
        });
    });

    it("WHEN a roomDeleted event is received for this room SHOULD navigate back to #/rooms", async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST]}))),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket, getHandlers} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomName()).toBeInTheDocument();
        });

        getHandlers().onRoomDeleted?.(DEFAULT_ROOM_ID);

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/rooms');
        });
    });

    it('WHEN a roomEdited or roomDeleted event is received for a different room SHOULD make no change to the displayed room', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST], name: 'ROOM_NULL_PTR'}))),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket, getHandlers} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomName()).toHaveTextContent('ROOM_NULL_PTR');
        });

        getHandlers().onRoomEdited?.(buildRoom({id: 'other-room', hostId: HOST.id, users: [HOST], name: 'OTHER_NAME'}));
        getHandlers().onRoomDeleted?.('other-room');

        expect(getRoomName()).toHaveTextContent('ROOM_NULL_PTR');
        expect(router.push).not.toHaveBeenCalled();
    });
});
