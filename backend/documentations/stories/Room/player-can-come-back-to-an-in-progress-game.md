## If game is in progress, but player goes to a different page, they can come back to the game

### Status:

To do

### Description

If a player navigates away from an in-progress game and returns, they can rejoin it. Only players who were already added to the game can come back to it — a new player cannot join an in-progress game this way.

### Tests

Test cycle prerequisites:
- create two users
- host creates a room
- two users join room
- host starts a game

#### WHEN an already-added player fetches the in-progress game SHOULD return 200 with the current game state

Prerequisites:
- Game in progress

#### WHEN a user who is not a player in the game tries to fetch it SHOULD return 400

Prerequisites:
- Game in progress

#### WHEN game does not exist SHOULD return 404

Prerequisites:
- None

### Required API

- GET /games/:id


```typescript
// Response body — 200
type GameResponse = {
  id: string;
  roomId: string;
  players: { id: string; mark: string }[];
  status: string;
  activePlayerId?: string;
  cells: { position: number; mark: string }[];
};
```
