import {describe, expect, it, vi} from 'vitest';
import {waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CommonError, SuccessResponse} from '@/domain/shared/api/APICommon';
import type {RoomAPIResponse} from '@/domain/shared/api/RoomAPI';
import {UserId} from '@/domain/User/UserId';
import {DESIGN_COLORS} from '@doc/stories/testUtils';
import {createMockRoomAPI, createMockRouter, createMockUserSession} from '@doc/stories/Room/shared/mocks';
import {buildRoom, DEFAULT_ROOM_ID} from '@doc/stories/Room/shared/builders';
import {renderRoomRenameForm} from '@doc/stories/Room/shared/render';
import {getCancel, getRoomNameErrorMessage, getRoomNameInput, getSaveRename} from '@doc/stories/Room/shared/get/roomRenameForm';

const HOST_ID = UserId.create();

describe('Host can rename the room', () => {
    it("WHEN the form loads SHOULD prefill the input with the room's current name", async () => {
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST_ID.value, name: 'ROOM_NULL_PTR'}))),
        });
        const userSession = createMockUserSession(HOST_ID);

        renderRoomRenameForm(roomAPI, router, userSession);

        await waitFor(() => {
            expect(getRoomNameInput()).toHaveValue('ROOM_NULL_PTR');
        });
    });

    it('WHEN the host types roomName "ValidName", saveRename SHOULD be clickable and when clicked SHOULD show loading state until redirected to #/rooms/{roomId}', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        let resolveUpdateRoom: (value: RoomAPIResponse) => void = () => {};
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST_ID.value, name: 'ROOM_NULL_PTR'}))),
            updateRoom: vi.fn(() => new Promise<RoomAPIResponse>((resolve) => {
                resolveUpdateRoom = resolve;
            })),
        });
        const userSession = createMockUserSession(HOST_ID);

        renderRoomRenameForm(roomAPI, router, userSession);

        await waitFor(() => {
            expect(getRoomNameInput()).toHaveValue('ROOM_NULL_PTR');
        });

        await user.clear(getRoomNameInput());
        await user.type(getRoomNameInput(), 'ValidName');

        const saveRename = getSaveRename();
        expect(saveRename).toBeEnabled();

        await user.click(saveRename);

        expect(saveRename).toHaveAttribute('aria-busy', 'true');
        expect(saveRename).toBeDisabled();

        resolveUpdateRoom(new SuccessResponse(buildRoom({hostId: HOST_ID.value, name: 'ValidName'})));

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith(`#/rooms/${DEFAULT_ROOM_ID}`);
        });
    });

    it('WHEN the host types roomName "Sh" saveRename SHOULD NOT be clickable and errorMessage should be visible', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST_ID.value, name: 'ROOM_NULL_PTR'}))),
        });
        const userSession = createMockUserSession(HOST_ID);

        renderRoomRenameForm(roomAPI, router, userSession);

        await waitFor(() => {
            expect(getRoomNameInput()).toHaveValue('ROOM_NULL_PTR');
        });

        await user.clear(getRoomNameInput());
        await user.type(getRoomNameInput(), 'Sh');

        expect(getRoomNameErrorMessage()).toHaveTextContent('ERR: ROOM_NAME_TOO_SHORT — (MIN 3 CHARS)');
        expect(getRoomNameErrorMessage()).toHaveStyle({color: DESIGN_COLORS.errorRed});
        expect(getSaveRename()).toBeDisabled();
    });

    it('WHEN the host submits a taken roomName SHOULD show errorMessage and SHOULD NOT navigate away', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST_ID.value, name: 'ROOM_NULL_PTR'}))),
            updateRoom: vi.fn(async () => new CommonError('Room name already taken', 400)),
        });
        const userSession = createMockUserSession(HOST_ID);

        renderRoomRenameForm(roomAPI, router, userSession);

        await waitFor(() => {
            expect(getRoomNameInput()).toHaveValue('ROOM_NULL_PTR');
        });

        await user.clear(getRoomNameInput());
        await user.type(getRoomNameInput(), 'TakenName');
        await user.click(getSaveRename());

        await waitFor(() => {
            expect(getRoomNameErrorMessage()).toBeVisible();
        });
        expect(getRoomNameErrorMessage()).toHaveTextContent('ERR: ROOM_NAME_TAKEN — TRY ANOTHER');
        expect(router.push).not.toHaveBeenCalled();
    });

    it('WHEN the host clicks cancel SHOULD be redirected to #/rooms/{roomId} without renaming', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST_ID.value, name: 'ROOM_NULL_PTR'}))),
        });
        const userSession = createMockUserSession(HOST_ID);

        renderRoomRenameForm(roomAPI, router, userSession);

        await waitFor(() => {
            expect(getCancel()).toBeInTheDocument();
        });

        await user.click(getCancel());

        expect(router.push).toHaveBeenCalledWith(`#/rooms/${DEFAULT_ROOM_ID}`);
        expect(roomAPI.updateRoom).not.toHaveBeenCalled();
    });
});
