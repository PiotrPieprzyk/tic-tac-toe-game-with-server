import WebSocket from "ws";
import {EventBroadcaster} from "@/application/shared/EventBroadcaster";

let broadcaster: WebsocketBroadcaster;

export class WebsocketBroadcaster implements EventBroadcaster {
    private gameSubscriptions: Map<string, Set<WebSocket>> = new Map();
    private roomSubscriptions: Set<WebSocket> = new Set();
    private socketGameId: Map<WebSocket, string> = new Map();

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

    unsubscribe(ws: WebSocket): void {
        this.roomSubscriptions.delete(ws);

        const gameId = this.socketGameId.get(ws);
        if (gameId) {
            this.gameSubscriptions.get(gameId)?.delete(ws);
            this.socketGameId.delete(ws);
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
