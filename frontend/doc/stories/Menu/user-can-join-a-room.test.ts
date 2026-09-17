import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MenuRoomList} from '@/app/Menu/RoomList/MenuRoomList';
import type {Router} from '@/domain/shared/service/Router';
import type {RoomAPI, RoomAPIJoinRequest, RoomAPIResponse} from '@/domain/shared/api/RoomAPI';
import {CommonError, SuccessResponse} from '@/domain/shared/api/APICommon';
import {RoomAPIProvider} from '@/domain/shared/context/RoomAPIContext';
import {RouterProvider} from '@/domain/shared/context/RouterContext';
import {UserSessionProvider} from '@/domain/shared/context/UserSessionContext';
import {UserId} from '@/domain/User/UserId';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {DESIGN_COLORS} from '@doc/stories/testUtils';
import {createMockRouter, createMockRoomAPI, createMockUserSession, mockGetRooms} from '@doc/stories/Menu/shared/mocks';
import {buildRoom} from '@doc/stories/Menu/shared/builders';
import {getErrorMessage, getJoinRoom, getRoomStatus} from "@doc/stories/Menu/shared/get/roomList.ts";

const CURRENT_USER_ID = UserId.create();

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

describe('User can join a room from the rooms list', () => {
    it('WHEN room status is WAITING and not full, joinRoom SHOULD be clickable and when clicked SHOULD show loading state until redirected to #/rooms/{roomId}', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        let resolveJoin: (value: RoomAPIResponse) => void = () => {};
        const roomAPI = createMockRoomAPI({
            getRooms: mockGetRooms({
                results: [buildRoom({status: GameStatusEnum.WAITING_FOR_PLAYERS, users: [{id: 'user-1', name: 'PlayerOne'}]})],
                nextPageToken: null,
            }),
            userJoinRoom: vi.fn((_roomId, _body: RoomAPIJoinRequest) => new Promise<RoomAPIResponse>((resolve) => {
                resolveJoin = resolve;
            })),
        });

        renderMenuRoomList(roomAPI, router);

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
            getRooms: mockGetRooms({
                results: [buildRoom({status: GameStatusEnum.IN_PROGRESS})],
                nextPageToken: null,
            }),
        });

        renderMenuRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getJoinRoom()).toBeDisabled();
        });
        expect(getJoinRoom()).toHaveStyle({color: DESIGN_COLORS.dimmedText, borderColor: DESIGN_COLORS.dimmedBorder});
        expect(getRoomStatus()).toHaveStyle({color: DESIGN_COLORS.statusInProgress, borderColor: DESIGN_COLORS.statusInProgress});
    });

    it('WHEN room status is ENDED, joinRoom SHOULD NOT be clickable', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: mockGetRooms({
                results: [buildRoom({status: GameStatusEnum.ENDED})],
                nextPageToken: null,
            }),
        });

        renderMenuRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getJoinRoom()).toBeDisabled();
        });
        expect(getJoinRoom()).toHaveStyle({color: DESIGN_COLORS.dimmedText, borderColor: DESIGN_COLORS.dimmedBorder});
        expect(getRoomStatus()).toHaveStyle({color: DESIGN_COLORS.errorRed, borderColor: DESIGN_COLORS.errorRed});
    });

    it('WHEN room is full (2/2 players), joinRoom SHOULD NOT be clickable', async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: mockGetRooms({
                results: [buildRoom({status: GameStatusEnum.WAITING_FOR_PLAYERS, users: [{id: 'user-1', name: 'PlayerOne'}, {id: 'user-2', name: 'PlayerTwo'}]})],
                nextPageToken: null,
            }),
        });

        renderMenuRoomList(roomAPI, router);

        await waitFor(() => {
            expect(getJoinRoom()).toBeDisabled();
        });
        expect(getJoinRoom()).toHaveStyle({color: DESIGN_COLORS.dimmedText, borderColor: DESIGN_COLORS.dimmedBorder});
        expect(getRoomStatus()).toHaveStyle({color: DESIGN_COLORS.accentGreen, borderColor: DESIGN_COLORS.accentGreen});
    });

    it('WHEN user clicks joinRoom and the request fails SHOULD show errorMessage and joinRoom SHOULD return to its default clickable state', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRooms: mockGetRooms({
                results: [buildRoom({status: GameStatusEnum.WAITING_FOR_PLAYERS, users: [{id: 'user-1', name: 'PlayerOne'}]})],
                nextPageToken: null,
            }),
            userJoinRoom: vi.fn(async (_roomId, _body: RoomAPIJoinRequest) =>
                new CommonError('Unable to join room', 400)
            ),
        });

        renderMenuRoomList(roomAPI, router);

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
