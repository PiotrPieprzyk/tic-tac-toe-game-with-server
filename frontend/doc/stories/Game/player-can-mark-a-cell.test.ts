import {describe, expect, it, vi} from 'vitest';
import {waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CommonError, SuccessResponse} from '@/domain/shared/api/APICommon';
import {createMockGameAPI, createMockGameEventsSocket, createMockRouter, createMockUserSession} from '@doc/stories/Game/shared/mocks';
import {buildCells, buildGame, DEFAULT_GAME_ID, O_PLAYER, O_USER_ID, X_PLAYER, X_USER_ID} from '@doc/stories/Game/shared/builders';
import {renderGamePage} from '@doc/stories/Game/shared/render';
import {getCell, getCells, getErrorMessage, getGameStatus} from '@doc/stories/Game/shared/get/game';

function inProgressGame(activePlayerId: string) {
    return buildGame({cells: buildCells({0: 'X', 4: 'O'}), activePlayerId});
}

describe('Player can mark a cell', () => {
    it("WHEN it is the current user's turn SHOULD enable the empty cells and disable the already marked ones", async () => {
        const router = createMockRouter();
        const gameAPI = createMockGameAPI({
            getGame: vi.fn(async () => new SuccessResponse(inProgressGame(X_PLAYER.id))),
        });
        const userSession = createMockUserSession(X_USER_ID);
        const {gameEventsSocket} = createMockGameEventsSocket();

        renderGamePage(gameAPI, router, userSession, gameEventsSocket);

        await waitFor(() => {
            expect(getCells()).toHaveLength(9);
        });
        expect(getCell(0)).toBeDisabled();
        expect(getCell(4)).toBeDisabled();
        for (const position of [1, 2, 3, 5, 6, 7, 8]) {
            expect(getCell(position)).toBeEnabled();
        }
    });

    it("WHEN it is the opponent's turn SHOULD disable every cell and not send a mark request when one is clicked", async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const gameAPI = createMockGameAPI({
            getGame: vi.fn(async () => new SuccessResponse(inProgressGame(X_PLAYER.id))),
            markCell: vi.fn(async () => ({})),
        });
        const userSession = createMockUserSession(O_USER_ID);
        const {gameEventsSocket} = createMockGameEventsSocket();

        renderGamePage(gameAPI, router, userSession, gameEventsSocket);

        await waitFor(() => {
            expect(getCells()).toHaveLength(9);
        });
        for (const cell of getCells()) {
            expect(cell).toBeDisabled();
        }

        await user.click(getCell(1));

        expect(gameAPI.markCell).not.toHaveBeenCalled();
    });

    it('WHEN the active player clicks an empty cell SHOULD immediately mark it and switch the turn to the opponent, then send the mark request for that position', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const gameAPI = createMockGameAPI({
            getGame: vi.fn(async () => new SuccessResponse(inProgressGame(X_PLAYER.id))),
            markCell: vi.fn(async () => ({})),
        });
        const userSession = createMockUserSession(X_USER_ID);
        const {gameEventsSocket, getHandlers} = createMockGameEventsSocket();

        renderGamePage(gameAPI, router, userSession, gameEventsSocket);

        await waitFor(() => {
            expect(getCell(1)).toBeEnabled();
        });

        await user.click(getCell(1));

        // Optimistic update: the board and active player switch immediately, before the request settles.
        await waitFor(() => {
            expect(getCell(1)).toHaveTextContent('X');
        });
        expect(getGameStatus()).toHaveTextContent('> AWAITING_INPUT: CIPHER_88');
        for (const cell of getCells()) {
            expect(cell).toBeDisabled();
        }
        expect(gameAPI.markCell).toHaveBeenCalledWith(expect.objectContaining({value: DEFAULT_GAME_ID}), {position: 1});

        getHandlers().onGameLastTurn?.(buildGame({
            cells: buildCells({0: 'X', 4: 'O', 1: 'X'}),
            activePlayerId: O_PLAYER.id,
        }));

        // The confirming event matches the optimistic state, so nothing visibly changes.
        await waitFor(() => {
            expect(getCell(1)).toHaveTextContent('X');
        });
        expect(getGameStatus()).toHaveTextContent('> AWAITING_INPUT: CIPHER_88');
        expect(gameAPI.getGame).toHaveBeenCalledTimes(1);
    });

    it('WHEN marking the cell fails SHOULD show an error message and revert the optimistic mark and turn switch', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const gameAPI = createMockGameAPI({
            getGame: vi.fn(async () => new SuccessResponse(inProgressGame(X_PLAYER.id))),
            markCell: vi.fn(async () => new CommonError('Not player turn', 400)),
        });
        const userSession = createMockUserSession(X_USER_ID);
        const {gameEventsSocket} = createMockGameEventsSocket();

        renderGamePage(gameAPI, router, userSession, gameEventsSocket);

        await waitFor(() => {
            expect(getCell(1)).toBeEnabled();
        });

        await user.click(getCell(1));

        await waitFor(() => {
            expect(getErrorMessage()).toBeVisible();
        });
        expect(getCell(1)).toHaveTextContent('_');
        expect(getCell(1)).toBeEnabled();
        expect(getGameStatus()).toHaveTextContent('> AWAITING_INPUT: NEO_7734');
    });
});
