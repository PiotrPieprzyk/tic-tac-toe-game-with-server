import WebSocket from 'ws';

export function waitForEvent(wsClient: WebSocket, eventType: string, timeoutMs = 3000): Promise<{eventType: string; dto: Record<string, unknown>}> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout waiting for event: ${eventType}`)), timeoutMs);
        wsClient.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.eventType === eventType) {
                clearTimeout(timer);
                resolve(message);
            }
        });
    });
}

export async function connectAndSubscribeGame(serverPort: number, gameId: string): Promise<WebSocket> {
    const client = new WebSocket(`ws://localhost:${serverPort}/ws`);
    await new Promise<void>((resolve, reject) => {
        client.on('open', resolve);
        client.on('error', reject);
    });
    client.send(JSON.stringify({action: 'subscribeGame', gameId}));
    return client;
}
