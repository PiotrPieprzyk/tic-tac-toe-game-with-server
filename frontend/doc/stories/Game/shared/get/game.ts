// GamePage (data-testid="gamePage")
import {screen, within} from "@testing-library/react";

export function gamePage() {
    return within(screen.getByTestId('gamePage'));
}

// GamePage - players
export function getPlayers() {
    return gamePage().queryAllByTestId('player');
}

export function getPlayer(index: number = 0) {
    const player = getPlayers()[index];
    if (!player) {
        throw new Error(`player[${index}] not found (only ${getPlayers().length} rendered)`);
    }
    return within(player);
}

export function getPlayerName(index: number = 0) {
    return getPlayer(index).getByTestId('playerName');
}

export function getPlayerMark(index: number = 0) {
    return getPlayer(index).getByTestId('playerMark');
}

export function getGameStatus() {
    return gamePage().getByTestId('gameStatus');
}

// GamePage - board
export function getBoard() {
    return within(gamePage().getByTestId('board'));
}

export function getCells() {
    return getBoard().queryAllByTestId('cell');
}

export function getCell(position: number) {
    const cell = getCells()[position];
    if (!cell) {
        throw new Error(`cell[${position}] not found (only ${getCells().length} rendered)`);
    }
    return cell;
}

export function getWinLine() {
    return getBoard().getByTestId('winLine');
}

export function queryWinLine() {
    return getBoard().queryByTestId('winLine');
}

export function getLeaveGame() {
    return gamePage().getByTestId('leaveGame');
}

export function getErrorMessage() {
    return gamePage().getByTestId('errorMessage');
}