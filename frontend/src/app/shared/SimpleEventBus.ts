import type {EventBus} from "@/domain/shared/event/EventBus.ts";

export class SimpleEventBus<EventMapImpl extends Record<string, unknown[]>> implements EventBus<EventMapImpl> {
  private readonly listenerMap: { [K in keyof EventMapImpl]?: ((...args: EventMapImpl[K]) => void)[] } = {};

  on<K extends keyof EventMapImpl>(e: K, cb: (...args: EventMapImpl[K]) => void) {
    const listeners: ((...args: EventMapImpl[K]) => void)[] = (this.listenerMap[e] ??= []);
    listeners.push(cb);
  }

  emit<K extends keyof EventMapImpl>(e: K, ...a: EventMapImpl[K]) {
    const listeners: ((...args: EventMapImpl[K]) => void)[] = this.listenerMap[e] ?? [];
    listeners.forEach((cb) => cb(...a));
  }

  off<K extends keyof EventMapImpl>(e: K, cb: (...args: EventMapImpl[K]) => void) {
    const listeners: ((...args: EventMapImpl[K]) => void)[] = this.listenerMap[e] ?? [];
    const idx = listeners.indexOf(cb);
    if (idx !== -1) {
      listeners.splice(idx, 1);
    }
  }
}
