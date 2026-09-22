import {describe, expect, it, vi} from 'vitest';
import {waitFor} from '@testing-library/react';
import {CommonError, SuccessResponse} from '@/domain/shared/api/APICommon';
import {DESIGN_COLORS} from '@doc/stories/testUtils';
import {createMockGameAPI, createMockGameEventsSocket, createMockRouter, createMockUserSession} from '@doc/stories/Game/shared/mocks';
import {buildCells, buildGame, O_PLAYER, X_PLAYER, X_USER_ID} from '@doc/stories/Game/shared/builders';
import {renderGamePage} from '@doc/stories/Game/shared/render';
import {
    getCell,
    getCells,
    getGameStatus,
    getLeaveGame,
    getPlayerMark,
    getPlayerName,
    getPlayers,
    queryWinLine,
} from '@doc/stories/Game/shared/get/game';

describe("Player can see the game's details: players, marks, whose turn it is, and the board", () => {
    it("WHEN the game is IN_PROGRESS and it is the opponent's turn SHOULD show both players' names and marks with the active player highlighted, the AWAITING_INPUT status, the board with marked and empty cells, and an enabled LEAVE_GAME", async () => {
        const router = createMockRouter();
        const gameAPI = createMockGameAPI({
            getGame: vi.fn(async () => new SuccessResponse(buildGame({
                cells: buildCells({0: 'X', 4: 'X', 1: 'O'}),
                activePlayerId: O_PLAYER.id,
            }))),
        });
        const userSession = createMockUserSession(X_USER_ID);
        const {gameEventsSocket} = createMockGameEventsSocket();

        renderGamePage(gameAPI, router, userSession, gameEventsSocket);

        await waitFor(() => {
            expect(getGameStatus()).toHaveTextContent('> AWAITING_INPUT: CIPHER_88');
        });
        expect(getGameStatus()).toHaveStyle({color: DESIGN_COLORS.accentGreen});

        expect(getPlayers()).toHaveLength(2);
        expect(getPlayerName(0)).toHaveTextContent(X_PLAYER.userName);
        expect(getPlayerName(0)).toHaveStyle({color: DESIGN_COLORS.text});
        expect(getPlayerMark(0)).toHaveTextContent('X');
        expect(getPlayerMark(0)).toHaveStyle({color: DESIGN_COLORS.mutedPlayer});
        expect(getPlayerName(1)).toHaveTextContent(O_PLAYER.userName);
        expect(getPlayerName(1)).toHaveStyle({color: DESIGN_COLORS.accentGreen});
        expect(getPlayerMark(1)).toHaveTextContent('O');
        expect(getPlayerMark(1)).toHaveStyle({color: DESIGN_COLORS.accentGreen});

        expect(getCells()).toHaveLength(9);
        expect(getCell(0)).toHaveTextContent('X');
        expect(getCell(0)).toHaveStyle({color: DESIGN_COLORS.xMark});
        expect(getCell(4)).toHaveTextContent('X');
        expect(getCell(4)).toHaveStyle({color: DESIGN_COLORS.xMark});
        expect(getCell(1)).toHaveTextContent('O');
        expect(getCell(1)).toHaveStyle({color: DESIGN_COLORS.accentGreen});
        for (const position of [2, 3, 5, 6, 7, 8]) {
            expect(getCell(position)).toHaveTextContent('_');
            expect(getCell(position)).toHaveStyle({color: DESIGN_COLORS.emptyCell});
        }
        expect(queryWinLine()).not.toBeInTheDocument();

        expect(getLeaveGame()).toHaveTextContent('LEAVE_GAME');
        expect(getLeaveGame()).toBeEnabled();
        expect(gameAPI.getGame).toHaveBeenCalledTimes(1);
    });

    it('WHEN the game fails to load SHOULD redirect to #/rooms', async () => {
        const router = createMockRouter();
        const gameAPI = createMockGameAPI({
            getGame: vi.fn(async () => new CommonError('Game not found', 404)),
        });
        const userSession = createMockUserSession(X_USER_ID);
        const {gameEventsSocket} = createMockGameEventsSocket();

        renderGamePage(gameAPI, router, userSession, gameEventsSocket);

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/rooms');
        });
    });
});
