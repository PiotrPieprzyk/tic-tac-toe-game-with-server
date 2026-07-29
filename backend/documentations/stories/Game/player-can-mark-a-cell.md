## Player can mark a cell

### Status:

To do

### Description

A player can mark an empty cell with their mark (X or O) when it is their turn. Marking a cell that completes a winning combination or fills the board ends the game. The endpoint only acknowledges the request — clients rely on the game's WebSocket events (GameLastTurnEvent, GameEndedEvent) as the source of truth for the resulting game state while a game is in progress. GET /games/:id is only used when a client enters/reloads the game.

### Tests

Test cycle prerequisites:
- create two users
- host creates a room, second user joins
- host starts a game (2 players in the room)
- Client is connected to the WebSocket and subscribed to the game's events

#### WHEN the active player marks an empty cell SHOULD return 200 and broadcast a GameLastTurnEvent with the updated cells and the next active player's id

Prerequisites:
- Game in progress
- No cells marked yet

#### WHEN a player marks a cell when it is not their turn SHOULD return 400

Prerequisites:
- Game in progress
- It is the other player's turn

#### WHEN a player tries to mark an already marked cell SHOULD return 400

Prerequisites:
- Game in progress
- One cell already marked

#### WHEN a mark completes a winning combination SHOULD return 200 and broadcast a GameEndedEvent with result WIN and the winner's id

Prerequisites:
- Game in progress
- Two of the three cells in a row/column/diagonal already marked by the same player

#### WHEN the last empty cell is marked without completing a winning combination SHOULD return 200 and broadcast a GameEndedEvent with result DRAW

Prerequisites:
- Game in progress
- 8 cells marked, no winning combination present

#### WHEN a player tries to mark a cell after the game has ended SHOULD return 400

Prerequisites:
- Game already ended

#### WHEN a user who is not a player of the game tries to mark a cell SHOULD return 400

Prerequisites:
- Game in progress
- A third user not part of the game

#### WHEN game does not exist SHOULD return 404

Prerequisites:
- None

### Required API

- PUT /games/:id/mark

```typescript
// Request body
type MarkCellRequest = {
  position: number; // 0-8
};

// Response body — 200 (no game state, see WebSocket events below)
type MarkCellResponse = {};
```

- WebSocket /ws — subscribe to a game's events

```typescript
// Event: a cell was marked, game continues
type GameLastTurnEvent = {
  eventType: 'gameLastTurn';
  dto: {
    id: string;
    cells: { position: number; mark: string }[];
    activePlayerId: string;
  };
};

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
```
