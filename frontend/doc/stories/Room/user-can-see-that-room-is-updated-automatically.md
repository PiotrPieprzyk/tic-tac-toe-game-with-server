## User can see that the room is updated automatically.

### Status:

To do

### Description

Elements in #/rooms/{roomId}:

- data-testId="roomPage" < as wrapper, see [[user-can-see-room-details]]

The room page subscribes to the room events websocket (see backend `rooms-list-is-updated-automatically` story) and
updates without a manual refresh or page reload:

- roomEdited for this room — the room's name/players/status update in place.
- roomDeleted for this room — the user is redirected to #/rooms (the room no longer exists).

Events for a different room are ignored (no state changes as a side effect of an event for another room).

### Tests

Test cycle prerequisites:

- Mock Router
- Render RoomPage at #/rooms/{roomId}
- Mock WebSocket connection

#### WHEN a roomEdited event is received for this room with a new player SHOULD fill the empty slot without a page reload

Prerequisites:

- Mock API GET /rooms/{roomId} — return a room with 1 of 2 players (the host)
- Current user is the host
- Emit roomEdited event for this room with 2 of 2 players

#### WHEN a roomEdited event is received for this room with the opponent removed SHOULD show the slot as empty again

Prerequisites:

- Mock API GET /rooms/{roomId} — return a room with 2 of 2 players
- Current user is the host
- Emit roomEdited event for this room with only the host left

#### WHEN a roomEdited event is received for this room with a new name SHOULD update the displayed room name

Prerequisites:

- Mock API GET /rooms/{roomId} — return a room named "ROOM_NULL_PTR"
- Current user is the host
- Emit roomEdited event for this room with name "NEW_NAME"

#### WHEN a roomEdited event is received for this room with status changed to IN_PROGRESS SHOULD navigate to #/games/game-1

Prerequisites:

- Mock API GET /rooms/{roomId} — return a room with 2 of 2 players and status WAITING_FOR_PLAYERS
- Current user is the host
- Emit roomEdited event for this room with status IN_PROGRESS and an activeGameId

#### WHEN a roomDeleted event is received for this room SHOULD navigate back to #/rooms

Prerequisites:

- Mock API GET /rooms/{roomId} — return a room hosted by the current user
- Emit roomDeleted event for this room's id

#### WHEN a roomEdited or roomDeleted event is received for a different room SHOULD make no change to the displayed room

Prerequisites:

- Mock API GET /rooms/{roomId} — return a room named "ROOM_NULL_PTR"
- Emit roomEdited event for a different room's id with a different name
- Emit roomDeleted event for a different room's id
