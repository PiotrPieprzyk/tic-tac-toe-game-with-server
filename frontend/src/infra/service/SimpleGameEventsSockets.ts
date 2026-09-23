import {API} from "@/infra/api/API.ts";
import type {GameEventsHandlers, GameEventsSocket} from "@/domain/shared/service/GameEventsSocket.ts";

const RECONNECT_DELAY_MS = 3000;

function buildWebsocketUrl(): string {
    return `${API.domain.replace(/^http/, 'ws')}/ws`;
}

export class SimpleGameEventsSockets implements GameEventsSocket {
    private socket: WebSocket | null = null;
    private readonly gameHandlers = new Map<string, Set<GameEventsHandlers>>();
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    subscribeToGame(gameId: string, handlers: GameEventsHandlers): () => void {
        let handlersForGame = this.gameHandlers.get(gameId);
        if (!handlersForGame) {
            handlersForGame = new Set();
            this.gameHandlers.set(gameId, handlersForGame);
        }
        handlersForGame.add(handlers);
        this.ensureConnected();
        if (this.isOpen()) {
            this.send({action: 'subscribeGame', gameId});
            handlers.onConnect?.();
        }
        return () => {
            const current = this.gameHandlers.get(gameId);
            if (!current) return;
            current.delete(handlers);
            if (current.size === 0) {
                this.gameHandlers.delete(gameId);
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
        for (const gameId of this.gameHandlers.keys()) {
            this.send({action: 'subscribeGame', gameId});
        }
        for (const handlersForGame of this.gameHandlers.values()) {
            for (const handlers of handlersForGame) {
                handlers.onConnect?.();
            }
        }
    }

    private handleClose(): void {
        for (const handlersForGame of this.gameHandlers.values()) {
            for (const handlers of handlersForGame) {
                handlers.onDisconnect?.();
            }
        }
        this.socket = null;
        if (this.reconnectTimer === null) {
            this.reconnectTimer = setTimeout(() => {
                this.reconnectTimer = null;
                if (this.gameHandlers.size > 0) {
                    this.ensureConnected();
                }
            }, RECONNECT_DELAY_MS);
        }
    }

    private handleMessage(event: MessageEvent): void {
        let payload: { eventType: string, dto: unknown };
        try {
            payload = JSON.parse(event.data);
        } catch {
            return;
        }
        this.dispatch(payload.eventType, payload.dto);
    }

    private dispatch(eventType: string, dto: unknown): void {
        if (eventType === 'gameLastTurn') {
            const game = dto as Parameters<NonNullable<GameEventsHandlers['onGameLastTurn']>>[0];
            const handlersForGame = this.gameHandlers.get(game.id);
            if (handlersForGame) {
                for (const handlers of handlersForGame) {
                    handlers.onGameLastTurn?.(game);
                }
            }
            return;
        }
        if (eventType === 'gameEnded') {
            const game = dto as Parameters<NonNullable<GameEventsHandlers['onGameEnded']>>[0];
            const handlersForGame = this.gameHandlers.get(game.id);
            if (handlersForGame) {
                for (const handlers of handlersForGame) {
                    handlers.onGameEnded?.(game);
                }
            }
            return;
        }
        if (eventType === 'gameDeleted') {
            const {id} = dto as { id: string };
            const handlersForGame = this.gameHandlers.get(id);
            if (handlersForGame) {
                for (const handlers of handlersForGame) {
                    handlers.onGameDeleted?.(id);
                }
            }
        }
    }

    private send(payload: Record<string, unknown>): void {
        this.socket?.send(JSON.stringify(payload));
    }
}
