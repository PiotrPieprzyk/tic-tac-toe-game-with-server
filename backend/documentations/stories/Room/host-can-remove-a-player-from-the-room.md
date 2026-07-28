## Host can remove a player from the room

### Status:

To do

### Description

The host of a room can remove a player from the room.


### Tests

Test cycle prerequisites:
- create two users

#### WHEN host removes user SHOULD return 200

Prerequisites:
- Created one room
- Two users joined

#### WHEN not-host tries removes host SHOULD return 400

Prerequisites:
- Created one room
- Two users joined


### Required API

- PUT /rooms/:id

```typescript
// Request body
type RemovePlayerFromRoomRequest = {
  usersIds: string[]; // remaining users ids after removal
};

// Response body — 200
type RemovePlayerFromRoomResponse = {
  id: string;
  name: string;
  hostId: string;
  users: { id: string; name: string }[];
};
```
