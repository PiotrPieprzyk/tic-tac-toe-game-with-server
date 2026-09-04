export interface Router {
    push(route: string): void;
    replace(route: string): void;
}