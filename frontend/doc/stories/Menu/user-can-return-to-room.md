## User can return to the room they are already in.

### Status:

To do

### Description

Elements in #/rooms, replacing/augmenting elements from [[user-can-see-list-of-rooms]]:

- data-testId="userlist"
    - data-testId="createRoom" < hidden when the user already belongs to a room
    - data-testId="returnToRoom" < shown instead of createRoom when the user already belongs to a room
    - data-testId="alreadyInRoomMessage" < shown when the user already belongs to a room
    - data-testId="roomListItem" < for every room other than the user's own
        - data-testId="joinRoom" < not clickable

A user's current room is looked up via GET /rooms?userId={id}, using the id held in the user store (not by scanning
the paginated GET /rooms list). A user can only be in one room at a time.

When the user belongs to a room:

- returnToRoom is shown instead of createRoom, and redirects to #/rooms/{roomId} when clicked (no additional API
  call — the room id is already known from the GET /rooms?userId={id} response).
- joinRoom on every other roomListItem is not clickable.
- alreadyInRoomMessage is shown:
    - ♦ YOU MUST LEAVE YOUR CURRENT ROOM TO JOIN ANOTHER

When the user does not belong to any room, createRoom is shown and joinRoom on eligible rooms behaves as described
in [[user-can-join-a-room]].

### Tests

Test cycle prerequisites:

- Mock Router
- Render RoomList

#### WHEN user is a member of one of the listed rooms SHOULD show returnToRoom instead of createRoom, and SHOULD show alreadyInRoomMessage

Prerequisites:

- Mock API /rooms — return two rooms
- Mock API /rooms?userId={id} — return the room the current user is a player in

#### WHEN user is a member of one of the listed rooms SHOULD show joinRoom as not clickable on every other room

Prerequisites:

- Mock API /rooms — return two rooms, the other room is WAITING and not full
- Mock API /rooms?userId={id} — return the room the current user is a player in

#### WHEN user clicks returnToRoom SHOULD redirect to #/rooms/{roomId} without calling the join API

Prerequisites:

- Mock API /rooms — return one room
- Mock API /rooms?userId={id} — return the room the current user is a player in

#### WHEN user is not a member of any listed room SHOULD show createRoom and SHOULD NOT show returnToRoom or alreadyInRoomMessage

Prerequisites:

- Mock API /rooms — return one room the current user is not a player in
- Mock API /rooms?userId={id} — return no rooms
