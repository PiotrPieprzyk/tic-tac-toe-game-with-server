## Player can see game details

### Status:

To do

### Description

A player can fetch a game and see the players' names and marks, whose turn it is, and the game result once the game has ended.

### Tests

Test cycle prerequisites:
- create two users
- host creates a room, second user joins
- host starts a game (2 players in the room)

#### WHEN fetching an in-progress game SHOULD return 200 with players' names and marks and the id of the player whose turn it is

Prerequisites:
- Game in progress
- No cells marked yet

#### WHEN fetching a game after a cell has been marked SHOULD return 200 with the updated cells and the next active player's id

Prerequisites:
- Game in progress
- One cell already marked

#### WHEN fetching a game that ended SHOULD return 404

Prerequisites:
- Game in ended

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
    players: { id: string; userName: string; mark: string }[];
    cells: { id: string; position: number; mark: string }[];
    status: string; // GameStatusEnum
    activePlayerId?: string;
    result?: string; // GameResultEnum
    winnerId?: string;
    roomId: string,
    updatedTimestamp: number,
};
```
