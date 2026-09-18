## Room events are scoped to a subscribed room.

### Status:

To do

### Description

Besides subscribing to events for every room (`subscribeRooms`), a WebSocket client can subscribe to events for one
specific room via `{action: 'subscribeRoom', roomId}`. Once subscribed to a room, the client receives `roomEdited`
and `roomDeleted` events for that room only — it does not receive events for any other room. A connection holds at
most one active room subscription at a time: sending `subscribeRoom` again with a different `roomId` replaces the
previous subscription (no unsubscribe message is needed, and no explicit unsubscribe is required before switching).

### Tests

Test cycle prerequisites:
- Two users exist, each hosting their own room (via POST /users, POST /rooms)
- A WebSocket client is connected and subscribed to one of the rooms via `subscribeRoom`

#### WHEN the subscribed room is renamed SHOULD receive a RoomEditedEvent for that room

Prerequisites:
- Client subscribed to room A via `subscribeRoom`

#### WHEN a different room is created, renamed and deleted SHOULD NOT deliver any of those events to a client subscribed only to another room

Prerequisites:
- Client subscribed to room A via `subscribeRoom`
- Room B exists, hosted by a different user

#### WHEN the subscribed room is deleted SHOULD receive a RoomDeletedEvent for that room

Prerequisites:
- Client subscribed to room A via `subscribeRoom`

#### WHEN the client resubscribes to a different room on the same connection SHOULD stop receiving events for the previous room and start receiving events for the new one

Prerequisites:
- Client subscribed to room E via `subscribeRoom`
- Room F exists, hosted by a different user

#### WHEN the room the client is now subscribed to is deleted SHOULD receive a RoomDeletedEvent for it

Prerequisites:
- Client resubscribed to room F via `subscribeRoom`

### Required API

- WebSocket /ws — subscribe to a specific room's events

```typescript
// Client -> server: subscribe to one specific room's events.
// Sending this again with a different roomId replaces the previous room subscription
// on this connection (no unsubscribe message exists or is needed).
type SubscribeRoomMessage = {
  action: 'subscribeRoom';
  roomId: string;
};

// Event: the subscribed room's name, players or status changed
type RoomEditedEvent = {
  eventType: 'roomEdited';
  dto: {
    id: string;
    name: string;
    users: { id: string; name: string }[];
    status: GameStatusEnum;
  };
};

// Event: the subscribed room was deleted
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
