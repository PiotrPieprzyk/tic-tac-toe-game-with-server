import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {RoomForm} from '@/app/Menu/RoomForm';
import type {Router} from '@/domain/shared/service/Router';
import type {RoomAPI, RoomAPIAddRequest, RoomAPIResponse} from '@/domain/shared/api/RoomAPI';
import {CommonError, SuccessResponse} from '@/domain/shared/api/APICommon';
import {RoomAPIProvider} from '@/domain/shared/context/RoomAPIContext';
import {RouterProvider} from '@/domain/shared/context/RouterContext';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {DESIGN_COLORS} from '@doc/stories/testUtils';
import {createMockRouter, createMockRoomAPI} from '@doc/stories/Menu/shared/mocks';
import {getCreateRoom, getRoomNameErrorMessage, getRoomNameInput} from "@doc/stories/Menu/shared/get/roomForm.ts";

function renderRoomForm(roomAPI: RoomAPI, router: Router) {
    return render(
        createElement(
            RouterProvider,
            {router, children: createElement(
                RoomAPIProvider,
                {roomAPI, children: createElement(RoomForm)}
            )}
        )
    );
}

describe('User can create a room, but only one', () => {
    it('WHEN user type roomName "ValidName", createRoom button SHOULD be clickable and when clicked SHOULD show loading state for createRoom button until redirected to #/rooms/{roomId}', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        let resolveAddRoom: (value: RoomAPIResponse) => void = () => {};
        const roomAPI = createMockRoomAPI({
            addRoom: vi.fn((_body: RoomAPIAddRequest) => new Promise<RoomAPIResponse>((resolve) => {
                resolveAddRoom = resolve;
            })),
        });

        renderRoomForm(roomAPI, router);

        const input = getRoomNameInput();
        const createRoom = getCreateRoom();

        await user.type(input, 'ValidName');

        expect(createRoom).toBeEnabled();

        await user.click(createRoom);

        expect(createRoom).toHaveAttribute('aria-busy', 'true');
        expect(createRoom).toBeDisabled();

        resolveAddRoom(new SuccessResponse({
            id: 'room-1', name: 'ValidName', hostId: 'host-1', activeGameId: '', users: [], status: GameStatusEnum.WAITING_FOR_PLAYERS,
        }));

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith(expect.stringMatching(/^#\/rooms\//));
        });
    });

    it('WHEN user type roomName "TakenName" createRoom button SHOULD NOT be clickable and errorMessage should be visible', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            addRoom: vi.fn(async (_body: RoomAPIAddRequest) =>
                new CommonError('Room name already taken', 400)
            ),
        });

        renderRoomForm(roomAPI, router);

        const input = getRoomNameInput();
        const createRoom = getCreateRoom();

        await user.type(input, 'TakenName');
        await user.click(createRoom);

        await waitFor(() => {
            expect(getRoomNameErrorMessage()).toBeVisible();
        });
        expect(getRoomNameErrorMessage()).toHaveTextContent('ERR: ROOM_NAME_TAKEN — TRY ANOTHER');
        expect(getRoomNameErrorMessage()).toHaveStyle({color: DESIGN_COLORS.errorRed});
        expect(createRoom).toBeDisabled();
    });

    it('WHEN user try to create room but room is already created createRoom button SHOULD NOT be clickable and errorMessage should be visible', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            addRoom: vi.fn(async (_body: RoomAPIAddRequest) =>
                new CommonError('User already created room', 400)
            ),
        });

        renderRoomForm(roomAPI, router);

        const input = getRoomNameInput();
        const createRoom = getCreateRoom();

        await user.type(input, 'TakenName');
        await user.click(createRoom);

        await waitFor(() => {
            expect(getRoomNameErrorMessage()).toBeVisible();
        });
        expect(getRoomNameErrorMessage()).toHaveTextContent('ERR: USER_ALREADY_CREATED_ROOM — CLICK CANCEL');
        expect(getRoomNameErrorMessage()).toHaveStyle({color: DESIGN_COLORS.errorRed});
        expect(createRoom).toBeDisabled();
    });

    it('WHEN user type roomName "Sh" createRoom button SHOULD NOT be clickable and errorMessage should be visible', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI();

        renderRoomForm(roomAPI, router);

        const input = getRoomNameInput();
        const createRoom = getCreateRoom();

        await user.type(input, 'Sh');

        expect(getRoomNameErrorMessage()).toBeVisible();
        expect(getRoomNameErrorMessage()).toHaveTextContent('ERR: ROOM_NAME_TOO_SHORT — (MIN 3 CHARS)');
        expect(getRoomNameErrorMessage()).toHaveStyle({color: DESIGN_COLORS.errorRed});
        expect(createRoom).toBeDisabled();
        expect(roomAPI.addRoom).not.toHaveBeenCalled();
    });
});
