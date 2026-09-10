import {createContext, useContext, type ReactElement, type ReactNode} from "react";
import type {UserAPI} from "../../domain/shared/api/UserAPI.ts";

const UserAPIContext = createContext<UserAPI | null>(null);

export function UserAPIProvider({userAPI, children}: { userAPI: UserAPI, children: ReactNode }): ReactElement {
    return (
        <UserAPIContext.Provider value={userAPI}>
            {children}
        </UserAPIContext.Provider>
    );
}

export function useUserAPI(): UserAPI {
    const userAPI = useContext(UserAPIContext);
    if (!userAPI) {
        throw new Error("useUserAPI must be used within a UserAPIProvider");
    }
    return userAPI;
}
