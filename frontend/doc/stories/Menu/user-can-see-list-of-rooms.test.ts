import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MenuRoomList} from '@/app/Menu/RoomList/MenuRoomList';
import type {Router} from '@/domain/shared/service/Router';
import type {RoomAPI, RoomAPIGetRoomsOptions, RoomAPIListResponse} from '@/domain/shared/api/RoomAPI';
import {SuccessResponse} from '@/domain/shared/api/APICommon';
import {RoomAPIProvider} from '@/domain/shared/context/RoomAPIContext';
import {RouterProvider} from '@/domain/shared/context/RouterContext';
import {UserSessionProvider} from '@/domain/shared/context/UserSessionContext';
import {UserId} from '@/domain/User/UserId';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {createMockRouter, createMockRoomAPI, createMockUserSession, mockGetRooms} from '@doc/stories/Menu/shared/mocks';
import {buildRoom} from '@doc/stories/Menu/shared/builders';
import {RoomId} from '@/domain/Room/RoomId';
import {
    getLoading,
    getNextPage, getNoActiveRoomsFound,
    getPageIndicator, getPagination, getPrevPage,
    getRoomListItems,
    getRoomName,
    getRoomPlayerCount,
    getRoomStatus, roomList
} from "@doc/stories/Menu/shared/get/roomList.ts";

const CURRENT_USER_ID = UserId.create();
const PLAYER_ONE_ID = UserId.create();
const PLAYER_TWO_ID = UserId.create();

function renderMenuRoomList(roomAPI: RoomAPI, router: Router) {
    return render(
        createElement(
            RouterProvider,
            {router, children: createElement(
                UserSessionProvider,
                {userSession: createMockUserSession(CURRENT_USER_ID), children: createElement(
                    RoomAPIProvider,
                    {roomAPI, children: createElement(MenuRoomList)}
                )}
            )}
        )
    );
}

describe('User can see the list of rooms and players in each room', () => {
    it('WHEN rooms are loading SHOULD show loading and SHOULD NOT show noActiveRoomsFound or any roomListItem', () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(() => new Promise<RoomAPIListResponse>(() => {})),
        });

        renderMenuRoomList(roomAPI, router);

        expect(getLoading()).toBeVisible();
        expect(roomList().queryByTestId('noActiveRoomsFound')).not.toBeInTheDocument();
        expect(getRoomListItems()).toHaveLength(0);
    });

    it('WHEN no rooms exist SHOULD show noActiveRoomsFound and SHOULD NOT show loading or any roomListItem', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: mockGetRooms({results: [], nextPageToken: null}),
        });

        renderMenuRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getNoActiveRoomsFound()).toBeVisible();
        });
        expect(roomList().queryByTestId('loading')).not.toBeInTheDocument();
        expect(getRoomListItems()).toHaveLength(0);
    });

    it('WHEN one room exists SHOULD show one roomListItem with its name, status, and player count and SHOULD NOT show noActiveRoomsFound or loading', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: mockGetRooms({
                results: [buildRoom({name: 'ROOM_NULL_PTR', status: GameStatusEnum.WAITING_FOR_PLAYERS, users: [{id: PLAYER_ONE_ID.value, name: 'PlayerOne'}]})],
                nextPageToken: null,
            }),
        });

        renderMenuRoomList(roomAPI, router);

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
            getRooms: mockGetRooms({
                results: [buildRoom({users: [{id: PLAYER_ONE_ID.value, name: 'PlayerOne'}, {id: PLAYER_TWO_ID.value, name: 'PlayerTwo'}]})],
                nextPageToken: null,
            }),
        });

        renderMenuRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(1);
        });
        expect(getRoomPlayerCount(0)).toHaveTextContent('ROOM_IS_FULL');
    });

    it('WHEN rooms list has more than one page SHOULD show pagination with prevPage disabled and nextPage clickable', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: mockGetRooms({
                results: [buildRoom()],
                nextPageToken: 'page-2-token',
            }),
        });

        renderMenuRoomList(roomAPI, router);

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
        const getRooms = vi.fn(async (options?: RoomAPIGetRoomsOptions) => {
            if (options?.userId) {
                return new SuccessResponse({results: [], nextPageToken: null});
            }
            if (options?.pageToken === 'page-2-token') {
                return new SuccessResponse({
                    results: [buildRoom({id: RoomId.create().value, name: 'PAGE_TWO_ROOM'})],
                    prevPageToken: 'page-1-token',
                    nextPageToken: null,
                });
            }
            return new SuccessResponse({
                results: [buildRoom({id: RoomId.create().value, name: 'PAGE_ONE_ROOM'})],
                prevPageToken: null,
                nextPageToken: 'page-2-token',
            });
        });
        const roomAPI = createMockRoomAPI({getRooms});

        renderMenuRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getRoomName(0)).toHaveTextContent('PAGE_ONE_ROOM');
        });

        expect(getPrevPage()).toBeDisabled();
        expect(getNextPage()).toBeEnabled();
        await user.click(getNextPage());

        await waitFor(() => {
            expect(getRoomName(0)).toHaveTextContent('PAGE_TWO_ROOM');
        });

        expect(getPrevPage()).toBeEnabled();
        expect(getNextPage()).toBeDisabled();

        await user.click(getPrevPage());
        await waitFor(() => {
            expect(getRoomName(0)).toHaveTextContent('PAGE_ONE_ROOM');
        });

        expect(getPrevPage()).toBeDisabled();
        expect(getNextPage()).toBeEnabled();
    });

    it('WHEN on the last page SHOULD show nextPage disabled', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: mockGetRooms({
                results: [buildRoom()],
                nextPageToken: null,
            }),
        });

        renderMenuRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getPagination()).toBeTruthy();
        });
        expect(getNextPage()).toBeDisabled();
    });
});
