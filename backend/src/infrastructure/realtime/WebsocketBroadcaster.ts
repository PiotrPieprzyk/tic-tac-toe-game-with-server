import WebSocket from "ws";
import {EventBroadcaster} from "@/application/shared/EventBroadcaster";

let broadcaster: WebsocketBroadcaster;

export class WebsocketBroadcaster implements EventBroadcaster {
    private gameSubscriptions: Map<string, Set<WebSocket>> = new Map();
    private roomSubscriptions: Set<WebSocket> = new Set();
    private socketGameId: Map<WebSocket, string> = new Map();
    private roomIdSubscriptions: Map<string, Set<WebSocket>> = new Map();
    private socketRoomId: Map<WebSocket, string> = new Map();

    private constructor() {}

    static create(): WebsocketBroadcaster {
        if (!broadcaster) {
            broadcaster = new WebsocketBroadcaster();
        }
        return broadcaster;
    }

    subscribeToGame(ws: WebSocket, gameId: string): void {
        if (!this.gameSubscriptions.has(gameId)) {
            this.gameSubscriptions.set(gameId, new Set());
        }
        this.gameSubscriptions.get(gameId)!.add(ws);
        this.socketGameId.set(ws, gameId);
    }

    subscribeToRooms(ws: WebSocket): void {
        this.roomSubscriptions.add(ws);
    }

    subscribeToRoom(ws: WebSocket, roomId: string): void {
        const previousRoomId = this.socketRoomId.get(ws);
        if (previousRoomId && previousRoomId !== roomId) {
            this.roomIdSubscriptions.get(previousRoomId)?.delete(ws);
        }
        if (!this.roomIdSubscriptions.has(roomId)) {
            this.roomIdSubscriptions.set(roomId, new Set());
        }
        this.roomIdSubscriptions.get(roomId)!.add(ws);
        this.socketRoomId.set(ws, roomId);
    }

    unsubscribe(ws: WebSocket): void {
        this.roomSubscriptions.delete(ws);

        const gameId = this.socketGameId.get(ws);
        if (gameId) {
            this.gameSubscriptions.get(gameId)?.delete(ws);
            this.socketGameId.delete(ws);
        }

        const roomId = this.socketRoomId.get(ws);
        if (roomId) {
            this.roomIdSubscriptions.get(roomId)?.delete(ws);
            this.socketRoomId.delete(ws);
        }
    }

    broadcastToGame(gameId: string, eventType: string, dto: unknown): void {
        const sockets = this.gameSubscriptions.get(gameId);
        if (!sockets) {
            return;
        }

        this.send(sockets, eventType, dto);
    }

    broadcastToRooms(eventType: string, dto: unknown): void {
        this.send(this.roomSubscriptions, eventType, dto);

        const roomId = (dto as { id?: string })?.id;
        const roomSockets = roomId ? this.roomIdSubscriptions.get(roomId) : undefined;
        if (roomSockets) {
            this.send(roomSockets, eventType, dto);
        }
    }

    private send(sockets: Set<WebSocket>, eventType: string, dto: unknown): void {
        const payload = JSON.stringify({eventType, dto});

        sockets.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(payload);
            }
        });
    }
}
