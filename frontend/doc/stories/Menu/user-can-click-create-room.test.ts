import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MenuRoomList} from '@/app/Menu/MenuRoomList';
import type {Router} from '@/domain/shared/service/Router';
import type {RoomAPI, RoomAPIListResponse} from '@/domain/shared/api/RoomAPI';
import {SuccessResponse} from '@/domain/shared/api/APICommon';
import {RoomAPIProvider} from '@/domain/shared/context/RoomAPIContext';
import {RouterProvider} from '@/domain/shared/context/RouterContext';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {createMockRouter, createMockRoomAPI} from '@doc/stories/Menu/shared/mocks';

import {getCreateRoom} from "@doc/stories/Menu/shared/get/roomList.ts";

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
