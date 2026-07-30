export interface EventBroadcaster {
    broadcastToGame(gameId: string, eventType: string, dto: unknown): void;
    broadcastToRooms(eventType: string, dto: unknown): void;
}
