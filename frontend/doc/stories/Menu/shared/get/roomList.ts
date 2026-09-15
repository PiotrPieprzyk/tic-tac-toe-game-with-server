// RoomList (data-testid="roomList")
import {screen, within} from "@testing-library/react";

export function roomList() {
    return within(screen.getByTestId('roomList'));
}

export function getLoading() {
    return roomList().getByTestId('loading');
}

export function getNoActiveRoomsFound() {
    return roomList().getByTestId('noActiveRoomsFound');
}

export function getErrorMessage() {
    return roomList().getByTestId('errorMessage');
}

export function getPagination() {
    return within(roomList().getByTestId('pagination'));
}

export function getPrevPage() {
    return getPagination().getByTestId('prevPage');
}

export function getPageIndicator() {
    return getPagination().getByTestId('pageIndicator');
}

export function getNextPage() {
    return getPagination().getByTestId('nextPage');
}

export function getConnectionStatus() {
    return roomList().getByTestId('connectionStatus');
}

export function getCreateRoom() {
    return roomList().getByTestId('createRoom');
}

export function getReturnToRoom() {
    return roomList().getByTestId('returnToRoom');
}

export function getAlreadyInRoomMessage() {
    return roomList().getByTestId('alreadyInRoomMessage');
}

// RoomList - List item
export function getRoomListItems() {
    return roomList().queryAllByTestId('roomListItem');
}

export function getRoomListItem(index: number = 0) {
    return within(getRoomListItems()[index]);
}

export function getRoomName(index: number = 0) {
    return getRoomListItem(index).getByTestId('roomName');
}

export function getRoomStatus(index: number = 0) {
    return getRoomListItem(index).getByTestId('roomStatus');
}

export function getRoomPlayerCount(index: number = 0) {
    return getRoomListItem(index).getByTestId('roomPlayerCount');
}

export function getJoinRoom(index: number = 0) {
    return getRoomListItem(index).getByTestId('joinRoom');
}