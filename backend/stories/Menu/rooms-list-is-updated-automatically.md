## The rooms list is updated automatically.

### Status:

To do

### Description

Clients subscribed to room events receive real-time updates when rooms are added, edited, or deleted. This allows the rooms list in the UI to stay current without manual refresh.

### Tests

Test cycle prerequisites:
- A user exists (created via POST /users)
- Client is connected to the WebSocket and subscribed to room events

#### WHEN a new room is created SHOULD receive a RoomAddedEvent with the new room's data

Prerequisites:
- No prior rooms exist

#### WHEN a room is renamed SHOULD receive a RoomEditedEvent with the updated name

Prerequisites:
- One room exists

#### WHEN a player joins a room SHOULD receive a RoomEditedEvent with the updated players list

Prerequisites:
- One room exists with 1 player

#### WHEN a room's game status changes to IN_PROGRESS SHOULD receive a RoomEditedEvent with the updated status

Prerequisites:
- One room exists with 2 players and a game started

#### WHEN a room is deleted SHOULD receive a RoomDeletedEvent with the room's id

Prerequisites:
- One room exists

#### WHEN the last player leaves a room SHOULD receive a RoomDeletedEvent (room is auto-deleted)

Prerequisites:
- One room exists with 1 player

### Required API

- WebSocket /ws — subscribe to room events

```typescript
// Event: room was added
type RoomAddedEvent = {
  eventType: 'roomAdded';
  dto: {
    id: string;
    name: string;
    hostId: string;
    users: { id: string; name: string }[];
    status: GameStatusEnum;
  };
};

// Event: room name, players or status changed
type RoomEditedEvent = {
  eventType: 'roomEdited';
  dto: {
    id: string;
    name: string;
    users: { id: string; name: string }[];
    status: GameStatusEnum;
  };
};

// Event: room was deleted
type RoomDeletedEvent = {
  eventType: 'roomDeleted';
  dto: {
    id: string;
  };
};

enum GameStatusEnum {
  IN_PROGRESS = 'IN_PROGRESS',
  ENDED = 'ENDED',
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
}
```
