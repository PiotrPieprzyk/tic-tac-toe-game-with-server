## Host can rename the room

### Status:

To do

### Description

The host of a room can rename it. Only the host is allowed to rename the room. Room name must be at least 3 characters and at most 50 characters long.

### Tests

Test cycle prerequisites:
- create two users

#### WHEN host renames the room with a valid name SHOULD return 200 with the updated name

Prerequisites:
- Created one room
- Two users joined

#### WHEN not-host tries to rename the room SHOULD return 400

Prerequisites:
- Created one room
- Two users joined

#### WHEN host renames the room with a name shorter than 3 characters, longer than 50 characters SHOULD return 400

Prerequisites:
- Created one room

#### WHEN room does not exist SHOULD return 404

Prerequisites:
- None

### Required API

- PUT /rooms/:id

```typescript
// Request body
// The acting user is identified by the UserId cookie, not a request body field.
type RenameRoomRequest = {
  name: string; // 3–50 characters
};

// Response body — 200
type RenameRoomResponse = {
  id: string;
  name: string;
  hostId: string;
  users: { id: string; name: string }[];
};
```
