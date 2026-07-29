## Player can leave the game

### Status:

To do

### Description

A player can leave a game they are part of. The game is automatically deleted when the last player leaves. If a player leaves while the other player remains, the game ends with result PLAYER_LEFT_THE_GAME. Clients rely on the game's WebSocket events (GameEndedEvent, GameDeletedEvent) as the source of truth; GET /games/:id is only used when a client enters/reloads the game.

### Tests

Test cycle prerequisites:
- create two users
- host creates a room, second user joins
- host starts a game (2 players in the room)
- Client is connected to the WebSocket and subscribed to the game's events

#### WHEN a player leaves a game with the other player remaining SHOULD return 200 and broadcast a GameEndedEvent with result PLAYER_LEFT_THE_GAME

Prerequisites:
- Game in progress
- Two players in the game

#### WHEN the last player leaves a game SHOULD return 200 and broadcast a GameDeletedEvent (game is auto-deleted)

Prerequisites:
- Game in progress
- Only one player remaining in the game

#### WHEN a user who is not a player of the game tries to leave SHOULD return 400

Prerequisites:
- Game in progress
- A third user not part of the game

#### WHEN game does not exist SHOULD return 404

Prerequisites:
- None

### Required API

- PUT /games/leave

```typescript
// Request body
type LeaveGameRequest = {
  gameId: string;
};

// Response body — 200 (no game state, see WebSocket events below)
type LeaveGameResponse = {};
```

- WebSocket /ws — subscribe to a game's events

```typescript
// Event: the game ended
type GameEndedEvent = {
  eventType: 'gameEnded';
  dto: {
    id: string;
    status: string; // GameStatusEnum.ENDED
    result: string; // GameResultEnum
    winnerId?: string;
  };
};

// Event: the game was deleted
type GameDeletedEvent = {
  eventType: 'gameDeleted';
  dto: {
    id: string;
  };
};
```
