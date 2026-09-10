import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {UserForm} from '../../../src/app/Menu/UserForm';
import type {Router} from '../../../src/domain/shared/service/Router';
import type {UserAPI, UserAPIAddRequest, UserAPIResponse} from '../../../src/domain/shared/api/UserAPI';
import {CommonError, SuccessResponse} from '../../../src/domain/shared/api/APICommon';
import {UserAPIProvider} from '../../../src/infra/api/UserAPIContext';
import {RouterProvider} from '../../../src/infra/service/RouterContext';

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

describe('User can choose a name', () => {
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

        const input = screen.getByTestId('input');
        const connect = screen.getByTestId('connect');

        await user.type(input, 'ValidName');

        expect(connect).toBeEnabled();

        await user.click(connect);

        expect(connect).toHaveAttribute('aria-busy', 'true');

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

        const input = screen.getByTestId('input');
        const connect = screen.getByTestId('connect');

        await user.type(input, 'TakenName');
        await user.click(connect);

        await waitFor(() => {
            expect(screen.getByTestId('errorMessage')).toBeVisible();
        });
        expect(screen.getByTestId('errorMessage')).toHaveTextContent('ERR: PLAYER_NAME_TAKEN — TRY ANOTHER');
        expect(connect).toBeDisabled();
    });

    it('WHEN user type userName "Sh" connect button SHOULD NOT be clickable and errorMessage should be visible', async () => {
        const user = userEvent.setup();
        const router = createMockRouter();
        const userAPI: UserAPI = {
            addUser: vi.fn(),
        };

        renderUserForm(userAPI, router);

        const input = screen.getByTestId('input');
        const connect = screen.getByTestId('connect');

        await user.type(input, 'Sh');

        expect(screen.getByTestId('errorMessage')).toBeVisible();
        expect(screen.getByTestId('errorMessage')).toHaveTextContent('ERR: PLAYER_NAME_TOO_SHORT — (MIN 3 CHARS)');
        expect(connect).toBeDisabled();
        expect(userAPI.addUser).not.toHaveBeenCalled();
    });
});
