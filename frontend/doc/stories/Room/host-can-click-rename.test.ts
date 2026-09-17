import {describe, expect, it, vi} from 'vitest';
import {waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SuccessResponse} from '@/domain/shared/api/APICommon';
import {UserId} from '@/domain/User/UserId';
import {createMockRoomAPI, createMockRoomEventsSocket, createMockRouter, createMockUserSession} from '@doc/stories/Room/shared/mocks';
import {buildRoom, DEFAULT_ROOM_ID} from '@doc/stories/Room/shared/builders';
import {renderRoomPage} from '@doc/stories/Room/shared/render';
import {getRenameRoom} from '@doc/stories/Room/shared/get/room';

const HOST_ID = UserId.create();

describe('Host can click RENAME to go to the room rename form', () => {
    it('WHEN the host clicks renameRoom SHOULD be redirected to #/rooms/{roomId}/rename', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const roomAPI = createMockRoomAPI({
            getRoom: vi.fn(async () => new SuccessResponse(buildRoom({hostId: HOST_ID.value, users: [{id: HOST_ID.value, name: 'HostPlayer'}]}))),
        });
        const userSession = createMockUserSession(HOST_ID);
        const {roomEventsSocket} = createMockRoomEventsSocket();

        renderRoomPage(roomAPI, router, userSession, roomEventsSocket);

        await waitFor(() => {
            expect(getRenameRoom()).toBeInTheDocument();
        });

        await user.click(getRenameRoom());

        expect(router.push).toHaveBeenCalledWith(`#/rooms/${DEFAULT_ROOM_ID}/rename`);
    });
});
