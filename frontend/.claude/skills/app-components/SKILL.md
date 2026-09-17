---
name: app-components
description: Structure and split React components under frontend/src/app/**. Use when creating a new "page"/feature component, or when an existing one under app/** is growing past ~150-200 lines or mixing more than one concern (data fetching, pagination, own-state lookup, rendering) and needs to be split.
---

# Structuring app/ components

Reference implementation: `frontend/src/app/Menu/RoomList/` (root component
`MenuRoomList.tsx` composing `RoomListHeader.tsx` + `RoomList.tsx`, plus
`PaginationAdapter.tsx` and `useOwnRoomId.ts`).

The goal is **high cohesion, low coupling**: each file does one job, can be
read and reasoned about on its own, and doesn't need to know how its
siblings are implemented.

## 1. One folder per feature, one root component

A feature/"page" lives in its own folder under `app/<Feature>/`, e.g.
`app/Menu/RoomList/`. The folder's root component (same name as the folder)
is the only thing imported from outside the folder — it composes the
sub-pieces and owns the outer shell (layout wrapper, root `data-testid`):

```tsx
export function MenuRoomList(): ReactElement {
    return (
        <TerminalCard titleBarLabel="room_list.sh" className="w-full max-w-97.5">
            <div data-testid="roomList" className="flex flex-col">
                <RoomListHeader/>
                <RoomList/>
            </div>
        </TerminalCard>
    );
}
```

Nothing outside the folder should import `RoomListHeader` or `RoomList`
directly — only the root component.

## 2. Split by concern, not by size alone

Split out a new file when a component takes on a second responsibility, even
if it's still short. Signals it's time to split:

- It renders two visually/behaviorally distinct regions (e.g. a header with
  connection status + actions, and a list with its own loading/empty/error
  states) → one component per region.
- It has fetching/state logic that is reusable or independently testable
  (e.g. "does the current user already own a room?") → pull it into its own
  `useXxx.ts` hook.
- It wraps a shared/presentational primitive (e.g. `Pagination`) with
  feature-specific state (page tokens, page index) → give that glue its own
  `XxxAdapter.tsx` instead of inlining it in the component that uses it.

As a rough ceiling, treat ~150-200 lines as a sign the file is doing too
much and should be split by one of the rules above, not by cutting arbitrarily.

## 3. Keep files independent — high cohesion, low coupling

- **One export per file**, named after the file (`RoomListHeader.tsx` exports
  `RoomListHeader`, `useOwnRoomId.ts` exports `useOwnRoomId`).
- A component/hook may depend on **domain context hooks**
  (`useRoomAPI`, `useRouter`, `useUserSession`, ...) and **shared/presentational
  components** (`comp/**`). It must **not** import a sibling component's
  internals, and must not reach into another component's local state.
- If two sibling components independently need the same derived data (e.g.
  both the header and the list need "does the user already have a room?"),
  let each call the same hook independently rather than lifting the state
  into the parent and prop-drilling it down. Prop-drilling to dedupe a fetch
  *increases* coupling (parent now has to know about a child's data need) to
  solve a caching problem — solve caching with a caching layer (e.g.
  TanStack Query) instead, when one is introduced.
- For a child to notify a sibling of something (e.g. the list reporting a
  join error that the header displays), use a small scoped event bus
  (see `MenuEventBus.ts` / `SimpleEventBus.ts`) rather than threading a
  callback prop through the root just to relay it sideways.
- A file should be understandable, and its tests writable, by reading only
  that file plus the shared `domain/` interfaces it calls — never by also
  reading a sibling file first.

## 4. Composition root for dependencies

Concrete `infra` implementations (`SimpleRoomAPI`, `SimpleUserAPI`, ...) are
instantiated once, with `useMemo`, inside the root layout component in
`App.tsx` — never as module-level singletons — and handed down via the
`domain` context providers. This keeps every `app/` component swappable in
tests without touching real infra.

## 5. Testing

See `frontend/.claude/skills/component-tests` for how the story tests in
`doc/stories/**` are written against these components' `data-testid` tree.