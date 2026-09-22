## Player can see that the game is updated automatically.

### Status:

To do

### Description

Elements in #/games/{gameId}:

- data-testId="gamePage" < as wrapper, see [[player-can-see-game-details]]

The game page subscribes to that game's events websocket (see backend `player-can-mark-a-cell` and
`player-can-leave-the-game` stories) and updates without a manual refresh or page reload. Every event carries the full
game, and the page never re-fetches the game as a side effect of an event:

- gameLastTurn — the board and the active player update in place.
- gameEnded — the board, players and gameStatus update according to the game's result:
    - WIN: gameStatus "> GAME_OVER: {winnerName}_WINS" in accent green with a glow. The winner's name and mark are
      accent green, the loser's name and mark are muted. The three winning cells are accent green, the other cells
      are dimmed, and the winLine is drawn over the board.
    - DRAW: gameStatus "> GAME_OVER: DRAW" in warning color. Both players and every cell use the same dimmed color.
      No winLine.
    - PLAYER_LEFT_THE_GAME: gameStatus "> GAME_OVER: OPPONENT_DISCONNECTED" in error red. The event no longer lists the
      player who left, so the page keeps showing that player's slot from the previously known players, with the name
      struck through in error red and a dimmed mark. The remaining player is dimmed like in a draw.
    - Once the game has ended no cell can be marked, and leaveGame stays enabled.
- gameDeleted — the game no longer exists, the user is redirected to #/rooms.

### Tests

Test cycle prerequisites:

- Mock Router
- Render GamePage at #/games/{gameId}
- Mock WebSocket connection

#### WHEN a gameLastTurn event is received SHOULD show the newly marked cell and switch the AWAITING_INPUT status and the highlighted player to the next player without refetching the game

Prerequisites:

- Mock API GET /games/{gameId} — return an IN_PROGRESS game with no cells marked and NEO_7734 (X) as the active player
- Current user is CIPHER_88 (O)
- Emit gameLastTurn event with X marked at position 4 and CIPHER_88 as the active player

#### WHEN a gameEnded event with result WIN is received SHOULD show GAME_OVER with the winner, highlight the winner and the winning cells, draw the winLine and disable the board

Prerequisites:

- Mock API GET /games/{gameId} — return an IN_PROGRESS game with X marked at 0 and 1, O marked at 3 and 4, and
  NEO_7734 (X) as the active player
- Current user is CIPHER_88 (O)
- Emit gameEnded event with X marked at 0, 1 and 2, O marked at 3 and 4, status ENDED, result WIN and NEO_7734 as winner

#### WHEN a gameEnded event with result DRAW is received SHOULD show GAME_OVER: DRAW, dim both players and every cell, and draw no winLine

Prerequisites:

- Mock API GET /games/{gameId} — return an IN_PROGRESS game with 8 cells marked without a winning combination
  (X O X / X O O / O X _) and NEO_7734 (X) as the active player
- Current user is CIPHER_88 (O)
- Emit gameEnded event with the last cell marked by X, status ENDED and result DRAW

#### WHEN a gameEnded event with result PLAYER_LEFT_THE_GAME is received SHOULD show GAME_OVER: OPPONENT_DISCONNECTED, strike through the player who left and disable the board

Prerequisites:

- Mock API GET /games/{gameId} — return an IN_PROGRESS game with two players and X marked at 0 and 4, O marked at 2
- Current user is NEO_7734 (X)
- Emit gameEnded event with status ENDED, result PLAYER_LEFT_THE_GAME, the same cells and only NEO_7734 in the players

#### WHEN a gameDeleted event is received SHOULD navigate back to #/rooms

Prerequisites:

- Mock API GET /games/{gameId} — return an IN_PROGRESS game
- Emit gameDeleted event for this game's id
