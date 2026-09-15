// UserForm (data-testid="userForm")
import {screen, within} from "@testing-library/react";

export function userForm() {
    return within(screen.getByTestId('userForm'));
}

export function getUserNameTextField() {
    return userForm().getByTestId('userNameTextField');
}

export function getUserNameTextFieldBorder() {
    return within(getUserNameTextField()).getByTestId('inputBorder');
}

export function getUserNameInput() {
    return within(getUserNameTextField()).getByTestId('input');
}

export function getUserNameErrorMessage() {
    return within(getUserNameTextField()).getByTestId('errorMessage');
}

export function getConnect() {
    return userForm().getByTestId('connect');
}