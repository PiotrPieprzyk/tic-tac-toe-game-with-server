## User can see the list of rooms and players in each room.

### Status:

To do

### Description

Elements in #/rooms:

- data-testId="roomList" < as wrapper
    - data-testId="createRoom"
    - data-testId="noActiveRoomsFound"
    - data-testId="loading"
    - data-testId="roomListItem" < repeated per room
        - data-testId="roomName"
        - data-testId="roomStatus" — one of WAITING, IN_PROGRESS, ENDED
        - data-testId="roomPlayerCount" — e.g. "1/2", or "ROOM_IS_FULL" when full
        - data-testId="joinRoom"
    - data-testId="pagination" < wrapper, only rendered when totalSize exceeds one page
        - data-testId="prevPage"
        - data-testId="pageIndicator" — e.g. "PAGE 1/3"
        - data-testId="nextPage"

Rooms are fetched from GET /rooms on mount. While the first page is loading, loading is shown instead of the list.
When the response contains no rooms, noActiveRoomsFound is shown instead of the list.
prevPage is not clickable on the first page; nextPage is not clickable on the last page.

### Tests

Test cycle prerequisites:

- Mock Router

#### WHEN rooms are loading SHOULD show loading and SHOULD NOT show noActiveRoomsFound or any roomListItem

Prerequisites:

- Render RoomList
- Mock API /rooms — do not resolve before assertions

#### WHEN no rooms exist SHOULD show noActiveRoomsFound and SHOULD NOT show loading or any roomListItem

Prerequisites:

- Render RoomList
- Mock API /rooms — return empty results

#### WHEN one room exists SHOULD show one roomListItem with its name, status, and player count and SHOULD NOT show noActiveRoomsFound or loading

Prerequisites:

- Render RoomList
- Mock API /rooms — return one room with name "ROOM_NULL_PTR", status WAITING_FOR_PLAYERS, 1 of 2 players

#### WHEN a room is full SHOULD show roomPlayerCount as ROOM_IS_FULL

Prerequisites:

- Render RoomList
- Mock API /rooms — return one room with 2/2 players

#### WHEN rooms list has more than one page SHOULD show pagination with prevPage disabled and nextPage clickable

Prerequisites:

- Render RoomList
- Mock API /rooms — return pageSize rooms and a nextPageToken

#### WHEN user clicks nextPage SHOULD request the next page and show its rooms, and prevPage SHOULD become clickable

Prerequisites:

- Render RoomList
- Mock API /rooms — first call returns page 1 with nextPageToken, second call (with that pageToken) returns page 2

#### WHEN on the last page SHOULD show nextPage disabled

Prerequisites:

- Render RoomList
- Mock API /rooms — return a page with nextPageToken null
