// UserForm (data-testid="userForm")
import {screen, within} from "@testing-library/react";

export function userForm() {
    return within(screen.getByTestId('userForm'));
}

export function getUserNameTextField() {
    return within(userForm().getByTestId('userNameTextField'));
}

export function getUserNameInput() {
    return getUserNameTextField().getByTestId('input');
}

export function getUserNameErrorMessage() {
    return getUserNameTextField().getByTestId('errorMessage');
}

export function getConnect() {
    return userForm().getByTestId('connect');
}