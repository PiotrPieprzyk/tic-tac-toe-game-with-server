## User can see the list of rooms and players in the room.

### Status:

To do

### Description

User can request a paginated list of all existing rooms. Each room entry includes the room name, id, hostId, status, and current players.

### Tests

Test cycle prerequisites:
- A user exists (created via POST /users)

#### WHEN rooms list is requested and there are no rooms SHOULD return 200 with an empty results array

Prerequisites:
- No rooms exist

#### WHEN rooms list is requested and one room exists SHOULD return 200 with that room in results

Prerequisites:
- One room exists

#### WHEN rooms list is requested SHOULD include each room's id, name, hostId and status

Prerequisites:
- One room exists with a known name and host

#### WHEN rooms list is requested SHOULD include the players currently in each room

Prerequisites:
- One room exists with two players joined

#### WHEN rooms list is requested with pageSize=1 and two rooms exist SHOULD return only one room and a nextPageToken

Prerequisites:
- Two rooms exist

#### WHEN rooms list is requested with a valid pageToken SHOULD return the next page of rooms

Prerequisites:
- Two rooms exist; first page already fetched and nextPageToken obtained

### Required API

- GET /rooms

```typescript
// Query parameters
type GetRoomsQuery = {
  pageToken?: number | null; // page cursor, null means first page
  pageSize?: number | null;  // number of results per page, null means default
};

// Response body — 200
type GetRoomsResponse = {
  results: {
    id: string;
    name: string;
    hostId: string;
    users: { id: string; name: string }[];
  }[];
  nextPageToken: number | null;
  prevPageToken: number | null;
  totalSize: number;
};
```