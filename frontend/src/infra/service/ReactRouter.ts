import type {NavigateFunction} from "react-router";
import type {Router} from "@/domain/shared/service/Router.ts";

export class ReactRouter implements Router {
    private readonly navigate: NavigateFunction;

    constructor(navigate: NavigateFunction) {
        this.navigate = navigate;
    }

    push(route: string): void {
        this.navigate(ReactRouter.toPath(route));
    }

    replace(route: string): void {
        this.navigate(ReactRouter.toPath(route), {replace: true});
    }

    private static toPath(route: string): string {
        return route.startsWith('#') ? route.slice(1) : route;
    }
}