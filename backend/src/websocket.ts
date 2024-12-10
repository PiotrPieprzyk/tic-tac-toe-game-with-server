import {Server} from "ws";
import {IncomingMessage, ServerResponse} from "node:http";
import * as http from "node:http";

export class WebsocketServer {
    private wss: Server;

    constructor(server: http.Server<typeof IncomingMessage, typeof ServerResponse>) {
        this.wss = new Server({noServer: true, path: '/ws'});

        this.wss.on('connection', (ws) => {
            console.log('New WebSocket connection established');

            ws.on('message', (message) => {
                console.log(`Received message: ${message}`);
                ws.send(`Server received: ${message}`);
            });

            ws.on('close', () => {
                console.log('WebSocket connection closed');
            });
        });

        server.on('upgrade', (request, socket, head) => {
            this.wss.handleUpgrade(request, socket, head, (websocket) => {
                this.wss.emit('connection', websocket, request);
            });
        });
    }
}
