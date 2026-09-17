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

## 0. Before you start: what to read, in order

Building a new `app/<Feature>` page or component always needs the same
handful of inputs. Read them in this order instead of open-endedly exploring
the codebase — it's a fixed list, not a search problem:

1. **The story spec + test** — `doc/stories/<Feature>/<story-name>.md` and
   `.test.ts`. This is the behavioral source of truth: the exact
   `data-testid` tree, button/error copy, and one `#### WHEN ...` per test
   case. If a feature has multiple stories (e.g. `Room/` has 8), skim all of
   them first — they usually share one `data-testid` tree (see `shared/get/`)
   and describe different facets of the same component(s).
2. **`doc/stories/<Feature>/shared/render.ts`** (or wherever the feature's
   render helper lives) — this pins down the *exact* provider nesting order
   your component(s) will be mounted under, and which providers are/aren't
   present (e.g. `RoomRenameForm` is deliberately rendered without a
   `RoomEventsSocketProvider`). It also tells you the **exact import path**
   the test expects (e.g. `from '@/app/Room/RoomPage'`, a bare folder import
   with no filename — that requires an `index.tsx` re-export in the folder,
   not just a same-named `.tsx` file inside it).
3. **`doc/stories/<Feature>/shared/{mocks,builders}.ts` and `get/*.ts`** —
   the mock factories tell you the exact domain interface shapes you're
   coding against; the `get/*.ts` getters tell you the exact nesting of
   `data-testid`s to render (outer to inner).
4. **The matching section of `doc/design/*.dc.html`** — visual structure,
   exact copy/labels, color/tone per state. Grep the file for the feature
   name or a testid string if it's a large single-file mockup.
5. **The closest existing sibling feature**, to copy conventions rather than
   invent them: a list-style page → `Menu/RoomList/`; a single-submit form →
   `Menu/RoomForm.tsx`. Read its root component and one or two children in
   full, not just the exports.
6. **`src/comp/` inventory** — list the folder, skim each component's props.
   Cross-check against the design mockup's own "Design System" / component
   inventory section (if it has one) to find components the mockup expects
   that don't exist yet under `comp/` — those need to be built first, using
   the same conventions (see step 5's sibling components for the pattern:
   `Record<Variant, string>` class maps, `className`/`...rest` passthrough,
   theme type-scale classes only).
7. **Domain interfaces** — see `domain-interfaces.md` in this skill folder
   for a standing cheat sheet of `RoomAPI`/`UserSession`/`Router`/
   `RoomEventsSocket` shapes, the value-object comparison gotcha, and the
   `useRoomEventsSocket` no-op-in-prod caveat. Only re-read the actual
   `domain/shared/**` source if something in the cheat sheet looks stale.

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

## 6. Domain interfaces reference

See `domain-interfaces.md` in this skill folder for the `RoomAPI` /
`UserSession` / `Router` / `RoomEventsSocket` shapes, the value-object
comparison gotcha, and known gaps (no real `RoomEventsSocket` infra wired
into `App.tsx` yet).