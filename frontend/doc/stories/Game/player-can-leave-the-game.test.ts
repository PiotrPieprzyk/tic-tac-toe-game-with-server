import {describe, expect, it, vi} from 'vitest';
import {waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CommonError, SuccessResponse} from '@/domain/shared/api/APICommon';
import {createMockGameAPI, createMockGameEventsSocket, createMockRouter, createMockUserSession} from '@doc/stories/Game/shared/mocks';
import {buildGame, DEFAULT_GAME_ID, DEFAULT_ROOM_ID, O_PLAYER, X_PLAYER, X_USER_ID} from '@doc/stories/Game/shared/builders';
import {renderGamePage} from '@doc/stories/Game/shared/render';
import {getErrorMessage, getLeaveGame, getPlayerName} from '@doc/stories/Game/shared/get/game';

describe('Player can leave the game', () => {
    it("WHEN the player clicks leaveGame SHOULD leave the game and navigate to the game's room", async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const gameAPI = createMockGameAPI({
            getGame: vi.fn(async () => new SuccessResponse(buildGame())),
            leaveGame: vi.fn(async () => ({})),
        });
        const userSession = createMockUserSession(X_USER_ID);
        const {gameEventsSocket} = createMockGameEventsSocket();

        renderGamePage(gameAPI, router, userSession, gameEventsSocket);

        await waitFor(() => {
            expect(getLeaveGame()).toBeInTheDocument();
        });

        await user.click(getLeaveGame());

        await waitFor(() => {
            expect(gameAPI.leaveGame).toHaveBeenCalledWith(expect.objectContaining({value: DEFAULT_GAME_ID}));
        });
        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith(`#/rooms/${DEFAULT_ROOM_ID}`);
        });
    });

    it('WHEN leaving the game fails SHOULD show an error message and keep the player on the game page', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const gameAPI = createMockGameAPI({
            getGame: vi.fn(async () => new SuccessResponse(buildGame())),
            leaveGame: vi.fn(async () => new CommonError('SERVER ERR', 400)),
        });
        const userSession = createMockUserSession(X_USER_ID);
        const {gameEventsSocket} = createMockGameEventsSocket();

        renderGamePage(gameAPI, router, userSession, gameEventsSocket);

        await waitFor(() => {
            expect(getLeaveGame()).toBeInTheDocument();
        });

        await user.click(getLeaveGame());

        await waitFor(() => {
            expect(getErrorMessage()).toBeVisible();
        });
        expect(getPlayerName(0)).toHaveTextContent(X_PLAYER.userName);
        expect(getPlayerName(1)).toHaveTextContent(O_PLAYER.userName);
        expect(router.push).not.toHaveBeenCalled();
    });
});
