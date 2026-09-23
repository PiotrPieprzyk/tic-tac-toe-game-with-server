## Player can see the game's details: players, marks, whose turn it is, and the board.

### Status:

To do

### Description

Elements in #/games/{gameId}:

- data-testId="gamePage" < as wrapper
    - data-testId="player" < repeated, in the order of the game's players (X first, then O)
        - data-testId="playerName"
        - data-testId="playerMark" — "X" or "O"
    - data-testId="gameStatus" — one of:
        - "> AWAITING_INPUT: {activePlayerName}" (game IN_PROGRESS)
        - "> GAME_OVER: {winnerName}_WINS" (result WIN)
        - "> GAME_OVER: DRAW" (result DRAW)
        - "> GAME_OVER: OPPONENT_DISCONNECTED" (result PLAYER_LEFT_THE_GAME)

      The ended variants are reachable either by fetching an already-ended game directly or through websocket
      events, see [[player-can-see-that-game-is-updated-automatically]].
    - data-testId="board"
        - data-testId="cell" < repeated 9 times, index = board position 0-8 (left-to-right, top-to-bottom). Shows
          "X", "O", or "_" when empty
        - data-testId="winLine" — only when the game ended with result WIN, see
          [[player-can-see-that-game-is-updated-automatically]]
    - data-testId="leaveGame" — see [[player-can-leave-the-game]]
    - data-testId="errorMessage" — see [[player-can-mark-a-cell]] and [[player-can-leave-the-game]]

Colors while the game is IN_PROGRESS:

- The active player's name and mark are accent green. The other player's name is the default text color and their
  mark is muted.
- gameStatus is accent green.
- On the board X is muted, O is accent green, and empty cells are very dim.

The game is fetched from GET /games/{gameId} on mount and the page subscribes to that game's events. The current user
is matched to a player through the player's `userId` (a player's `id` is what `activePlayerId` / `winnerId` refer to).
Ended games are kept server-side and are still returned by this endpoint (with their final `status`/`result`/`winnerId`),
so the GAME_OVER variants of `gameStatus` are also reachable by fetching a game directly, not only through websocket
events. If the fetch fails (e.g. the game doesn't exist, which the server reports as 404) the user is redirected to
#/rooms.

### Tests

Test cycle prerequisites:

- Mock Router
- Render GamePage at #/games/{gameId}
- Mock WebSocket connection

#### WHEN the game is IN_PROGRESS and it is the opponent's turn SHOULD show both players' names and marks with the active player highlighted, the AWAITING_INPUT status, the board with marked and empty cells, and an enabled LEAVE_GAME

Prerequisites:

- Mock API GET /games/{gameId} — return an IN_PROGRESS game with players NEO_7734 (X) and CIPHER_88 (O), X marked at
  positions 0 and 4, O marked at position 1, and CIPHER_88 as the active player
- Current user is NEO_7734

#### WHEN the game fails to load SHOULD redirect to #/rooms

Prerequisites:

- Mock API GET /games/{gameId} — return a 404 error
