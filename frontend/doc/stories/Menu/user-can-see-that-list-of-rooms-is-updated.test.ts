import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, waitFor, within} from '@testing-library/react';
import {RoomList} from '../../../src/app/Menu/RoomList';
import type {Router} from '../../../src/domain/shared/service/Router';
import type {RoomAPI} from '../../../src/domain/shared/api/RoomAPI';
import {SuccessResponse} from '../../../src/domain/shared/api/APICommon';
import {RoomAPIProvider} from '../../../src/infra/api/RoomAPIContext';
import {RouterProvider} from '../../../src/infra/service/RouterContext';
import {RoomEventsSocketProvider} from '../../../src/infra/service/RoomEventsSocketContext';
import type {RoomEventsSocket} from '../../../src/domain/shared/service/RoomEventsSocket';
import {GameStatusEnum} from '../../../src/domain/Game/GameStatus';
import {createMockRouter, createMockRoomAPI, createMockRoomEventsSocket} from './shared/mocks';
import {buildRoom} from './shared/builders';
import {getConnectionStatus, getRoomListItems} from "./shared/get/roomList.ts";

function renderRoomList(roomAPI: RoomAPI, router: Router, roomEventsSocket: RoomEventsSocket) {
    return render(
        createElement(
            RouterProvider,
            {router, children: createElement(
                RoomAPIProvider,
                {roomAPI, children: createElement(
                    RoomEventsSocketProvider,
                    {roomEventsSocket, children: createElement(RoomList)}
                )}
            )}
        )
    );
}

describe('User can see that the list of rooms is updated automatically', () => {
    it('WHEN websocket is connected SHOULD show connectionStatus as LIVE', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({rooms: [], nextPageToken: null})),
        });
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomList(roomAPI, router, roomEventsSocket);

        await waitFor(() => {
            expect(getConnectionStatus()).toHaveTextContent('LIVE');
        });
    });

    it('WHEN a roomAdded event is received SHOULD show a new roomListItem for that room without a page reload', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({rooms: [], nextPageToken: null})),
        });
        const {roomEventsSocket, getHandlers} = createMockRoomEventsSocket();

        renderRoomList(roomAPI, router, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(0);
        });

        getHandlers().onRoomAdded?.(buildRoom({id: 'new-room', name: 'NEW_ROOM'}));

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(1);
        });
        expect(within(getRoomListItems()[0]).getByTestId('roomName')).toHaveTextContent('NEW_ROOM');
        expect(roomAPI.getRooms).toHaveBeenCalledTimes(1);
    });

    it('WHEN a roomEdited event is received for a listed room SHOULD update that roomListItem\'s status and player count in place', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({
                rooms: [buildRoom({status: GameStatusEnum.WAITING_FOR_PLAYERS, users: [{id: 'user-1', name: 'PlayerOne'}]})],
                nextPageToken: null,
            })),
        });
        const {roomEventsSocket, getHandlers} = createMockRoomEventsSocket();

        renderRoomList(roomAPI, router, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(1);
        });

        getHandlers().onRoomEdited?.(buildRoom({
            status: GameStatusEnum.IN_PROGRESS,
            users: [{id: 'user-1', name: 'PlayerOne'}, {id: 'user-2', name: 'PlayerTwo'}],
        }));

        await waitFor(() => {
            expect(within(getRoomListItems()[0]).getByTestId('roomStatus')).toHaveTextContent('IN_PROGRESS');
        });
        expect(within(getRoomListItems()[0]).getByTestId('roomPlayerCount')).toHaveTextContent('ROOM_IS_FULL');
        expect(getRoomListItems()).toHaveLength(1);
        expect(roomAPI.getRooms).toHaveBeenCalledTimes(1);
    });

    it('WHEN a roomDeleted event is received for a listed room SHOULD remove that roomListItem', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({
                rooms: [buildRoom({id: 'room-1'})],
                nextPageToken: null,
            })),
        });
        const {roomEventsSocket, getHandlers} = createMockRoomEventsSocket();

        renderRoomList(roomAPI, router, roomEventsSocket);

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(1);
        });

        getHandlers().onRoomDeleted?.('room-1');

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(0);
        });
    });
});
