import type {Router} from "../../domain/shared/service/Router.ts";

export class ReactRouter implements Router {
    push(route: string): void {
        window.location.hash = route;
    }

    replace(route: string): void {
        window.location.replace(route);
    }
}
