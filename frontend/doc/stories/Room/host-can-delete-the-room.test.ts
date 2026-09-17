import {describe, expect, it, vi} from 'vitest';
import {waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CommonError, SuccessResponse} from '@/domain/shared/api/APICommon';
import {UserId} from '@/domain/User/UserId';
import {createMockRoomAPI, createMockRoomEventsSocket, createMockRouter, createMockUserSession} from '@doc/stories/Room/shared/mocks';
import {buildRoom} from '@doc/stories/Room/shared/builders';
import {renderRoomPage} from '@doc/stories/Room/shared/render';
import {getDeleteRoom, getErrorMessage, getRoomName} from '@doc/stories/Room/shared/get/room';

const HOST_ID = UserId.create();

describe('Host can delete the room', () => {
    it('WHEN the host clicks deleteRoom SHOULD delete the room and navigate back to #/rooms', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST_ID.value, users: [{id: HOST_ID.value, name: 'HostPlayer'}]}))),
            deleteRoom: vi.fn(async () => new SuccessResponse(undefined)),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getDeleteRoom()).toBeInTheDocument();
        });

        await user.click(getDeleteRoom());

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/rooms');
        });
    });

    it('WHEN deleting the room fails SHOULD show an error message and keep the room displayed', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST_ID.value, users: [{id: HOST_ID.value, name: 'HostPlayer'}]}))),
            deleteRoom: vi.fn(async () => new CommonError('SERVER ERR', 400)),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getDeleteRoom()).toBeInTheDocument();
        });

        await user.click(getDeleteRoom());

        await waitFor(() => {
            expect(getErrorMessage()).toBeVisible();
        });
        expect(getRoomName()).toBeInTheDocument();
        expect(router.push).not.toHaveBeenCalled();
    });
});
