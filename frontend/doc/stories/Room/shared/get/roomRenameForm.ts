// RoomRenameForm (data-testid="roomRenameForm")
import {screen, within} from "@testing-library/react";

export function roomRenameForm() {
    return within(screen.getByTestId('roomRenameForm'));
}

export function getRoomNameTextField() {
    return within(roomRenameForm().getByTestId('roomNameTextField'));
}

export function getRoomNameInput() {
    return getRoomNameTextField().getByTestId('input');
}

export function getRoomNameErrorMessage() {
    return getRoomNameTextField().getByTestId('errorMessage');
}

export function getSaveRename() {
    return roomRenameForm().getByTestId('saveRename');
}

export function getCancel() {
    return roomRenameForm().getByTestId('cancel');
}
