## Host can rename the room.

### Status:

To do

### Description

Elements in #/rooms/{roomId}/rename:

- data-testId="roomRenameForm" < as wrapper
    - data-testId="roomNameTextField"
        - data-testId="input" — prefilled with the room's current name
        - data-testId="errorMessage"
    - data-testId="saveRename"
    - data-testId="cancel"

saveRename button is not clickable when roomName is empty, unchanged, or errorMessage is visible.

When saveRename is clicked should change state to loading, then redirect to #/rooms/{roomId}

When cancel is clicked should redirect to #/rooms/{roomId} without renaming

Error messages:

- ERR: ROOM_NAME_TOO_SHORT — (MIN 3 CHARS)
- ERR: ROOM_NAME_TAKEN — TRY ANOTHER

### Tests

Test cycle prerequisites:

- Mock Router
- Render RoomRenameForm at #/rooms/{roomId}/rename

#### WHEN the form loads SHOULD prefill the input with the room's current name

Prerequisites:

- Mock API GET /rooms/{roomId} — return a room named "ROOM_NULL_PTR"

#### WHEN the host types roomName "ValidName", saveRename SHOULD be clickable and when clicked SHOULD show loading state until redirected to #/rooms/{roomId}

Prerequisites:

- Mock API GET /rooms/{roomId} — return a room named "ROOM_NULL_PTR"
- Mock API PUT /rooms/{roomId} — do not resolve before assertions

#### WHEN the host types roomName "Sh" saveRename SHOULD NOT be clickable and errorMessage should be visible

Prerequisites:

- Mock API GET /rooms/{roomId} — return a room named "ROOM_NULL_PTR"

#### WHEN the host submits a taken roomName SHOULD show errorMessage and SHOULD NOT navigate away

Prerequisites:

- Mock API GET /rooms/{roomId} — return a room named "ROOM_NULL_PTR"
- Mock API PUT /rooms/{roomId} — return message: Room name already taken, status: 400

#### WHEN the host clicks cancel SHOULD be redirected to #/rooms/{roomId} without renaming

Prerequisites:

- Mock API GET /rooms/{roomId} — return a room named "ROOM_NULL_PTR"
