import {describe, expect, it, vi} from 'vitest';
import {waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CommonError, SuccessResponse} from '@/domain/shared/api/APICommon';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {UserId} from '@/domain/User/UserId';
import {createMockRoomAPI, createMockRoomEventsSocket, createMockRouter, createMockUserSession} from '@doc/stories/Room/shared/mocks';
import {buildRoom, DEFAULT_ROOM_ID} from '@doc/stories/Room/shared/builders';
import {renderRoomPage} from '@doc/stories/Room/shared/render';
import {
    getEmptySlotMessage,
    getEnterGame,
    getHostTag,
    getLeaveRoom,
    getPlayerName,
    getPlayerSlots,
    getRemovePlayer,
    getRenameRoom,
    getRoomId,
    getRoomName,
    getRoomStatus,
    getStartGame,
    getWaitingForHostToStart,
    getYouTag,
    roomPage,
} from '@doc/stories/Room/shared/get/room';

const HOST_ID = UserId.create();
const OPPONENT_ID = UserId.create();
const HOST = {id: HOST_ID.value, name: 'HostPlayer'};
const OPPONENT = {id: OPPONENT_ID.value, name: 'CIPHER_88'};

// TODO: Instead of checking if all items are visible or not, maybe we could introduce some snapshot testing?

describe("User can see the room's details: its name, id, players, and status", () => {
    it('WHEN the room has 1 of 2 players and the current user is the host SHOULD show WAITING_FOR_PLAYERS status, HOST tag on the host\'s own slot, an empty second slot, RENAME, and a disabled START_GAME with no LEAVE_ROOM', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST], status: GameStatusEnum.WAITING_FOR_PLAYERS}))),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomStatus()).toHaveTextContent('STATUS: WAITING_FOR_PLAYERS');
        });
        expect(getRoomName()).toHaveTextContent(buildRoom().name);
        expect(getRoomId()).toHaveTextContent(DEFAULT_ROOM_ID);
        expect(getRenameRoom()).toBeInTheDocument();
        expect(getPlayerSlots()).toHaveLength(2);
        expect(getPlayerName(0)).toHaveTextContent(HOST.name);
        expect(getHostTag(0)).toBeInTheDocument();
        expect(getEmptySlotMessage(1)).toHaveTextContent('WAITING_FOR OPPONENT');
        expect(getStartGame()).toBeDisabled();
        expect(roomPage().queryByTestId('leaveRoom')).not.toBeInTheDocument();
    });

    it("WHEN the room has 2 of 2 players and the current user is the host SHOULD show READY status, REMOVE_PLAYER on the opponent's slot, and an enabled START_GAME", async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.WAITING_FOR_PLAYERS}))),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomStatus()).toHaveTextContent('STATUS: READY — 2/2 PLAYERS');
        });
        expect(getPlayerName(1)).toHaveTextContent(OPPONENT.name);
        expect(getRemovePlayer(1)).toBeInTheDocument();
        expect(getStartGame()).toBeEnabled();
    });

    it("WHEN the room has 2 of 2 players and the current user is not the host SHOULD show READY status, a YOU tag on the current user's own slot, no RENAME/REMOVE_PLAYER/START_GAME/DELETE_ROOM controls, and a WAITING_FOR_HOST_TO_START notice with LEAVE_ROOM", async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.WAITING_FOR_PLAYERS}))),
        });
        const userSession = createMockUserSession(OPPONENT_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomStatus()).toHaveTextContent('STATUS: READY — 2/2 PLAYERS');
        });
        expect(getYouTag(1)).toBeInTheDocument();
        expect(getWaitingForHostToStart()).toBeInTheDocument();
        expect(getLeaveRoom()).toBeInTheDocument();
        expect(roomPage().queryByTestId('renameRoom')).not.toBeInTheDocument();
        expect(roomPage().queryByTestId('removePlayer')).not.toBeInTheDocument();
        expect(roomPage().queryByTestId('startGame')).not.toBeInTheDocument();
        expect(roomPage().queryByTestId('deleteRoom')).not.toBeInTheDocument();
    });

    it('WHEN the room\'s status is IN_PROGRESS SHOULD show GAME_IN_PROGRESS status and an ENTER_GAME control', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({
                hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.IN_PROGRESS, activeGameId: 'game-1',
            }))),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomStatus()).toHaveTextContent('STATUS: GAME_IN_PROGRESS');
        });
        expect(getEnterGame()).toBeInTheDocument();
        expect(getEnterGame()).toBeEnabled();
    });

    it("WHEN the current user clicks ENTER_GAME SHOULD navigate to the game view for the room's activeGameId", async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({
                hostId: HOST.id, users: [HOST, OPPONENT], status: GameStatusEnum.IN_PROGRESS, activeGameId: 'game-1',
            }))),
        });
        const userSession = createMockUserSession(OPPONENT_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getEnterGame()).toBeInTheDocument();
        });

        await user.click(getEnterGame());

        expect(router.push).toHaveBeenCalledWith('#/games/game-1');
    });

    it('WHEN the room fails to load SHOULD redirect to #/rooms', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new CommonError('Room not found', 404)),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/rooms');
        });
    });
});
