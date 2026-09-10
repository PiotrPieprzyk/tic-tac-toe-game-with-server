import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {RoomList} from '../../../src/app/Menu/RoomList';
import type {Router} from '../../../src/domain/shared/service/Router';
import type {RoomAPI, RoomAPIListResponse, RoomAPIResponseRaw} from '../../../src/domain/shared/api/RoomAPI';
import {SuccessResponse} from '../../../src/domain/shared/api/APICommon';
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

function getLoading() {
    return roomList().getByTestId('loading');
}

function getNoActiveRoomsFound() {
    return roomList().getByTestId('noActiveRoomsFound');
}

function getRoomListItems() {
    return roomList().queryAllByTestId('roomListItem');
}

function getRoomListItem(index: number) {
    return within(getRoomListItems()[index]);
}

function getRoomName(index: number) {
    return getRoomListItem(index).getByTestId('roomName');
}

function getRoomStatus(index: number) {
    return getRoomListItem(index).getByTestId('roomStatus');
}

function getRoomPlayerCount(index: number) {
    return getRoomListItem(index).getByTestId('roomPlayerCount');
}

function getPagination() {
    return within(roomList().getByTestId('pagination'));
}

function getPrevPage() {
    return getPagination().getByTestId('prevPage');
}

function getPageIndicator() {
    return getPagination().getByTestId('pageIndicator');
}

function getNextPage() {
    return getPagination().getByTestId('nextPage');
}

describe('User can see the list of rooms and players in each room', () => {
    it('WHEN rooms are loading SHOULD show loading and SHOULD NOT show noActiveRoomsFound or any roomListItem', () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(() => new Promise<RoomAPIListResponse>(() => {})),
        });

        renderRoomList(roomAPI, router);

        expect(getLoading()).toBeVisible();
        expect(roomList().queryByTestId('noActiveRoomsFound')).not.toBeInTheDocument();
        expect(getRoomListItems()).toHaveLength(0);
    });

    it('WHEN no rooms exist SHOULD show noActiveRoomsFound and SHOULD NOT show loading or any roomListItem', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({rooms: [], nextPageToken: null})),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getNoActiveRoomsFound()).toBeVisible();
        });
        expect(roomList().queryByTestId('loading')).not.toBeInTheDocument();
        expect(getRoomListItems()).toHaveLength(0);
    });

    it('WHEN one room exists SHOULD show one roomListItem with its name, status, and player count and SHOULD NOT show noActiveRoomsFound or loading', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({
                rooms: [buildRoom({name: 'ROOM_NULL_PTR', status: GameStatusEnum.WAITING_FOR_PLAYERS, users: [{id: 'user-1', name: 'PlayerOne'}]})],
                nextPageToken: null,
            })),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(1);
        });
        expect(getRoomName(0)).toHaveTextContent('ROOM_NULL_PTR');
        expect(getRoomStatus(0)).toHaveTextContent('WAITING');
        expect(getRoomPlayerCount(0)).toHaveTextContent('1/2');
        expect(roomList().queryByTestId('noActiveRoomsFound')).not.toBeInTheDocument();
        expect(roomList().queryByTestId('loading')).not.toBeInTheDocument();
    });

    it('WHEN a room is full SHOULD show roomPlayerCount as ROOM_IS_FULL', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({
                rooms: [buildRoom({users: [{id: 'user-1', name: 'PlayerOne'}, {id: 'user-2', name: 'PlayerTwo'}]})],
                nextPageToken: null,
            })),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(1);
        });
        expect(getRoomPlayerCount(0)).toHaveTextContent('ROOM_IS_FULL');
    });

    it('WHEN rooms list has more than one page SHOULD show pagination with prevPage disabled and nextPage clickable', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({
                rooms: [buildRoom()],
                nextPageToken: 'page-2-token',
            })),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getPagination()).toBeTruthy();
        });
        expect(getPrevPage()).toBeDisabled();
        expect(getNextPage()).toBeEnabled();
        expect(getPageIndicator()).toHaveTextContent('PAGE 1/');
    });

    it('WHEN user clicks nextPage SHOULD request the next page and show its rooms, and prevPage SHOULD become clickable', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const getRooms = vi.fn();
        getRooms.mockImplementationOnce(async () => new SuccessResponse({
            rooms: [buildRoom({id: 'room-1', name: 'PAGE_ONE_ROOM'})],
            nextPageToken: 'page-2-token',
        }));
        getRooms.mockImplementationOnce(async (options?: {pageToken?: string}) => {
            expect(options?.pageToken).toBe('page-2-token');
            return new SuccessResponse({
                rooms: [buildRoom({id: 'room-2', name: 'PAGE_TWO_ROOM'})],
                nextPageToken: null,
            });
        });
        const roomAPI = createMockRoomAPI({getRooms});

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getRoomName(0)).toHaveTextContent('PAGE_ONE_ROOM');
        });

        await user.click(getNextPage());

        await waitFor(() => {
            expect(getRoomName(0)).toHaveTextContent('PAGE_TWO_ROOM');
        });
        expect(getPrevPage()).toBeEnabled();
    });

    it('WHEN on the last page SHOULD show nextPage disabled', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({
                rooms: [buildRoom()],
                nextPageToken: null,
            })),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getPagination()).toBeTruthy();
        });
        expect(getNextPage()).toBeDisabled();
    });
});
