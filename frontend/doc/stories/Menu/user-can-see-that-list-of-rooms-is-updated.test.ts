import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, waitFor, within} from '@testing-library/react';
import {MenuRoomList} from '@/app/Menu/RoomList/MenuRoomList';
import type {Router} from '@/domain/shared/service/Router';
import type {RoomAPI} from '@/domain/shared/api/RoomAPI';
import {RoomAPIProvider} from '@/domain/shared/context/RoomAPIContext';
import {RouterProvider} from '@/domain/shared/context/RouterContext';
import {UserSessionProvider} from '@/domain/shared/context/UserSessionContext';
import {UserId} from '@/domain/User/UserId';
import {RoomEventsSocketProvider} from '@/domain/shared/context/RoomEventsSocketContext';
import type {RoomEventsSocket} from '@/domain/shared/service/RoomEventsSocket';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {createMockRouter, createMockRoomAPI, createMockRoomEventsSocket, createMockUserSession, mockGetRooms} from '@doc/stories/Menu/shared/mocks';
import {buildRoom} from '@doc/stories/Menu/shared/builders';
import {RoomId} from '@/domain/Room/RoomId';
import {getConnectionStatus, getRoomListItems} from "@doc/stories/Menu/shared/get/roomList.ts";

const CURRENT_USER_ID = UserId.create();
const PLAYER_ONE_ID = UserId.create();
const PLAYER_TWO_ID = UserId.create();

function listFetchCalls(roomAPI: RoomAPI) {
    return (roomAPI.getRooms as ReturnType<typeof vi.fn>).mock.calls
        .filter(([options]) => !options?.userId);
}

function renderMenuRoomList(roomAPI: RoomAPI, router: Router, roomEventsSocket: RoomEventsSocket) {
    return render(
        createElement(
            RouterProvider,
            {router, children: createElement(
                UserSessionProvider,
                {userSession: createMockUserSession(CURRENT_USER_ID), children: createElement(
                    RoomAPIProvider,
                    {roomAPI, children: createElement(
                        RoomEventsSocketProvider,
                        {roomEventsSocket, children: createElement(MenuRoomList)}
                    )}
                )}
            )}
        )
    );
}

describe('User can see that the list of rooms is updated automatically', () => {
    it('WHEN websocket is connected SHOULD show connectionStatus as LIVE', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: mockGetRooms({results: [], nextPageToken: null}),
        });
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderMenuRoomList(roomAPI, router, roomEventsSocket);

        await waitFor(() => {
            expect(getConnectionStatus()).toHaveTextContent('LIVE');
        });
    });

    it('WHEN a roomAdded event is received SHOULD show a new roomListItem for that room without a page reload', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: mockGetRooms({results: [], nextPageToken: null}),
        });
        const {roomEventsSocket, getHandlers} = createMockRoomEventsSocket();

        renderMenuRoomList(roomAPI, router, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(0);
        });

        getHandlers().onRoomAdded?.(buildRoom({id: RoomId.create().value, name: 'NEW_ROOM'}));

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(1);
        });
        expect(within(getRoomListItems()[0]).getByTestId('roomName')).toHaveTextContent('NEW_ROOM');
        expect(listFetchCalls(roomAPI)).toHaveLength(1);
    });

    it('WHEN a roomEdited event is received for a listed room SHOULD update that roomListItem\'s status and player count in place', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: mockGetRooms({
                results: [buildRoom({status: GameStatusEnum.WAITING_FOR_PLAYERS, users: [{id: PLAYER_ONE_ID.value, name: 'PlayerOne'}]})],
                nextPageToken: null,
            }),
        });
        const {roomEventsSocket, getHandlers} = createMockRoomEventsSocket();

        renderMenuRoomList(roomAPI, router, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(1);
        });

        getHandlers().onRoomEdited?.(buildRoom({
            status: GameStatusEnum.IN_PROGRESS,
            users: [{id: PLAYER_ONE_ID.value, name: 'PlayerOne'}, {id: PLAYER_TWO_ID.value, name: 'PlayerTwo'}],
        }));

        await waitFor(() => {
            expect(within(getRoomListItems()[0]).getByTestId('roomStatus')).toHaveTextContent('IN_PROGRESS');
        });
        expect(within(getRoomListItems()[0]).getByTestId('roomPlayerCount')).toHaveTextContent('ROOM_IS_FULL');
        expect(getRoomListItems()).toHaveLength(1);
        expect(listFetchCalls(roomAPI)).toHaveLength(1);
    });

    it('WHEN a roomDeleted event is received for a listed room SHOULD remove that roomListItem', async () => {
        const router = createMockRouter();
        const roomId = RoomId.create().value;
        const roomAPI = createMockRoomAPI({
            getRooms: mockGetRooms({
                results: [buildRoom({id: roomId})],
                nextPageToken: null,
            }),
        });
        const {roomEventsSocket, getHandlers} = createMockRoomEventsSocket();

        renderMenuRoomList(roomAPI, router, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(1);
        });

        getHandlers().onRoomDeleted?.(roomId);

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(0);
        });
    });
});
