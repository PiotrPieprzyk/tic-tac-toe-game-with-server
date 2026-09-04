## User can create a room, but only one. When user creates a room they are the host.

### Status:

To do

### Description

Elements in #/rooms/create:

- data-testId="roomForm" < as wrapper
    - data-testId="roomNameTextField"
        - data-testId="input"
        - data-testId="errorMessage"
    - data-testId="createRoom"
    - data-testId="cancel"

createRoom button is not clickable when roomName is empty or errorMessage is visible.

When createRoom is clicked should change state to loading, then redirect to #/rooms/{roomId}

Error messages:

- ERR: ROOM_NAME_TOO_SHORT — (MIN 3 CHARS)
- ERR: ROOM_NAME_TAKEN — TRY ANOTHER


### Tests

Test cycle prerequisites:

- Mock Router


#### WHEN user type roomName "ValidName", createRoom button SHOULD be clickable and when clicked SHOULD show loading state for createRoom button until redirected to #/rooms/{roomId}

Prerequisites:

- Render RoomForm

#### WHEN user type roomName "TakenName" createRoom button SHOULD NOT be clickable and errorMessage should be visible

Prerequisites:
- Render RoomForm
- Mock API /rooms - should return message: Room name already taken, status: 400

#### WHEN user type roomName "Sh" createRoom button SHOULD NOT be clickable and errorMessage should be visible

Prerequisites:

- Render RoomForm


