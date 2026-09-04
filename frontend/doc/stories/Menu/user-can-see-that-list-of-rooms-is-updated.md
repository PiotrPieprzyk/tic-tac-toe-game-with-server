## User can see that the list of rooms is updated automatically.

### Status:

To do

### Description

Elements in #/rooms:

- data-testId="userlist"
    - data-testId="connectionStatus" — LIVE while the websocket is connected
    - data-testId="roomListItem" < repeated per room, see [[user-can-see-list-of-rooms]]

The rooms list subscribes to the room events websocket (see backend `rooms-list-is-updated-automatically` story) and
updates without a manual refresh or page reload:

- roomAdded — a new roomListItem appears.
- roomEdited — the matching roomListItem's players/status update in place.
- roomDeleted — the matching roomListItem is removed.

Events for rooms outside the currently loaded page are ignored (no page is re-fetched as a side effect of an event).

### Tests

Test cycle prerequisites:

- Mock Router
- Render RoomList
- Mock WebSocket connection

#### WHEN websocket is connected SHOULD show connectionStatus as LIVE

Prerequisites:

- Mock API /rooms — return empty results

#### WHEN a roomAdded event is received SHOULD show a new roomListItem for that room without a page reload

Prerequisites:

- Mock API /rooms — return empty results
- Emit roomAdded event with a new room's data

#### WHEN a roomEdited event is received for a listed room SHOULD update that roomListItem's status and player count in place

Prerequisites:

- Mock API /rooms — return one room with 1 of 2 players and status WAITING_FOR_PLAYERS
- Emit roomEdited event for that room with 2 of 2 players and status IN_PROGRESS

#### WHEN a roomDeleted event is received for a listed room SHOULD remove that roomListItem

Prerequisites:

- Mock API /rooms — return one room
- Emit roomDeleted event for that room's id
