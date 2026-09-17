export interface EventBus<EventMap extends Record<string, unknown[]>> {
    on<K extends keyof EventMap>(e: K, cb: (...args: EventMap[K]) => void): void;
    off<K extends keyof EventMap>(e: K, cb: (...args: EventMap[K]) => void): void;
    emit<K extends keyof EventMap>(e: K, ...args: EventMap[K]): void;
}

