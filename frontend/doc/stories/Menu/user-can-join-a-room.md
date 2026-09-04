## User can join a room from the rooms list.

### Status:

To do

### Description

Elements in #/rooms, per roomListItem (see [[user-can-see-list-of-rooms]]):

- data-testId="roomListItem"
    - data-testId="roomStatus"
    - data-testId="joinRoom"
- data-testId="errorMessage" < wrapper-level, shown when a join attempt fails

joinRoom is clickable only when the room's status is WAITING and it is not full (fewer than 2 players).
It is not clickable when the room is IN_PROGRESS, ENDED, or full.

When clicked, joinRoom shows a loading state ("JOINING") until the request resolves, then redirects to
#/rooms/{roomId}.

If the join request fails (room became full, a game started, or the room no longer exists), joinRoom returns to
its default state and errorMessage is shown:

- ERR: UNABLE_TO_JOIN — TRY AGAIN

### Tests

Test cycle prerequisites:

- Mock Router
- Render RoomList
- Mock API /rooms — return one room "ROOM_NULL_PTR" unless stated otherwise

#### WHEN room status is WAITING and not full, joinRoom SHOULD be clickable and when clicked SHOULD show loading state until redirected to #/rooms/{roomId}

Prerequisites:

- Room has status WAITING_FOR_PLAYERS and 1 of 2 players
- Mock API PUT /rooms/:id/join — return 200 with the updated room

#### WHEN room status is IN_PROGRESS, joinRoom SHOULD NOT be clickable

Prerequisites:

- Room has status IN_PROGRESS

#### WHEN room status is ENDED, joinRoom SHOULD NOT be clickable

Prerequisites:

- Room has status ENDED

#### WHEN room is full (2/2 players), joinRoom SHOULD NOT be clickable

Prerequisites:

- Room has status WAITING_FOR_PLAYERS and 2 of 2 players

#### WHEN user clicks joinRoom and the request fails SHOULD show errorMessage and joinRoom SHOULD return to its default clickable state

Prerequisites:

- Room has status WAITING_FOR_PLAYERS and 1 of 2 players
- Mock API PUT /rooms/:id/join — return 400
