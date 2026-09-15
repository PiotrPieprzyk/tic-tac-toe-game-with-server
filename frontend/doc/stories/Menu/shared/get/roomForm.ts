// RoomForm (data-testid="roomForm")
import {screen, within} from "@testing-library/react";

export function roomForm() {
    return within(screen.getByTestId('roomForm'));
}

export function getRoomNameTextField() {
    return within(roomForm().getByTestId('roomNameTextField'));
}

export function getRoomNameInput() {
    return getRoomNameTextField().getByTestId('input');
}

export function getRoomNameErrorMessage() {
    return getRoomNameTextField().getByTestId('errorMessage');
}

export function getCreateRoom() {
    return roomForm().getByTestId('createRoom');
}