## Host can start a game once the room has 2 of 2 players.

### Status:

To do

### Description

Elements in #/rooms/{roomId}:

- data-testId="roomPage" < as wrapper
    - data-testId="startGame" — host only; enabled once 2 of 2 players and no game in progress
    - data-testId="renameRoom"
    - data-testId="playerSlot" < repeated
        - data-testId="removePlayer" — host only, on the filled non-host slot
    - data-testId="deleteRoom"
    - data-testId="errorMessage"

Clicking startGame creates a game for the room. While the request is in flight startGame shows a loading state and
renameRoom/removePlayer become disabled; deleteRoom stays enabled (matching the design: starting the game isn't a
reason to block leaving/deleting the room). On success the user is redirected to the game view. On failure an
errorMessage is shown and startGame is re-enabled.

### Tests

Test cycle prerequisites:

- Mock Router
- Render RoomPage at #/rooms/{roomId}
- Current user is the host
- Mock API GET /rooms/{roomId} — return a room with 2 of 2 players and status WAITING_FOR_PLAYERS

#### WHEN the host clicks startGame SHOULD show a loading state and disable renameRoom and removePlayer while deleteRoom stays enabled

Prerequisites:

- Mock API startGame — do not resolve before assertions

#### WHEN the game is created successfully SHOULD navigate to the game view for the created game

Prerequisites:

- Mock API startGame — return a created game

#### WHEN starting the game fails SHOULD show an error message and re-enable startGame

Prerequisites:

- Mock API startGame — return an error

#### WHEN the room's previous game has ended SHOULD keep startGame enabled so the host can start the next game

Prerequisites:

- Mock API GET /rooms/{roomId} — return a room with 2 of 2 players and status ENDED (previous game finished)
