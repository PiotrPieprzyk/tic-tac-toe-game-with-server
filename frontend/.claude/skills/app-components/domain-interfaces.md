# Domain interfaces cheat sheet

Stable API surface under `src/domain/shared/`. Read this instead of re-reading
every `*Context.tsx`/interface file from scratch when building a new `app/`
feature. Verify against the actual file only if something here looks stale
(these interfaces change rarely, but this file can drift).

## Context hooks (`domain/shared/context/*Context.tsx`)

| Hook | Returns | Throws if no provider? |
|---|---|---|
| `useRoomAPI()` | `RoomAPI` | yes |
| `useUserAPI()` | `UserAPI` | yes |
| `useRouter()` | `Router` | yes |
| `useRoomEventsSocket()` | `RoomEventsSocket` | no — defaults to a no-op (`subscribe` returns a no-op unsubscribe, handlers never fire) |
| `useUserSession()` | `UserId` | no — defaults to `ANONYMOUS_USER_ID` |
| `useUserName()` | `string \| null` | no |
| `useSetUserSession()` | `(userId: UserId, userName: string) => void` | no |

**`useRoomEventsSocket` is not wired to a real implementation in `App.tsx`.**
No `infra` websocket client exists yet — every `app/` component using it
(`RoomList`, `RoomPage`, ...) gets the no-op in the running app today. Story
tests inject a mock socket, so socket-driven behavior is still correctly
tested; it just won't fire for real until that infra piece is built.

## `RoomAPI` (`domain/shared/api/RoomAPI.ts`)

```ts
interface RoomAPI {
    addRoom(body: RoomAPIAddRequest): Promise<RoomAPIResponse | CommonError>;
    getRoom(roomId: RoomId): Promise<RoomAPIResponse | CommonError>;
    getRooms(options?: RoomAPIGetRoomsOptions): Promise<RoomAPIListResponse | CommonError>;
    updateRoom(roomId: RoomId, body: RoomAPIUpdateRequest): Promise<RoomAPIResponse | CommonError>;
    userJoinRoom(roomId: RoomId, body: RoomAPIJoinRequest): Promise<RoomAPIResponse | CommonError>;
    userLeaveRoom(roomId: RoomId, body: RoomAPILeaveRequest): Promise<{} | CommonError>;
    deleteRoom(roomId: RoomId): Promise<RoomAPIDeletedResponse | CommonError>;
    startGame(roomId: RoomId): Promise<GameAPIResponse | CommonError>;
}
```
- `RoomAPIUpdateRequest = { name?: string; usersIds?: UserId[] }` — `usersIds` takes `UserId[]`, not raw strings; wrap with `UserId.create(id)`.
- `RoomAPIAddRequest = { name: string; hostId: UserId; usersIds: UserId[] }`.
- `RoomAPIJoinRequest = { userId: UserId }`, `RoomAPILeaveRequest = { userId: UserId }`.
- Response payloads (`RoomAPIResponseRaw`) are plain data: `{ id, name, hostId, activeGameId, users: UserRaw[], status: GameStatusEnum }` — note `id`/`hostId`/`users[].id` are raw `string`, NOT value objects. See "value object gotcha" below.

## Error handling pattern (`domain/shared/api/APICommon.ts`)

Every API method returns `SomeResponse | CommonError`. Always branch with
`instanceof`:
```ts
const response = await roomAPI.getRoom(roomId);
if (response instanceof CommonError) {
    // response.message, response.status
} else {
    // response.value
}
```
`SuccessResponse<T>` wraps the payload in `.value`. There is no thrown
exception path for expected API failures.

## Value object gotcha (`RoomId`, `UserId`)

`RoomId`/`UserId` are `ValueObject<string>` wrappers (`.value` holds the raw
string) required by every `RoomAPI` method signature. API **response**
payloads (`RoomAPIResponseRaw`, `UserRaw`) hold raw `string` ids, not value
objects — this asymmetry is the most common source of silent bugs:

```ts
const currentUserId = useUserSession(); // UserId
// WRONG — always false, UserId !== string:
const isHost = currentUserId === room.hostId;
// RIGHT:
const isHost = currentUserId.value === room.hostId;
```
Wrap a raw id back into a value object only when calling into `RoomAPI`
(`RoomId.create(room.id)`, `UserId.create(user.id)`); compare raw ids
directly against each other, and value objects directly against each other
(or via `.exact(other)`), never a value object against a raw string.

## `Router` (`domain/shared/service/Router.ts`)

```ts
interface Router {
    push(route: string): void;
    replace(route: string): void;
}
```
Routes are hash paths, e.g. `router.push('#/rooms/' + roomId)`. The `infra`
implementation strips a leading `#` before calling react-router's navigate.

## `UserSession` / `useUserSession`

`useUserSession()` returns a `UserId`, never `null`/`undefined` — anonymous
users get `ANONYMOUS_USER_ID` (exported from `UserSessionContext.tsx`).
Standard anonymous-guard pattern used across `app/` components:
```ts
const currentUserId = useUserSession();
const isAnonymous = !currentUserId || currentUserId === ANONYMOUS_USER_ID;
```

## `RoomEventsSocket` (`domain/shared/service/RoomEventsSocket.ts`)

```ts
type RoomEventsHandlers = {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onRoomAdded?: (room: RoomAPIResponseRaw) => void;
    onRoomEdited?: (room: RoomAPIResponseRaw) => void;
    onRoomDeleted?: (roomId: string) => void;
}
interface RoomEventsSocket {
    subscribe(handlers: RoomEventsHandlers): () => void; // returns unsubscribe
}
```
Standard subscription pattern:
```ts
useEffect(() => {
    return roomEventsSocket.subscribe({
        onRoomEdited: (room) => { /* merge into local state */ },
        onRoomDeleted: (roomId) => { /* remove/redirect */ },
    });
}, [roomEventsSocket]);
```
Always filter events by id in the handler when the component only cares
about one room/entity (events for other ids should be ignored, not just
filtered by luck).