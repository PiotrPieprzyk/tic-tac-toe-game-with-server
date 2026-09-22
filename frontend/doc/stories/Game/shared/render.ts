import {createElement} from 'react';
import {render} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router';
import {GamePage} from '@/app/Game/GamePage';
import type {Router} from '@/domain/shared/service/Router';
import type {GameAPI} from '@/domain/shared/api/GameAPI';
import type {GameEventsSocket} from '@/domain/shared/service/GameEventsSocket';
import type {UserSession} from '@/domain/shared/service/UserSession';
import {GameAPIProvider} from '@/domain/shared/context/GameAPIContext';
import {GameEventsSocketProvider} from '@/domain/shared/context/GameEventsSocketContext';
import {RouterProvider} from '@/domain/shared/context/RouterContext';
import {UserSessionProvider} from '@/domain/shared/context/UserSessionContext';
import {DEFAULT_GAME_ID} from '@doc/stories/Game/shared/builders';

export function renderGamePage(
    gameAPI: GameAPI,
    router: Router,
    userSession: UserSession,
    gameEventsSocket: GameEventsSocket,
    gameId: string = DEFAULT_GAME_ID,
) {
    return render(
        createElement(
            MemoryRouter,
            {initialEntries: [`/games/${gameId}`], children: createElement(
                Routes, {}, createElement(Route, {path: '/games/:gameId', element: createElement(
                    RouterProvider,
                    {router, children: createElement(
                        UserSessionProvider,
                        {userSession, children: createElement(
                            GameAPIProvider,
                            {gameAPI, children: createElement(
                                GameEventsSocketProvider,
                                {gameEventsSocket, children: createElement(GamePage)}
                            )}
                        )}
                    )}
                )})
            )}
        )
    );
}