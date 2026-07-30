## Player can leave the room

### Status:

To do

### Description

A player can leave a room they are part of. The room is automatically deleted when the last player leaves the room.

### Tests

Test cycle prerequisites:
- create two users

#### WHEN a player leaves a room with other players remaining SHOULD return 200 and remove that player from the room

Prerequisites:
- Created one room
- Two users joined

#### WHEN the last player leaves a room SHOULD return 200 and delete the room

Prerequisites:
- Created one room
- Only one user in the room

#### WHEN room does not exist SHOULD return 404

Prerequisites:
- None

### Required API

- PUT /rooms/:id/leave

```typescript
// Request body
// The leaving user is identified by the UserId cookie, not a request body field.
type LeaveRoomRequest = {};
```
