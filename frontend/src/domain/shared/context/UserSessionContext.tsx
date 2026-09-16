import {createContext, useContext, type ReactElement, type ReactNode} from "react";
import {UserId} from "@/domain/User/UserId.ts";

export const ANONYMOUS_USER_ID = UserId.create();

const UserSessionContext = createContext<UserId>(ANONYMOUS_USER_ID);

export function UserSessionProvider({userId, children}: { userId: UserId, children: ReactNode }): ReactElement {
    return (
        <UserSessionContext.Provider value={userId}>
            {children}
        </UserSessionContext.Provider>
    );
}

export function useUserSession(): UserId {
    return useContext(UserSessionContext);
}
