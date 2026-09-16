import {createContext, useContext, useSyncExternalStore, type ReactElement, type ReactNode} from "react";
import type {UserSession} from "@/domain/shared/service/UserSession.ts";
import {UserId} from "@/domain/User/UserId.ts";

export const ANONYMOUS_USER_ID = UserId.create();

const noopUserSession: UserSession = {
    userId: ANONYMOUS_USER_ID,
    setUserId: () => {},
    subscribe: () => () => {},
};

const UserSessionContext = createContext<UserSession>(noopUserSession);

export function UserSessionProvider({userSession, children}: { userSession: UserSession, children: ReactNode }): ReactElement {
    return (
        <UserSessionContext.Provider value={userSession}>
            {children}
        </UserSessionContext.Provider>
    );
}

export function useUserSession(): UserId {
    const userSession = useContext(UserSessionContext);
    return useSyncExternalStore(
        (onStoreChange) => userSession.subscribe(onStoreChange),
        () => userSession.userId
    );
}

export function useSetUserSession(): (userId: UserId) => void {
    const userSession = useContext(UserSessionContext);
    return (userId) => userSession.setUserId(userId);
}