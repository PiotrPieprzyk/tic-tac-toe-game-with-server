## Host can start a game

### Status:

To do

### Description

The host of a room can start a game. A game can only be started if there are exactly 2 players in the room, and only if a game is not already in progress for that room.

### Tests

Test cycle prerequisites:
- create two users
- host creates a room

#### WHEN host starts a game with 2 players in the room SHOULD return 200 with the created game

Prerequisites:
- Created one room
- Two users joined

#### WHEN not-host tries to start a game SHOULD return 400

Prerequisites:
- Created one room
- Two users joined

#### WHEN host starts a game with only 1 player in the room SHOULD return 400

Prerequisites:
- Created one room
- Only host in the room

#### WHEN host tries to start a game that is already in progress SHOULD return 400

Prerequisites:
- Created one room
- Two users joined
- Game already started

#### WHEN room does not exist SHOULD return 404

Prerequisites:
- None

#### WHEN host start game again after the first one was finished SHOULD return 200

Prerequisites:
- Created one room
- Two users joined
- First game already finished (finished game should be automatically removed)


### Required API

- POST /games

```typescript
// Request body
// The acting user is identified by the UserId cookie, not a request body field.
type CreateGameRequest = {
  roomId: string;
};

// Response body — 200
type CreateGameResponse = {
  id: string;
  roomId: string;
  players: { id: string; mark: string }[];
  status: string;
  activePlayerId?: string;
  cells: { position: number; mark: string }[];
};
```
