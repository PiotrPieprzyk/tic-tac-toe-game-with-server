## Host can delete the room.

### Status:

To do

### Description

Elements in #/rooms/{roomId}:

- data-testId="roomPage" < as wrapper
    - data-testId="deleteRoom" — host only
    - data-testId="errorMessage"

Clicking deleteRoom calls DELETE /rooms/{roomId}. On success the user is redirected to #/rooms. On failure an
errorMessage is shown and the room stays displayed.

### Tests

Test cycle prerequisites:

- Mock Router
- Render RoomPage at #/rooms/{roomId}
- Current user is the host
- Mock API GET /rooms/{roomId} — return a room hosted by the current user

#### WHEN the host clicks deleteRoom SHOULD delete the room and navigate back to #/rooms

Prerequisites:

- Mock API DELETE /rooms/{roomId} — succeed

#### WHEN deleting the room fails SHOULD show an error message and keep the room displayed

Prerequisites:

- Mock API DELETE /rooms/{roomId} — return an error
