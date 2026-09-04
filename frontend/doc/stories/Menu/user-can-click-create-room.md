## User can create a room, but only one. When user creates a room they are the host.

### Status:

To do

### Description

Elements in #/rooms:

- data-testId="userlist" < as wrapper
    - data-testId="createRoom"
    - data-testId="noActiveRoomsFound"
    - data-testId="loading"

createRoom is clickable. When clicked should redirect to #/rooms/create


### Tests
Test cycle prerequisites:

- Mock Router


#### WHEN rooms found and user clicks createRoom button SHOULD be redirected to #/rooms/create

Prerequisites:

- Render ManuRoomList
- Mock API /rooms - return rooms before assertions

#### WHEN no rooms found and user clicks createRoom button SHOULD be redirected to #/rooms/create

Prerequisites:

- Render ManuRoomList
- Mock API /rooms - do not return rooms


#### WHEN rooms loading and user clicks createRoom button SHOULD be redirected to #/rooms/create

Prerequisites:

- Render ManuRoomList
- Mock API /rooms - return rooms after assertions




