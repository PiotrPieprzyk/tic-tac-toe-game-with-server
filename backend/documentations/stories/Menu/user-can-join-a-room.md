## User can join a room.

### Status:

To do

### Description

A user can join an existing room. 
A room can hold at most 2 players. If the room is already full or a game is in
progress, the user cannot join.
A user cannot join more than one room.

### Tests

Test cycle prerequisites:

- Two users exist (created via POST /users)
- One room exists created by user A

#### WHEN user joins a room with available space SHOULD return 200 with the updated room including the new player

Prerequisites:

- Room has only 1 player (the host)

#### WHEN user tries to join a room that is already full (2 players) SHOULD return 400

Prerequisites:

- Room already has 2 players

#### WHEN user tries to join a room where a game is in progress SHOULD return 400

Prerequisites:

- Room has an active game with status IN_PROGRESS

#### WHEN user tries to join a room they are already in SHOULD return 400

Prerequisites:

- User is already a member of the room

#### WHEN user tries to join a room that does not exist SHOULD return 404

Prerequisites:

- No room with the given id exists

#### WHEN user tries to join a room, even though they already joined to another one SHOULD return 400

Prerequisites:

- User is already a member a room

### Required API

- PUT /rooms/:id/join

```typescript
// URL parameter
type JoinRoomParams = {
    id: string; // room id
};

// Request body
type JoinRoomRequest = {
    userId: string;
};

// Response body — 200
type JoinRoomResponse = {
    id: string;
    name: string;
    hostId: string;
    users: { id: string; name: string }[];
};
```
