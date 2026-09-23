import {describe, expect, it, vi} from 'vitest';
import {waitFor} from '@testing-library/react';
import {SuccessResponse} from '@/domain/shared/api/APICommon';
import {GameStatusEnum} from '@/domain/Game/GameStatus';
import {GameResultEnum} from '@/domain/Game/GameResult';
import {DESIGN_COLORS} from '@doc/stories/testUtils';
import {createMockGameAPI, createMockGameEventsSocket, createMockRouter, createMockUserSession} from '@doc/stories/Game/shared/mocks';
import {buildCells, buildGame, DEFAULT_GAME_ID, O_PLAYER, O_USER_ID, X_PLAYER, X_USER_ID} from '@doc/stories/Game/shared/builders';
import {renderGamePage} from '@doc/stories/Game/shared/render';
import {
    getCell,
    getCells,
    getGameStatus,
    getLeaveGame,
    getPlayerMark,
    getPlayerName,
    getPlayers,
    getWinLine,
    queryWinLine,
} from '@doc/stories/Game/shared/get/game';

describe('Player can see that the game is updated automatically', () => {
    it('WHEN a gameLastTurn event is received SHOULD show the newly marked cell and switch the AWAITING_INPUT status and the highlighted player to the next player without refetching the game', async () => {
        const router = createMockRouter();
        const gameAPI = createMockGameAPI({
            getGame: vi.fn(async () => new SuccessResponse(buildGame({cells: [], activePlayerId: X_PLAYER.id}))),
        });
        const userSession = createMockUserSession(O_USER_ID);
        const {gameEventsSocket, getHandlers} = createMockGameEventsSocket();

        renderGamePage(gameAPI, router, userSession, gameEventsSocket);

        await waitFor(() => {
            expect(getGameStatus()).toHaveTextContent('> AWAITING_INPUT: NEO_7734');
        });
        expect(gameEventsSocket.subscribeToGame).toHaveBeenCalledWith(DEFAULT_GAME_ID, expect.anything());
        expect(getCell(4)).toHaveTextContent('_');

        getHandlers().onGameLastTurn?.(buildGame({cells: buildCells({4: 'X'}), activePlayerId: O_PLAYER.id}));

        await waitFor(() => {
            expect(getCell(4)).toHaveTextContent('X');
        });
        expect(getGameStatus()).toHaveTextContent('> AWAITING_INPUT: CIPHER_88');
        expect(getPlayerName(0)).toHaveStyle({color: DESIGN_COLORS.text});
        expect(getPlayerName(1)).toHaveStyle({color: DESIGN_COLORS.accentGreen});
        expect(gameAPI.getGame).toHaveBeenCalledTimes(1);
    });

    it('WHEN a gameEnded event with result WIN is received SHOULD show GAME_OVER with the winner, highlight the winner and the winning cells, draw the winLine and disable the board', async () => {
        const router = createMockRouter();
        const gameAPI = createMockGameAPI({
            getGame: vi.fn(async () => new SuccessResponse(buildGame({
                cells: buildCells({0: 'X', 1: 'X', 3: 'O', 4: 'O'}),
                activePlayerId: X_PLAYER.id,
            }))),
        });
        const userSession = createMockUserSession(O_USER_ID);
        const {gameEventsSocket, getHandlers} = createMockGameEventsSocket();

        renderGamePage(gameAPI, router, userSession, gameEventsSocket);

        await waitFor(() => {
            expect(getGameStatus()).toHaveTextContent('> AWAITING_INPUT: NEO_7734');
        });
        expect(queryWinLine()).not.toBeInTheDocument();

        getHandlers().onGameEnded?.(buildGame({
            cells: buildCells({0: 'X', 1: 'X', 2: 'X', 3: 'O', 4: 'O'}),
            status: GameStatusEnum.ENDED,
            result: GameResultEnum.WIN,
            winnerId: X_PLAYER.id,
            activePlayerId: X_PLAYER.id,
        }));

        await waitFor(() => {
            expect(getGameStatus()).toHaveTextContent('> GAME_OVER: NEO_7734_WINS');
        });
        expect(getGameStatus()).toHaveStyle({color: DESIGN_COLORS.accentGreen});
        expect(getGameStatus()).toHaveStyle({textShadow: '0 0 10px rgb(0, 255, 156)'});

        expect(getPlayerName(0)).toHaveStyle({color: DESIGN_COLORS.accentGreen});
        expect(getPlayerMark(0)).toHaveStyle({color: DESIGN_COLORS.accentGreen});
        expect(getPlayerName(1)).toHaveStyle({color: DESIGN_COLORS.mutedPlayer});
        expect(getPlayerMark(1)).toHaveStyle({color: DESIGN_COLORS.mutedPlayer});

        for (const position of [0, 1, 2]) {
            expect(getCell(position)).toHaveTextContent('X');
            expect(getCell(position)).toHaveStyle({color: DESIGN_COLORS.accentGreen});
        }
        for (const position of [3, 4]) {
            expect(getCell(position)).toHaveTextContent('O');
            expect(getCell(position)).not.toHaveStyle({color: DESIGN_COLORS.accentGreen});
        }
        expect(getWinLine()).toBeInTheDocument();
        expect(getWinLine()).toHaveStyle({backgroundColor: DESIGN_COLORS.accentGreen});

        for (const cell of getCells()) {
            expect(cell).toBeDisabled();
        }
        expect(getLeaveGame()).toBeEnabled();
        expect(gameAPI.getGame).toHaveBeenCalledTimes(1);
    });

    it('WHEN a gameEnded event with result DRAW is received SHOULD show GAME_OVER: DRAW, dim both players and every cell, and draw no winLine', async () => {
        const router = createMockRouter();
        // X O X
        // X O O
        // O X _
        const almostFullBoard = {0: 'X', 1: 'O', 2: 'X', 3: 'X', 4: 'O', 5: 'O', 6: 'O', 7: 'X'} as const;
        const gameAPI = createMockGameAPI({
            getGame: vi.fn(async () => new SuccessResponse(buildGame({
                cells: buildCells(almostFullBoard),
                activePlayerId: X_PLAYER.id,
            }))),
        });
        const userSession = createMockUserSession(O_USER_ID);
        const {gameEventsSocket, getHandlers} = createMockGameEventsSocket();

        renderGamePage(gameAPI, router, userSession, gameEventsSocket);

        await waitFor(() => {
            expect(getGameStatus()).toHaveTextContent('> AWAITING_INPUT: NEO_7734');
        });

        getHandlers().onGameEnded?.(buildGame({
            cells: buildCells({...almostFullBoard, 8: 'X'}),
            status: GameStatusEnum.ENDED,
            result: GameResultEnum.DRAW,
            activePlayerId: X_PLAYER.id,
        }));

        await waitFor(() => {
            expect(getGameStatus()).toHaveTextContent('> GAME_OVER: DRAW');
        });
        expect(getGameStatus()).toHaveStyle({color: DESIGN_COLORS.warning});

        for (const index of [0, 1]) {
            expect(getPlayerName(index)).toHaveStyle({color: DESIGN_COLORS.drawPlayerName});
            expect(getPlayerMark(index)).toHaveStyle({color: DESIGN_COLORS.drawMark});
        }
        expect(getCells()).toHaveLength(9);
        for (const cell of getCells()) {
            expect(cell).toHaveStyle({color: DESIGN_COLORS.drawMark});
            expect(cell).toBeDisabled();
        }
        expect(queryWinLine()).not.toBeInTheDocument();
        expect(getLeaveGame()).toBeEnabled();
    });

    it('WHEN a gameEnded event with result PLAYER_LEFT_THE_GAME is received SHOULD show GAME_OVER: OPPONENT_DISCONNECTED, strike through the player who left and disable the board', async () => {
        const router = createMockRouter();
        const cells = buildCells({0: 'X', 4: 'X', 2: 'O'});
        const gameAPI = createMockGameAPI({
            getGame: vi.fn(async () => new SuccessResponse(buildGame({cells, activePlayerId: O_PLAYER.id}))),
        });
        const userSession = createMockUserSession(X_USER_ID);
        const {gameEventsSocket, getHandlers} = createMockGameEventsSocket();

        renderGamePage(gameAPI, router, userSession, gameEventsSocket);

        await waitFor(() => {
            expect(getGameStatus()).toHaveTextContent('> AWAITING_INPUT: CIPHER_88');
        });

        getHandlers().onGameEnded?.(buildGame({
            players: [X_PLAYER],
            cells,
            status: GameStatusEnum.ENDED,
            result: GameResultEnum.PLAYER_LEFT_THE_GAME,
            activePlayerId: undefined,
        }));

        await waitFor(() => {
            expect(getGameStatus()).toHaveTextContent('> GAME_OVER: OPPONENT_DISCONNECTED');
        });
        expect(getGameStatus()).toHaveStyle({color: DESIGN_COLORS.errorRed});

        expect(getPlayers()).toHaveLength(2);
        expect(getPlayerName(0)).toHaveTextContent(X_PLAYER.userName);
        expect(getPlayerName(0)).toHaveStyle({color: DESIGN_COLORS.drawPlayerName});
        expect(getPlayerMark(0)).toHaveStyle({color: DESIGN_COLORS.drawMark});
        expect(getPlayerName(1)).toHaveTextContent(O_PLAYER.userName);
        expect(getPlayerName(1)).toHaveStyle({color: DESIGN_COLORS.errorRed, textDecorationLine: 'line-through'});
        expect(getPlayerMark(1)).toHaveStyle({color: DESIGN_COLORS.leftPlayerMark});

        for (const cell of getCells()) {
            expect(cell).toBeDisabled();
        }
        expect(getLeaveGame()).toBeEnabled();
    });

    it('WHEN a gameDeleted event is received SHOULD navigate back to #/rooms', async () => {
        const router = createMockRouter();
        const gameAPI = createMockGameAPI({
            getGame: vi.fn(async () => new SuccessResponse(buildGame())),
        });
        const userSession = createMockUserSession(X_USER_ID);
        const {gameEventsSocket, getHandlers} = createMockGameEventsSocket();

        renderGamePage(gameAPI, router, userSession, gameEventsSocket);

        await waitFor(() => {
            expect(getGameStatus()).toBeInTheDocument();
        });

        getHandlers().onGameDeleted?.(DEFAULT_GAME_ID);

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/rooms');
        });
    });
});
