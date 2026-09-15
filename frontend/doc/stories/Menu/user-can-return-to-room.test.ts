import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {RoomList} from '@/app/Menu/RoomList';
import type {Router} from '@/domain/shared/service/Router';
import type {RoomAPI, RoomAPIGetRoomsOptions} from '@/domain/shared/api/RoomAPI';
import {SuccessResponse} from '@/domain/shared/api/APICommon';
import {RoomAPIProvider} from '@/infra/api/RoomAPIContext';
import {RouterProvider} from '@/infra/service/RouterContext';
import {UserSessionProvider} from '@/infra/service/UserSessionContext';
import {UserId} from '@/domain/User/UserId';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {DESIGN_COLORS} from '@doc/stories/testUtils';
import {createMockRouter, createMockRoomAPI} from '@doc/stories/Menu/shared/mocks';
import {buildRoom} from '@doc/stories/Menu/shared/builders';
import {
    getAlreadyInRoomMessage, getCreateRoom,
    getJoinRoom,
    getReturnToRoom,
    getRoomListItems,
    getRoomStatus, roomList
} from "@doc/stories/Menu/shared/get/roomList.ts";

const CURRENT_USER_ID = UserId.create();

function renderRoomList(roomAPI: RoomAPI, router: Router) {
    return render(
        createElement(
            RouterProvider,
            {router, children: createElement(
                UserSessionProvider,
                {userId: CURRENT_USER_ID, children: createElement(
                    RoomAPIProvider,
                    {roomAPI, children: createElement(RoomList)}
                )}
            )}
        )
    );
}

describe('User can return to the room they are already in', () => {
    it('WHEN user is a member of one of the listed rooms SHOULD show returnToRoom instead of createRoom, and SHOULD show alreadyInRoomMessage', async () => {
        const router = createMockRouter();
        const ownRoom = buildRoom({id: 'own-room', name: 'MY_ROOM', users: [{id: CURRENT_USER_ID.value, name: 'Me'}]});
        const otherRoom = buildRoom({id: 'other-room', name: 'OTHER_ROOM'});
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async (options?: RoomAPIGetRoomsOptions) => {
                if (options?.userId) {
                    return new SuccessResponse({rooms: [ownRoom], nextPageToken: null});
                }
                return new SuccessResponse({rooms: [ownRoom, otherRoom], nextPageToken: null});
            }),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getReturnToRoom()).toBeVisible();
        });
        expect(roomList().queryByTestId('createRoom')).not.toBeInTheDocument();
        expect(getAlreadyInRoomMessage()).toHaveTextContent('♦ YOU MUST LEAVE YOUR CURRENT ROOM TO JOIN ANOTHER');
    });

    it('WHEN user is a member of one of the listed rooms SHOULD show joinRoom as not clickable on every other room', async () => {
        const router = createMockRouter();
        const ownRoom = buildRoom({id: 'own-room', name: 'MY_ROOM', users: [{id: CURRENT_USER_ID.value, name: 'Me'}]});
        const otherRoom = buildRoom({id: 'other-room', name: 'OTHER_ROOM', status: GameStatusEnum.WAITING_FOR_PLAYERS, users: [{id: 'user-2', name: 'PlayerTwo'}]});
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async (options?: RoomAPIGetRoomsOptions) => {
                if (options?.userId) {
                    return new SuccessResponse({rooms: [ownRoom], nextPageToken: null});
                }
                return new SuccessResponse({rooms: [ownRoom, otherRoom], nextPageToken: null});
            }),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getRoomListItems()).toHaveLength(1);
        });
        expect(getJoinRoom(0)).toBeDisabled();
        expect(getJoinRoom(0)).toHaveStyle({color: DESIGN_COLORS.dimmedText, borderColor: DESIGN_COLORS.dimmedBorder});
        expect(getRoomStatus(0)).toHaveStyle({color: DESIGN_COLORS.accentGreen, borderColor: DESIGN_COLORS.accentGreen});
    });

    it('WHEN user clicks returnToRoom SHOULD redirect to #/rooms/{roomId} without calling the join API', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const ownRoom = buildRoom({id: 'own-room', name: 'MY_ROOM', users: [{id: CURRENT_USER_ID.value, name: 'Me'}]});
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async (options?: RoomAPIGetRoomsOptions) => {
                if (options?.userId) {
                    return new SuccessResponse({rooms: [ownRoom], nextPageToken: null});
                }
                return new SuccessResponse({rooms: [ownRoom], nextPageToken: null});
            }),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getReturnToRoom()).toBeVisible();
        });

        await user.click(getReturnToRoom());

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/rooms/own-room');
        });
        expect(roomAPI.userJoinRoom).not.toHaveBeenCalled();
    });

    it('WHEN user is not a member of any listed room SHOULD show createRoom and SHOULD NOT show returnToRoom or alreadyInRoomMessage', async () => {
        const router = createMockRouter();
        const otherRoom = buildRoom({id: 'other-room', name: 'OTHER_ROOM'});
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async (options?: RoomAPIGetRoomsOptions) => {
                if (options?.userId) {
                    return new SuccessResponse({rooms: [], nextPageToken: null});
                }
                return new SuccessResponse({rooms: [otherRoom], nextPageToken: null});
            }),
        });

        renderRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getCreateRoom()).toBeVisible();
        });
        expect(roomList().queryByTestId('returnToRoom')).not.toBeInTheDocument();
        expect(roomList().queryByTestId('alreadyInRoomMessage')).not.toBeInTheDocument();
    });
});
