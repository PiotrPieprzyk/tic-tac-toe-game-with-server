## Player can leave the room.

### Status:

To do

### Description

Elements in #/rooms/{roomId}:

- data-testId="roomPage" < as wrapper
    - data-testId="leaveRoom" — non-host only (the host has no leave control, only deleteRoom)
    - data-testId="errorMessage"

Clicking leaveRoom calls PUT /rooms/{roomId}/leave for the current user. On success the user is redirected to
#/rooms. On failure an errorMessage is shown and the player stays in the room.

### Tests

Test cycle prerequisites:

- Mock Router
- Render RoomPage at #/rooms/{roomId}
- Current user is a non-host player
- Mock API GET /rooms/{roomId} — return a room the current user has joined as a non-host

#### WHEN a non-host player clicks leaveRoom SHOULD leave the room and navigate back to #/rooms

Prerequisites:

- Mock API PUT /rooms/{roomId}/leave — succeed

#### WHEN leaving the room fails SHOULD show an error message and keep the player in the room

Prerequisites:

- Mock API PUT /rooms/{roomId}/leave — return an error
