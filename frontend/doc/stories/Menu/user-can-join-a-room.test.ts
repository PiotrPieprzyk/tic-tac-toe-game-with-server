import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {RoomList} from '../../../src/app/Menu/RoomList';
import type {Router} from '../../../src/domain/shared/service/Router';
import type {RoomAPI, RoomAPIJoinRequest, RoomAPIResponse, RoomAPIResponseRaw} from '../../../src/domain/shared/api/RoomAPI';
import {CommonError, SuccessResponse} from '../../../src/domain/shared/api/APICommon';
import {RoomAPIProvider} from '../../../src/infra/api/RoomAPIContext';
import {RouterProvider} from '../../../src/infra/service/RouterContext';
import {GameStatusEnum} from '../../../src/domain/Game/GameStatus';

function createMockRouter(): Router {
    return {
        push: vi.fn(),
        replace: vi.fn(),
    };
}

function createMockRoomAPI(overrides: Partial<RoomAPI> = {}): RoomAPI {
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

function buildRoom(overrides: Partial<RoomAPIResponseRaw> = {}): RoomAPIResponseRaw {
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

function renderRoomList(roomAPI: RoomAPI, router: Router) {
    return render(
        createElement(
            RouterProvider,
            {router, children: createElement(
                RoomAPIProvider,
                {roomAPI, children: createElement(RoomList)}
            )}
        )
    );
}

function roomList() {
    return within(screen.getByTestId('roomList'));
}

function getRoomListItem() {
    return within(roomList().getByTestId('roomListItem'));
}

function getJoinRoom() {
    return getRoomListItem().getByTestId('joinRoom');
}

function getErrorMessage() {
    return roomList().getByTestId('errorMessage');
}

describe('User can join a room from the rooms list', () => {
    it('WHEN room status is WAITING and not full, joinRoom SHOULD be clickable and when clicked SHOULD show loading state until redirected to #/rooms/{roomId}', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        let resolveJoin: (value: RoomAPIResponse) => void = () => {};
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({
                rooms: [buildRoom({status: GameStatusEnum.WAITING_FOR_PLAYERS, users: [{id: 'user-1', name: 'PlayerOne'}]})],
                nextPageToken: null,
            })),
            userJoinRoom: vi.fn((_roomId, _body: RoomAPIJoinRequest) => new Promise<RoomAPIResponse>((resolve) => {
                resolveJoin = resolve;
            })),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getJoinRoom()).toBeEnabled();
        });

        await user.click(getJoinRoom());

        expect(getJoinRoom()).toHaveTextContent(/JOINING/);
        expect(getJoinRoom()).toHaveAttribute('aria-busy', 'true');

        resolveJoin(new SuccessResponse(buildRoom({status: GameStatusEnum.WAITING_FOR_PLAYERS, users: [{id: 'user-1', name: 'PlayerOne'}, {id: 'user-2', name: 'PlayerTwo'}]})));

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/rooms/room-1');
        });
    });

    it('WHEN room status is IN_PROGRESS, joinRoom SHOULD NOT be clickable', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({
                rooms: [buildRoom({status: GameStatusEnum.IN_PROGRESS})],
                nextPageToken: null,
            })),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getJoinRoom()).toBeDisabled();
        });
    });

    it('WHEN room status is ENDED, joinRoom SHOULD NOT be clickable', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({
                rooms: [buildRoom({status: GameStatusEnum.ENDED})],
                nextPageToken: null,
            })),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getJoinRoom()).toBeDisabled();
        });
    });

    it('WHEN room is full (2/2 players), joinRoom SHOULD NOT be clickable', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({
                rooms: [buildRoom({status: GameStatusEnum.WAITING_FOR_PLAYERS, users: [{id: 'user-1', name: 'PlayerOne'}, {id: 'user-2', name: 'PlayerTwo'}]})],
                nextPageToken: null,
            })),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getJoinRoom()).toBeDisabled();
        });
    });

    it('WHEN user clicks joinRoom and the request fails SHOULD show errorMessage and joinRoom SHOULD return to its default clickable state', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({
                rooms: [buildRoom({status: GameStatusEnum.WAITING_FOR_PLAYERS, users: [{id: 'user-1', name: 'PlayerOne'}]})],
                nextPageToken: null,
            })),
            userJoinRoom: vi.fn(async (_roomId, _body: RoomAPIJoinRequest) =>
                new CommonError('Unable to join room', 400)
            ),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getJoinRoom()).toBeEnabled();
        });

        await user.click(getJoinRoom());

        await waitFor(() => {
            expect(getErrorMessage()).toBeVisible();
        });
        expect(getErrorMessage()).toHaveTextContent('ERR: UNABLE_TO_JOIN — TRY AGAIN');
        expect(getJoinRoom()).toBeEnabled();
        expect(getJoinRoom()).not.toHaveTextContent(/JOINING/);
    });
});
