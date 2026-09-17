import {createElement} from 'react';
import {render} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router';
import {RoomPage} from '@/app/Room/RoomPage';
import {RoomRenameForm} from '@/app/Room/RoomRenameForm';
import type {Router} from '@/domain/shared/service/Router';
import type {RoomAPI} from '@/domain/shared/api/RoomAPI';
import type {RoomEventsSocket} from '@/domain/shared/service/RoomEventsSocket';
import type {UserSession} from '@/domain/shared/service/UserSession';
import {RoomAPIProvider} from '@/domain/shared/context/RoomAPIContext';
import {RouterProvider} from '@/domain/shared/context/RouterContext';
import {UserSessionProvider} from '@/domain/shared/context/UserSessionContext';
import {RoomEventsSocketProvider} from '@/domain/shared/context/RoomEventsSocketContext';
import {DEFAULT_ROOM_ID} from '@doc/stories/Room/shared/builders';

export function renderRoomPage(
    roomAPI: RoomAPI,
    router: Router,
    userSession: UserSession,
    roomEventsSocket: RoomEventsSocket,
    roomId: string = DEFAULT_ROOM_ID,
) {
    return render(
        createElement(
            MemoryRouter,
            {initialEntries: [`/rooms/${roomId}`], children: createElement(
                Routes, {}, createElement(Route, {path: '/rooms/:roomId', element: createElement(
                    RouterProvider,
                    {router, children: createElement(
                        UserSessionProvider,
                        {userSession, children: createElement(
                            RoomAPIProvider,
                            {roomAPI, children: createElement(
                                RoomEventsSocketProvider,
                                {roomEventsSocket, children: createElement(RoomPage)}
                            )}
                        )}
                    )}
                )})
            )}
        )
    );
}

export function renderRoomRenameForm(
    roomAPI: RoomAPI,
    router: Router,
    userSession: UserSession,
    roomId: string = DEFAULT_ROOM_ID,
) {
    return render(
        createElement(
            MemoryRouter,
            {initialEntries: [`/rooms/${roomId}/rename`], children: createElement(
                Routes, {}, createElement(Route, {path: '/rooms/:roomId/rename', element: createElement(
                    RouterProvider,
                    {router, children: createElement(
                        UserSessionProvider,
                        {userSession, children: createElement(
                            RoomAPIProvider,
                            {roomAPI, children: createElement(RoomRenameForm)}
                        )}
                    )}
                )})
            )}
        )
    );
}
