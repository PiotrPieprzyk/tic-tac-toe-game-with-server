import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {RoomForm} from '../../../src/app/Menu/RoomForm';
import type {Router} from '../../../src/domain/shared/service/Router';
import type {RoomAPI, RoomAPIAddRequest, RoomAPIResponse} from '../../../src/domain/shared/api/RoomAPI';
import {CommonError, SuccessResponse} from '../../../src/domain/shared/api/APICommon';
import {RoomAPIProvider} from '../../../src/infra/api/RoomAPIContext';
import {RouterProvider} from '../../../src/infra/service/RouterContext';
import {GameStatusEnum} from '../../../src/domain/Game/GameStatus';
import {DESIGN_COLORS} from '../testUtils';

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

function roomForm() {
    return within(screen.getByTestId('roomForm'));
}

function getRoomNameTextField() {
    return within(roomForm().getByTestId('roomNameTextField'));
}

function getInput() {
    return getRoomNameTextField().getByTestId('input');
}

function getErrorMessage() {
    return getRoomNameTextField().getByTestId('errorMessage');
}

function getCreateRoom() {
    return roomForm().getByTestId('createRoom');
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

        const input = getInput();
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

        const input = getInput();
        const createRoom = getCreateRoom();

        await user.type(input, 'TakenName');
        await user.click(createRoom);

        await waitFor(() => {
            expect(getErrorMessage()).toBeVisible();
        });
        expect(getErrorMessage()).toHaveTextContent('ERR: ROOM_NAME_TAKEN — TRY ANOTHER');
        expect(getErrorMessage()).toHaveStyle({color: DESIGN_COLORS.errorRed});
        expect(createRoom).toBeDisabled();
    });

    it('WHEN user type roomName "Sh" createRoom button SHOULD NOT be clickable and errorMessage should be visible', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI();

        renderRoomForm(roomAPI, router);

        const input = getInput();
        const createRoom = getCreateRoom();

        await user.type(input, 'Sh');

        expect(getErrorMessage()).toBeVisible();
        expect(getErrorMessage()).toHaveTextContent('ERR: ROOM_NAME_TOO_SHORT — (MIN 3 CHARS)');
        expect(getErrorMessage()).toHaveStyle({color: DESIGN_COLORS.errorRed});
        expect(createRoom).toBeDisabled();
        expect(roomAPI.addRoom).not.toHaveBeenCalled();
    });
});
