## Player can leave the game.

### Status:

To do

### Description

Elements in #/games/{gameId}:

- data-testId="gamePage" < as wrapper, see [[player-can-see-game-details]]
    - data-testId="leaveGame" — shown to both players in every state of the game (in progress and ended)
    - data-testId="errorMessage"

Clicking leaveGame leaves the game for the current user (see backend `player-can-leave-the-game` story). On success the
user is redirected to the game's room, #/rooms/{roomId} (leaving a game does not remove the player from the room). On
failure an errorMessage is shown and the player stays on the game page. Per the design, leaving has no loading state.

The other player (if any) is told through the gameEnded / gameDeleted events, see
[[player-can-see-that-game-is-updated-automatically]].

### Tests

Test cycle prerequisites:

- Mock Router
- Render GamePage at #/games/{gameId}
- Mock WebSocket connection
- Current user is NEO_7734 (X)
- Mock API GET /games/{gameId} — return an IN_PROGRESS game with two players belonging to room {roomId}

#### WHEN the player clicks leaveGame SHOULD leave the game and navigate to the game's room

Prerequisites:

- Mock API leave game — succeed

#### WHEN leaving the game fails SHOULD show an error message and keep the player on the game page

Prerequisites:

- Mock API leave game — return an error
