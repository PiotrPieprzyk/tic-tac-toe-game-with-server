import {createContext, useContext, type ReactElement, type ReactNode} from "react";
import type {UserId} from "../../domain/User/UserId.ts";

const UserSessionContext = createContext<UserId | null>(null);

export function UserSessionProvider({userId, children}: { userId: UserId, children: ReactNode }): ReactElement {
    return (
        <UserSessionContext.Provider value={userId}>
            {children}
        </UserSessionContext.Provider>
    );
}

export function useUserSession(): UserId {
    const userId = useContext(UserSessionContext);
    if (!userId) {
        throw new Error("useUserSession must be used within a UserSessionProvider");
    }
    return userId;
}
