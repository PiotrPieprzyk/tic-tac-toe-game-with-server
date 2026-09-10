import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {UserForm} from '../../../src/app/Menu/UserForm';
import type {Router} from '../../../src/domain/shared/service/Router';
import type {UserAPI, UserAPIAddRequest, UserAPIResponse} from '../../../src/domain/shared/api/UserAPI';
import {CommonError, SuccessResponse} from '../../../src/domain/shared/api/APICommon';
import {UserAPIProvider} from '../../../src/infra/api/UserAPIContext';
import {RouterProvider} from '../../../src/infra/service/RouterContext';
import {DESIGN_COLORS} from '../testUtils';

function createMockRouter(): Router {
    return {
        push: vi.fn(),
        replace: vi.fn(),
    };
}

function renderUserForm(userAPI: UserAPI, router: Router) {
    return render(
        createElement(
            RouterProvider,
            {router, children: createElement(
                UserAPIProvider,
                {userAPI, children: createElement(UserForm)}
            )}
        )
    );
}

function userForm() {
    return within(screen.getByTestId('userForm'));
}

function getUserNameTextField() {
    return within(userForm().getByTestId('userNameTextField'));
}

function getInput() {
    return getUserNameTextField().getByTestId('input');
}

function getErrorMessage() {
    return getUserNameTextField().getByTestId('errorMessage');
}

function getConnect() {
    return userForm().getByTestId('connect');
}

describe('User can choose a name', () => {
    it('WHEN UserForm is first rendered, connect button SHOULD show default "[ CONNECT ]" label styled grayed out and be disabled, and input SHOULD be focused with the accent color', () => {
        const router = createMockRouter();
        const userAPI: UserAPI = {addUser: vi.fn()};

        renderUserForm(userAPI, router);

        const input = getInput();
        const connect = getConnect();
        const userNameTextField = getUserNameTextField();

        expect(connect).toHaveTextContent('[ CONNECT ]');
        expect(connect).toHaveStyle({color: DESIGN_COLORS.dimmedText});
        expect(connect).toBeDisabled();

        expect(input).toHaveFocus();
        expect(userNameTextField).toHaveStyle({borderColor: DESIGN_COLORS.accentGreen});
    });

    it('WHEN user type userName "ValidName", connect button SHOULD be clickable and when clicked SHOULD show loading state for submit button until redirected to #/rooms', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        let resolveAddUser: (value: UserAPIResponse) => void = () => {};
        const userAPI: UserAPI = {
            addUser: vi.fn((_body: UserAPIAddRequest) => new Promise<UserAPIResponse>((resolve) => {
                resolveAddUser = resolve;
            })),
        };

        renderUserForm(userAPI, router);

        const input = getInput();
        const connect = getConnect();


        await user.type(input, 'ValidName');

        expect(connect).toBeEnabled();
        expect(connect).toHaveTextContent('[ CONNECT ]');
        expect(connect).toHaveStyle({color: DESIGN_COLORS.accentGreen, borderColor: DESIGN_COLORS.accentGreen});

        await user.click(connect);

        expect(connect).toHaveAttribute('aria-busy', 'true');
        expect(connect).toBeDisabled();
        expect(connect).toHaveTextContent(/CONNECTING/);
        expect(connect).toHaveStyle({color: DESIGN_COLORS.dimmedTextLoading});

        resolveAddUser(new SuccessResponse({id: '1', name: 'ValidName'}));

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('#/rooms');
        });
    });

    it('WHEN user type userName "TakenName" connect button SHOULD NOT be clickable and errorMessage should be visible', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const userAPI: UserAPI = {
            addUser: vi.fn(async (_body: UserAPIAddRequest) =>
                new CommonError('User name already taken', 400)
            ),
        };

        renderUserForm(userAPI, router);

        const input = getInput();
        const connect = getConnect();
        const userNameTextField = getUserNameTextField();

        await user.type(input, 'TakenName');
        await user.click(connect);

        await waitFor(() => {
            expect(getErrorMessage()).toBeVisible();
        });
        expect(getErrorMessage()).toHaveTextContent('ERR: PLAYER_NAME_TAKEN — TRY ANOTHER');
        expect(getErrorMessage()).toHaveStyle({color: DESIGN_COLORS.errorRed});
        expect(userNameTextField).toHaveStyle({borderColor: DESIGN_COLORS.errorRed});
        expect(connect).toBeDisabled();
        expect(connect).toHaveTextContent('[ CONNECT ]');
        expect(connect).toHaveStyle({color: DESIGN_COLORS.dimmedText});
    });

    it('WHEN user type userName "Sh" connect button SHOULD NOT be clickable and errorMessage should be visible', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const userAPI: UserAPI = {
            addUser: vi.fn(),
        };

        renderUserForm(userAPI, router);

        const input = getInput();
        const connect = getConnect();
        const userNameTextField = getUserNameTextField();

        await user.type(input, 'Sh');

        expect(getErrorMessage()).toBeVisible();
        expect(getErrorMessage()).toHaveTextContent('ERR: PLAYER_NAME_TOO_SHORT — (MIN 3 CHARS)');
        expect(getErrorMessage()).toHaveStyle({color: DESIGN_COLORS.errorRed});
        expect(userNameTextField).toHaveStyle({borderColor: DESIGN_COLORS.errorRed});
        expect(connect).toBeDisabled();
        expect(connect).toHaveTextContent('[ CONNECT ]');
        expect(connect).toHaveStyle({color: DESIGN_COLORS.dimmedText});
        expect(userAPI.addUser).not.toHaveBeenCalled();
    });
});
