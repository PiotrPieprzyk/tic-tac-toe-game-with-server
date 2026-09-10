import {createContext, useContext, type ReactElement, type ReactNode} from "react";
import type {Router} from "../../domain/shared/service/Router.ts";

const RouterContext = createContext<Router | null>(null);

export function RouterProvider({router, children}: { router: Router, children: ReactNode }): ReactElement {
    return (
        <RouterContext.Provider value={router}>
            {children}
        </RouterContext.Provider>
    );
}

export function useRouter(): Router {
    const router = useContext(RouterContext);
    if (!router) {
        throw new Error("useRouter must be used within a RouterProvider");
    }
    return router;
}
