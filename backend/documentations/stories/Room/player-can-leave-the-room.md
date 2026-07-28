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

#### WHEN a user who is not in the room tries to leave SHOULD return 400

Prerequisites:
- Created one room

#### WHEN room does not exist SHOULD return 404

Prerequisites:
- None

### Required API

- PUT /rooms/leave

```typescript
// Request body
type LeaveRoomRequest = {
  roomId: string;
  userId: string;
};
```
