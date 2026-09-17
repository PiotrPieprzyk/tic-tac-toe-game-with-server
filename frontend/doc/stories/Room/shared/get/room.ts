// RoomPage (data-testid="roomPage")
import {screen, within} from "@testing-library/react";

export function roomPage() {
    return within(screen.getByTestId('roomPage'));
}

export function getRoomName() {
    return roomPage().getByTestId('roomName');
}

export function getRoomId() {
    return roomPage().getByTestId('roomId');
}

export function getRenameRoom() {
    return roomPage().getByTestId('renameRoom');
}

export function getRoomStatus() {
    return roomPage().getByTestId('roomStatus');
}

export function getStartGame() {
    return roomPage().getByTestId('startGame');
}

export function getWaitingForHostToStart() {
    return roomPage().getByTestId('waitingForHostToStart');
}

export function getEnterGame() {
    return roomPage().getByTestId('enterGame');
}

export function getDeleteRoom() {
    return roomPage().getByTestId('deleteRoom');
}

export function getLeaveRoom() {
    return roomPage().getByTestId('leaveRoom');
}

export function getErrorMessage() {
    return roomPage().getByTestId('errorMessage');
}

// RoomPage - player slots
export function getPlayerSlots() {
    return roomPage().queryAllByTestId('playerSlot');
}

export function getPlayerSlot(index: number = 0) {
    const slot = getPlayerSlots()[index];
    if (!slot) {
        throw new Error(`playerSlot[${index}] not found (only ${getPlayerSlots().length} rendered)`);
    }
    return within(slot);
}

export function getPlayerName(index: number = 0) {
    return getPlayerSlot(index).getByTestId('playerName');
}

export function getHostTag(index: number = 0) {
    return getPlayerSlot(index).getByTestId('hostTag');
}

export function getYouTag(index: number = 0) {
    return getPlayerSlot(index).getByTestId('youTag');
}

export function getRemovePlayer(index: number = 0) {
    return getPlayerSlot(index).getByTestId('removePlayer');
}

export function getEmptySlotMessage(index: number = 0) {
    return getPlayerSlot(index).getByTestId('emptySlotMessage');
}
