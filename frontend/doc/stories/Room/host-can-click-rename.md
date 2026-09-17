## Host can click RENAME to go to the room rename form.

### Status:

To do

### Description

Elements in #/rooms/{roomId}:

- data-testId="roomPage" < as wrapper
    - data-testId="renameRoom" — host only

renameRoom is clickable. When clicked should redirect to #/rooms/{roomId}/rename

### Tests

Test cycle prerequisites:

- Mock Router
- Render RoomPage at #/rooms/room-1
- Current user is the host

#### WHEN the host clicks renameRoom SHOULD be redirected to #/rooms/{roomId}/rename

Prerequisites:

- Mock API GET /rooms/{roomId} — return a room hosted by the current user
