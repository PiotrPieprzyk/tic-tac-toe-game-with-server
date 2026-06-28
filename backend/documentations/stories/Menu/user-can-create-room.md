## User can create a room, but only one. When user creates a room they are the host.

### Status:

To do

### Description

A user can create a room. The creating user becomes the host and is automatically added as a player. A user can only have one room at a time — attempting to create a second room should be rejected.
Room name must be at least 3 characters and at most 50 characters long.

### Tests

Test cycle prerequisites:
- A user exists (created via POST /users)

#### WHEN user creates a room with a valid name SHOULD return 200 with the created room, the user set as host, and the user added as a player

Prerequisites:
- User exists and has no room

#### WHEN user creates a room with a name shorter than 3 characters SHOULD return 400

Prerequisites:
- User exists and has no room

#### WHEN user creates a room with a name longer than 50 characters SHOULD return 400

Prerequisites:
- User exists and has no room

#### WHEN user creates a room without providing a name SHOULD return 400

Prerequisites:
- User exists and has no room

#### WHEN user tries to create a second room SHOULD return 400

Prerequisites:
- User exists and already owns one room

### Required API

- POST /rooms

```typescript
// Request body
type CreateRoomRequest = {
  name: string;       // 3–50 characters
  hostId: string;     // id of the creating user
  usersIds: string[]; // must include hostId
};

// Response body — 200
type CreateRoomResponse = {
  id: string;
  name: string;
  hostId: string;
  users: { id: string; name: string }[];
};
```
