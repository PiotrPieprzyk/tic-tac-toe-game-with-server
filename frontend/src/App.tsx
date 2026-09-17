import {useMemo, type ReactElement} from "react";
import {Outlet, RouterProvider as DataRouterProvider, createHashRouter, useNavigate} from "react-router";
import {UserAPIProvider} from "@/domain/shared/context/UserAPIContext.tsx";
import {RoomAPIProvider} from "@/domain/shared/context/RoomAPIContext.tsx";
import {RouterProvider} from "@/domain/shared/context/RouterContext.tsx";
import {ANONYMOUS_USER_ID, UserSessionProvider} from "@/domain/shared/context/UserSessionContext.tsx";
import {SimpleUserAPI} from "@/infra/api/SimpleUserAPI.ts";
import {SimpleRoomAPI} from "@/infra/api/SimpleRoomAPI.ts";
import {ReactRouter} from "@/infra/service/ReactRouter.ts";
import {SimpleUserSession} from "@/infra/service/SimpleUserSession.ts";
import {UserForm} from "@/app/Menu/UserForm.tsx";
import {RoomForm} from "@/app/Menu/RoomForm.tsx";
import {MenuRoomList} from "@/app/Menu/RoomList/MenuRoomList";
import {RoomPage} from "@/app/Room/RoomPage";
import {RoomRenameForm} from "@/app/Room/RoomRenameForm.tsx";


function RootLayout(): ReactElement {
    const navigate = useNavigate();
    const router = useMemo(() => new ReactRouter(navigate), [navigate]);
    const userAPI = useMemo(() => new SimpleUserAPI(), []);
    const roomAPI = useMemo(() => new SimpleRoomAPI(), []);
    const userSession = useMemo(() => new SimpleUserSession(ANONYMOUS_USER_ID), []);

    return (
        <RouterProvider router={router}>
            <UserAPIProvider userAPI={userAPI}>
                <RoomAPIProvider roomAPI={roomAPI}>
                    <UserSessionProvider userSession={userSession}>
                        <div className="flex min-h-screen items-center justify-center px-4 py-10">
                            <Outlet/>
                        </div>
                    </UserSessionProvider>
                </RoomAPIProvider>
            </UserAPIProvider>
        </RouterProvider>
    );
}

const dataRouter = createHashRouter([
    {
        path: "/",
        element: <RootLayout/>,
        children: [
            {index: true, element: <UserForm/>},
            {path: "rooms", element: <MenuRoomList/>},
            {path: "rooms/create", element: <RoomForm/>},
            {path: "rooms/:roomId", element: <RoomPage/>},
            {path: "rooms/:roomId/rename", element: <RoomRenameForm/>},
        ],
    },
]);

function App() {
    return <DataRouterProvider router={dataRouter}/>;
}

export default App
