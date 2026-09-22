## Player can mark a cell.

### Status:

To do

### Description

Elements in #/games/{gameId}:

- data-testId="gamePage" < as wrapper, see [[player-can-see-game-details]]
    - data-testId="board"
        - data-testId="cell" < repeated 9 times. A button that is enabled only while the game is IN_PROGRESS, it is the
          current user's turn, and the cell is empty
    - data-testId="errorMessage"

Clicking an enabled cell optimistically marks that cell with the current user's mark and switches the active player
to the opponent right away, then sends the mark request for that position (see backend `player-can-mark-a-cell`
story). The request only acknowledges the move: the response itself does not change the board or the active player.
The websocket event (gameLastTurn / gameEnded, see [[player-can-see-that-game-is-updated-automatically]]) remains the
source of truth and reconciles the board and active player once it arrives.
On failure the optimistic mark and turn switch are reverted, an errorMessage is shown and the cell becomes available
again.

### Tests

Test cycle prerequisites:

- Mock Router
- Render GamePage at #/games/{gameId}
- Mock WebSocket connection
- Mock API GET /games/{gameId} — return an IN_PROGRESS game with X marked at position 0 and O marked at position 4

#### WHEN it is the current user's turn SHOULD enable the empty cells and disable the already marked ones

Prerequisites:

- Current user is NEO_7734 (X), who is the active player

#### WHEN it is the opponent's turn SHOULD disable every cell and not send a mark request when one is clicked

Prerequisites:

- Current user is CIPHER_88 (O), NEO_7734 is the active player
- Mock API PUT /games/{gameId}/mark — succeed

#### WHEN the active player clicks an empty cell SHOULD immediately mark it and switch the turn to the opponent, then send the mark request for that position

Prerequisites:

- Current user is NEO_7734 (X), who is the active player
- Mock API PUT /games/{gameId}/mark — succeed with an empty response
- Emit gameLastTurn event with X also marked at the clicked position and CIPHER_88 as the active player, matching the
  optimistic state

#### WHEN marking the cell fails SHOULD show an error message and revert the optimistic mark and turn switch

Prerequisites:

- Current user is NEO_7734 (X), who is the active player
- Mock API PUT /games/{gameId}/mark — return an error
