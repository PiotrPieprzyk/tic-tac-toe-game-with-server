import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MenuRoomList} from '../../../src/app/Menu/MenuRoomList';
import type {Router} from '../../../src/domain/shared/service/Router';
import type {RoomAPI, RoomAPIListResponse} from '../../../src/domain/shared/api/RoomAPI';
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

function renderMenuRoomList(roomAPI: RoomAPI, router: Router) {
    return render(
        createElement(
            RouterProvider,
            {router, children: createElement(
                RoomAPIProvider,
                {roomAPI, children: createElement(MenuRoomList)}
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

describe('User can create a room, but only one', () => {
    it('WHEN rooms found and user clicks createRoom button SHOULD be redirected to #/rooms/create', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({
                rooms: [{id: 'room-1', name: 'ROOM_NULL_PTR', hostId: 'host-1', activeGameId: '', users: [], status: GameStatusEnum.WAITING_FOR_PLAYERS}],
                nextPageToken: null,
            })),
        });

        renderMenuRoomList(roomAPI, router);

        await waitFor(() => {
            expect(roomAPI.getRooms).toHaveBeenCalled();
        });

        await user.click(getCreateRoom());

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/rooms/create');
        });
    });

    it('WHEN no rooms found and user clicks createRoom button SHOULD be redirected to #/rooms/create', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(async () => new SuccessResponse({rooms: [], nextPageToken: null})),
        });

        renderMenuRoomList(roomAPI, router);

        await waitFor(() => {
            expect(roomAPI.getRooms).toHaveBeenCalled();
        });

        await user.click(getCreateRoom());

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/rooms/create');
        });
    });

    it('WHEN rooms loading and user clicks createRoom button SHOULD be redirected to #/rooms/create', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: vi.fn(() => new Promise<RoomAPIListResponse>(() => {})),
        });

        renderMenuRoomList(roomAPI, router);

        await user.click(getCreateRoom());

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/rooms/create');
        });
    });
});
