import {Server} from "ws";
import {IncomingMessage, ServerResponse} from "node:http";
import * as http from "node:http";
import {WebsocketBroadcaster} from "@/infrastructure/realtime/WebsocketBroadcaster";

export class WebsocketServer {
    private wss: Server;

    constructor(server: http.Server<typeof IncomingMessage, typeof ServerResponse>) {
        this.wss = new Server({noServer: true, path: '/ws'});
        const broadcaster = WebsocketBroadcaster.create();

        this.wss.on('connection', (ws) => {
            ws.on('message', (message) => {
                try {
                    const parsed = JSON.parse(message.toString());

                    if (parsed.action === 'subscribeGame' && parsed.gameId) {
                        broadcaster.subscribeToGame(ws, parsed.gameId);
                    } else if (parsed.action === 'subscribeRooms') {
                        broadcaster.subscribeToRooms(ws);
                    }
                } catch {
                    // ignore malformed messages
                }
            });

            ws.on('close', () => {
                broadcaster.unsubscribe(ws);
            });
        });

        server.on('upgrade', (request, socket, head) => {
            this.wss.handleUpgrade(request, socket, head, (websocket) => {
                this.wss.emit('connection', websocket, request);
            });
        });
    }
}
