import {API} from "@/infra/api/API.ts";
import type {RoomEventsHandlers, RoomEventsSocket} from "@/domain/shared/service/RoomEventsSocket.ts";

const RECONNECT_DELAY_MS = 3000;

function buildWebsocketUrl(): string {
    return `${API.domain.replace(/^http/, 'ws')}/ws`;
}

export class SimpleRoomEventsSockets implements RoomEventsSocket {
    private socket: WebSocket | null = null;
    private readonly globalHandlers = new Set<RoomEventsHandlers>();
    private readonly roomHandlers = new Map<string, Set<RoomEventsHandlers>>();
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    subscribe(handlers: RoomEventsHandlers): () => void {
        this.globalHandlers.add(handlers);
        this.ensureConnected();
        if (this.isOpen()) {
            this.send({action: 'subscribeRooms'});
            handlers.onConnect?.();
        }
        return () => {
            this.globalHandlers.delete(handlers);
        };
    }

    subscribeToRoom(roomId: string, handlers: RoomEventsHandlers): () => void {
        let handlersForRoom = this.roomHandlers.get(roomId);
        if (!handlersForRoom) {
            handlersForRoom = new Set();
            this.roomHandlers.set(roomId, handlersForRoom);
        }
        handlersForRoom.add(handlers);
        this.ensureConnected();
        if (this.isOpen()) {
            this.send({action: 'subscribeRoom', roomId});
            handlers.onConnect?.();
        }
        return () => {
            const current = this.roomHandlers.get(roomId);
            if (!current) return;
            current.delete(handlers);
            if (current.size === 0) {
                this.roomHandlers.delete(roomId);
            }
        };
    }

    private isOpen(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

    private ensureConnected(): void {
        if (this.socket !== null && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }
        const socket = new WebSocket(buildWebsocketUrl());
        socket.onopen = () => this.handleOpen();
        socket.onclose = () => this.handleClose();
        socket.onerror = () => this.handleClose();
        socket.onmessage = (event) => this.handleMessage(event);
        this.socket = socket;
    }

    private handleOpen(): void {
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.globalHandlers.size > 0) {
            this.send({action: 'subscribeRooms'});
        }
        for (const roomId of this.roomHandlers.keys()) {
            this.send({action: 'subscribeRoom', roomId});
        }
        for (const handlers of this.globalHandlers) {
            handlers.onConnect?.();
        }
        for (const handlersForRoom of this.roomHandlers.values()) {
            for (const handlers of handlersForRoom) {
                handlers.onConnect?.();
            }
        }
    }

    private handleClose(): void {
        for (const handlers of this.globalHandlers) {
            handlers.onDisconnect?.();
        }
        for (const handlersForRoom of this.roomHandlers.values()) {
            for (const handlers of handlersForRoom) {
                handlers.onDisconnect?.();
            }
        }
        this.socket = null;
        if (this.reconnectTimer === null) {
            this.reconnectTimer = setTimeout(() => {
                this.reconnectTimer = null;
                if (this.globalHandlers.size > 0 || this.roomHandlers.size > 0) {
                    this.ensureConnected();
                }
            }, RECONNECT_DELAY_MS);
        }
    }

    private handleMessage(event: MessageEvent): void {
        let payload: {eventType: string, dto: unknown};
        try {
            payload = JSON.parse(event.data);
        } catch {
            return;
        }
        this.dispatch(payload.eventType, payload.dto);
    }

    private dispatch(eventType: string, dto: unknown): void {
        if (eventType === 'roomAdded') {
            const room = dto as Parameters<NonNullable<RoomEventsHandlers['onRoomAdded']>>[0];
            for (const handlers of this.globalHandlers) {
                handlers.onRoomAdded?.(room);
            }
            return;
        }
        if (eventType === 'roomEdited') {
            const room = dto as Parameters<NonNullable<RoomEventsHandlers['onRoomEdited']>>[0];
            for (const handlers of this.globalHandlers) {
                handlers.onRoomEdited?.(room);
            }
            const handlersForRoom = this.roomHandlers.get(room.id);
            if (handlersForRoom) {
                for (const handlers of handlersForRoom) {
                    handlers.onRoomEdited?.(room);
                }
            }
            return;
        }
        if (eventType === 'roomDeleted') {
            const {id} = dto as {id: string};
            for (const handlers of this.globalHandlers) {
                handlers.onRoomDeleted?.(id);
            }
            const handlersForRoom = this.roomHandlers.get(id);
            if (handlersForRoom) {
                for (const handlers of handlersForRoom) {
                    handlers.onRoomDeleted?.(id);
                }
            }
        }
    }

    private send(payload: Record<string, unknown>): void {
        this.socket?.send(JSON.stringify(payload));
    }
}
