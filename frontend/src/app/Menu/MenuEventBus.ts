import type {MenuEvent} from "@/domain/Menu/context/MenuEvent.tsx";
import {SimpleEventBus} from "@/app/shared/SimpleEventBus.ts";
import type {EventBus} from "@/domain/shared/event/EventBus.ts";

const menuEventBus = new SimpleEventBus<MenuEvent>();

export const useMenuEventBus = (): EventBus<MenuEvent> => {
    return menuEventBus;
}
