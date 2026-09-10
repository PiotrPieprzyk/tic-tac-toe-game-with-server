import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {RoomList} from '../../../src/app/Menu/RoomList';
import type {Router} from '../../../src/domain/shared/service/Router';
import type {RoomAPI, RoomAPIGetRoomsOptions, RoomAPIResponseRaw} from '../../../src/domain/shared/api/RoomAPI';
import {SuccessResponse} from '../../../src/domain/shared/api/APICommon';
import {RoomAPIProvider} from '../../../src/infra/api/RoomAPIContext';
import {RouterProvider} from '../../../src/infra/service/RouterContext';
import {UserSessionProvider} from '../../../src/infra/service/UserSessionContext';
import {UserId} from '../../../src/domain/User/UserId';
import {GameStatusEnum} from '../../../src/domain/Game/GameStatus';

const CURRENT_USER_ID = UserId.create();

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
                UserSessionProvider,
                {userId: CURRENT_USER_ID, children: createElement(
                    RoomAPIProvider,
                    {roomAPI, children: createElement(RoomList)}
                )}
            )}
        )
    );
}

function userlist() {
    return within(screen.getByTestId('userlist'));
}

function getCreateRoom() {
    return userlist().getByTestId('createRoom');
}

function getReturnToRoom() {
    return userlist().getByTestId('returnToRoom');
}

function getAlreadyInRoomMessage() {
    return userlist().getByTestId('alreadyInRoomMessage');
}

function getRoomListItems() {
    return userlist().queryAllByTestId('roomListItem');
}

function getJoinRoom(index: number) {
    return within(getRoomListItems()[index]).getByTestId('joinRoom');
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
        expect(userlist().queryByTestId('createRoom')).not.toBeInTheDocument();
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
        expect(userlist().queryByTestId('returnToRoom')).not.toBeInTheDocument();
        expect(userlist().queryByTestId('alreadyInRoomMessage')).not.toBeInTheDocument();
    });
});
