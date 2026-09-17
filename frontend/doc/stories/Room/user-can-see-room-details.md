## User can see the room's details: its name, id, players, and status.

### Status:

To do

### Description

Elements in #/rooms/{roomId}:

- data-testId="roomPage" < as wrapper
    - data-testId="roomName"
    - data-testId="roomId" — e.g. "ID: #room-1"
    - data-testId="renameRoom" — host only
    - data-testId="roomStatus" — one of:
        - "STATUS: WAITING_FOR_PLAYERS" (1 of 2 players)
        - "STATUS: READY — 2/2 PLAYERS" (2 of 2 players, game not started)
        - "STATUS: GAME_IN_PROGRESS" (room's status is IN_PROGRESS)
    - data-testId="playerSlot" < repeated, host slot first then the second slot
        - data-testId="playerName"
        - data-testId="hostTag" — on the host's slot only
        - data-testId="youTag" — on the current (non-host) user's own slot only; the host's own slot is
          identified by hostTag alone, it does not also show youTag
        - data-testId="removePlayer" — host only, on the filled non-host slot
        - data-testId="emptySlotMessage" — "WAITING_FOR_OPPONENT..." when the second slot has no player yet
    - data-testId="startGame" — host only; disabled unless 2 of 2 players and no game in progress
    - data-testId="waitingForHostToStart" — non-host only, shown once 2 of 2 players and the game hasn't started
    - data-testId="enterGame" — shown to any player once the room's status is IN_PROGRESS; navigates to
      #/games/{activeGameId}
    - data-testId="deleteRoom" — host only
    - data-testId="leaveRoom" — non-host only (the host has no leave control, only deleteRoom)
    - data-testId="errorMessage" — shown when the room fails to load

The room is fetched from GET /rooms/{roomId} on mount.

### Tests

Test cycle prerequisites:

- Mock Router
- Render RoomPage at #/rooms/room-1

#### WHEN the room has 1 of 2 players and the current user is the host SHOULD show WAITING_FOR_PLAYERS status, HOST tag on the host's own slot, an empty second slot, RENAME, and a disabled START_GAME with no LEAVE_ROOM

Prerequisites:

- Mock API GET /rooms/room-1 — return a room with 1 player (the host) and status WAITING_FOR_PLAYERS
- Current user is the host

#### WHEN the room has 2 of 2 players and the current user is the host SHOULD show READY status, REMOVE_PLAYER on the opponent's slot, and an enabled START_GAME

Prerequisites:

- Mock API GET /rooms/room-1 — return a room with 2 players and status WAITING_FOR_PLAYERS
- Current user is the host

#### WHEN the room has 2 of 2 players and the current user is not the host SHOULD show READY status, a YOU tag on the current user's own slot, no RENAME/REMOVE_PLAYER/START_GAME/DELETE_ROOM controls, and a WAITING_FOR_HOST_TO_START notice with LEAVE_ROOM

Prerequisites:

- Mock API GET /rooms/room-1 — return a room with 2 players and status WAITING_FOR_PLAYERS
- Current user is the non-host player

#### WHEN the room's status is IN_PROGRESS SHOULD show GAME_IN_PROGRESS status and an ENTER_GAME control

Prerequisites:

- Mock API GET /rooms/room-1 — return a room with 2 players and status IN_PROGRESS and an activeGameId
- Current user is the host

#### WHEN the current user clicks ENTER_GAME SHOULD navigate to the game view for the room's activeGameId

Prerequisites:

- Mock API GET /rooms/room-1 — return a room with 2 players, status IN_PROGRESS, and activeGameId "game-1"
- Current user is the non-host player

#### WHEN the room fails to load SHOULD show an error message and no room details

Prerequisites:

- Mock API GET /rooms/room-1 — return an error
