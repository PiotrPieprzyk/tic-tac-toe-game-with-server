## Host can remove a player from the room.

### Status:

To do

### Description

Elements in #/rooms/{roomId}:

- data-testId="roomPage" < as wrapper
    - data-testId="playerSlot" < repeated
        - data-testId="removePlayer" — host only, on the filled non-host slot
    - data-testId="errorMessage"

Clicking removePlayer calls PUT /rooms/{roomId} with usersIds set to the remaining players (the host only).
On success the opponent's slot becomes empty again. On failure an errorMessage is shown and the player stays listed.

### Tests

Test cycle prerequisites:

- Mock Router
- Render RoomPage at #/rooms/{roomId}
- Current user is the host
- Mock API GET /rooms/{roomId} — return a room with 2 of 2 players

#### WHEN the host clicks removePlayer on the opponent's slot SHOULD remove that player and show the slot as empty again

Prerequisites:

- Mock API PUT /rooms/{roomId} — return the room with only the host left

#### WHEN removing the player fails SHOULD show an error message and keep the player listed

Prerequisites:

- Mock API PUT /rooms/{roomId} — return an error
